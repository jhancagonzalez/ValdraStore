"use client";

import { type FormEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { appendDesignBrief } from "@/lib/design-brief";
import { checkDesignRequest, type DesignGuardMode } from "@/lib/design-guard";
import { extractDesignText } from "@/lib/design-text";
import type { MockupBase, MockupSize } from "@/lib/mockup-bases";
import { type MockupSelection, REVISION_ZONE_PRESETS } from "@/lib/mockup-selection";
import {
  addProposalVersion,
  compareProposalWith,
  EMPTY_PROPOSAL_HISTORY,
  getCurrentProposal,
  getProposalVersion,
  type ProposalHistory,
  selectProposalVersion,
} from "@/lib/proposal-history";
import { useToast } from "../_components/toast";
import type { Approval } from "./approve-design";
import {
  CLIENT_GENERATION_TIMEOUT_MS,
  clamp01,
  type FormIssue,
  formIssue,
  MIN_SELECTION_SIZE,
} from "./personalization-config";

type UseDesignGenerationArgs = {
  ideaOpen: boolean;
  selectedBase: MockupBase;
  selectedSize: MockupSize | null;
};

/**
 * Estado y acciones del flujo de diseño (HU-12, HU-16): idea, referencia,
 * propuesta generada, historial de versiones y aprobación. Todo vive en el
 * navegador; nada se persiste hasta aprobar.
 */
export const useDesignGeneration = ({
  ideaOpen,
  selectedBase,
  selectedSize,
}: UseDesignGenerationArgs) => {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [ideaError, setIdeaError] = useState<FormIssue | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [designBrief, setDesignBrief] = useState("");
  const [lastStrategy, setLastStrategy] = useState<"addition" | "text" | null>(null);
  const [selection, setSelection] = useState<MockupSelection | null>(null);
  const [selectionZone, setSelectionZone] = useState<string | null>(null);
  const [lastZoneLabel, setLastZoneLabel] = useState<string | null>(null);
  const [selectionDrag, setSelectionDrag] = useState<{ x: number; y: number } | null>(null);
  const [approvedDesign, setApprovedDesign] = useState<Approval | null>(null);
  // HU-16: todas las versiones del proceso, solo en memoria del navegador.
  const [history, setHistory] = useState<ProposalHistory>(EMPTY_PROPOSAL_HISTORY);
  const [revisingFrom, setRevisingFrom] = useState<number | null>(null);
  const [designFocus, setDesignFocus] = useState<"image" | "text" | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const timedOutRef = useRef(false);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef(0);

  const detectedText = previousImage ? extractDesignText(idea) : null;
  const downloadExtension = generatedImage?.startsWith("data:image/png")
    ? "png"
    : generatedImage?.startsWith("data:image/webp")
      ? "webp"
      : "jpg";
  const currentProposal = getCurrentProposal(history);
  const comparedProposal = getProposalVersion(history, history.compareVersion);
  const compareImage = currentProposal ? (comparedProposal?.image ?? null) : previousImage;
  const compareLabel = comparedProposal
    ? `Versión ${comparedProposal.version}`
    : compareImage
      ? "Diseño anterior"
      : "Prenda base";
  const hasUnsavedDesign = Boolean(
    (generatedImage || previousImage || history.versions.length > 0) && !approvedDesign,
  );

  useEffect(() => {
    if (!ideaOpen) {
      return;
    }

    if (generatedImage) {
      resultRef.current?.focus();
    } else {
      ideaRef.current?.focus();
    }
  }, [ideaOpen, generatedImage]);

  // La fila «Imagen» del panel abre el diseñador y lleva el foco al archivo.
  useEffect(() => {
    if (!ideaOpen || designFocus !== "image") {
      return;
    }

    const input = formRef.current?.querySelector<HTMLInputElement>(".reference-upload-input");
    input?.focus();
    setDesignFocus(null);
  }, [designFocus, ideaOpen]);

  // Lleva el aviso o el progreso a la vista: el cliente no tiene que buscarlos.
  useEffect(() => {
    if (!ideaError && !generationError && !generating) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    noticeRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [ideaError, generationError, generating]);

  useEffect(() => {
    if (!approvedDesign) {
      return;
    }

    resultRef.current?.focus();
  }, [approvedDesign]);

  useEffect(() => {
    if (!generating || generationStartedAt === null) {
      setElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - generationStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [generating, generationStartedAt]);

  useEffect(
    () => () => {
      generationAbortRef.current?.abort();
    },
    [],
  );

  const confirmDiscardDraft = () =>
    !hasUnsavedDesign ||
    window.confirm(
      "Tu diseño se perderá porque no se guarda en la base de datos. Descárgalo antes de salir si quieres conservarlo. ¿Quieres continuar?",
    );

  const resetGeneratedState = () => {
    generationIdRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerating(false);
    setIdeaError(null);
    setGenerationError(null);
    setGeneratedImage(null);
    setPreviousImage(null);
    setGeneratedPrompt(null);
    setDesignBrief("");
    setReferenceImage(null);
    setLastStrategy(null);
    setSelection(null);
    setSelectionZone(null);
    setLastZoneLabel(null);
    setSelectionDrag(null);
    setApprovedDesign(null);
    setHistory(EMPTY_PROPOSAL_HISTORY);
    setRevisingFrom(null);
  };

  /** Cierra el panel de diseño conservando solo lo que ya se aprobó. */
  const prepareClose = () => {
    generationIdRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerating(false);
    setIdeaError(null);
    setGenerationError(null);

    // Si el diseño ya se aprobó, al cerrar se descarta la copia local: ya está
    // registrado y no debe disparar el aviso de «diseño sin guardar».
    if (approvedDesign) {
      setGeneratedImage(null);
      setPreviousImage(null);
      setGeneratedPrompt(null);
      setHistory(EMPTY_PROPOSAL_HISTORY);
      setRevisingFrom(null);
    }

    setApprovedDesign(null);
    setReferenceImage(null);
  };

  const selectZone = (zone: { id: string; selection: MockupSelection }) => {
    setSelection({ ...zone.selection });
    setSelectionZone(zone.id);
    setIdeaError(null);
  };

  const selectFreeZone = () => {
    setSelection((current) => current ?? { x: 0.58, y: 0.28, width: 0.12, height: 0.12 });
    setSelectionZone("custom");
    setIdeaError(null);
  };

  const adjustSelection = (patch: Partial<MockupSelection>) => {
    setSelection((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      next.width = Math.max(MIN_SELECTION_SIZE, clamp01(next.width));
      next.height = Math.max(MIN_SELECTION_SIZE, clamp01(next.height));
      next.x = Math.max(0, Math.min(next.x, 1 - next.width));
      next.y = Math.max(0, Math.min(next.y, 1 - next.height));
      return next;
    });
    setSelectionZone("custom");
    setIdeaError(null);
  };

  const selectionPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  };

  const handleSelectionPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!previousImage || generatedImage || generating) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = selectionPoint(event);
    setSelectionDrag(point);
    setSelectionZone("custom");
    setSelection({ x: point.x, y: point.y, width: 0, height: 0 });
    setIdeaError(null);
  };

  const handleSelectionPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectionDrag) {
      return;
    }
    const point = selectionPoint(event);
    setSelection({
      x: Math.min(selectionDrag.x, point.x),
      y: Math.min(selectionDrag.y, point.y),
      width: Math.abs(point.x - selectionDrag.x),
      height: Math.abs(point.y - selectionDrag.y),
    });
  };

  const handleSelectionPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectionDrag) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setSelectionDrag(null);

    if (
      !selection ||
      selection.width < MIN_SELECTION_SIZE ||
      selection.height < MIN_SELECTION_SIZE
    ) {
      setSelection(null);
      setSelectionZone(null);
    }
  };

  const handleIdeaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedIdea = idea.trim();
    // HU-13: con una imagen de referencia la descripción es opcional; la
    // imagen se imprime tal cual y solo el texto ajusta la ubicación.
    const referenceOnly = !previousImage && trimmedIdea === "" && referenceImage !== null;

    if (trimmedIdea === "" && !referenceOnly) {
      setIdeaError(
        checkDesignRequest({ idea: "", mode: previousImage ? "zone" : "create" }) ??
          formIssue("Falta tu descripción", "Escribe tu idea antes de continuar."),
      );
      ideaRef.current?.focus();
      return;
    }

    if (!selectedSize) {
      setIdeaError(formIssue("Falta la talla", "Selecciona una talla antes de continuar."));
      return;
    }

    const strategy = previousImage ? (detectedText ? "text" : "addition") : undefined;

    if (
      previousImage &&
      (!selection || selection.width < MIN_SELECTION_SIZE || selection.height < MIN_SELECTION_SIZE)
    ) {
      setIdeaError(
        formIssue(
          "Marca la zona que quieres cambiar",
          "Arrastra sobre la imagen o elige «Pecho» o «Bajo». Para otro diseño, inicia una nueva personalización.",
        ),
      );
      return;
    }

    // Normas de uso: mismas reglas que el servidor, sin gastar cuota. Sin
    // descripción no hay texto que revisar: solo se compone la referencia.
    const guardMode: DesignGuardMode = !previousImage ? "create" : detectedText ? "text" : "zone";
    const guardIssue =
      trimmedIdea === ""
        ? null
        : checkDesignRequest({
            baseColorKey: selectedBase.colorKey,
            idea: trimmedIdea,
            mode: guardMode,
            selectionArea:
              guardMode === "zone" && selection ? selection.width * selection.height : undefined,
          });

    if (guardIssue) {
      setIdeaError(guardIssue);
      return;
    }

    const zoneLabel =
      selectionZone && selectionZone !== "custom"
        ? (REVISION_ZONE_PRESETS.find((zone) => zone.id === selectionZone)?.label ?? null)
        : previousImage
          ? "Selección libre"
          : null;

    const requestId = generationIdRef.current + 1;
    generationIdRef.current = requestId;
    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;
    timedOutRef.current = false;
    const timeout = window.setTimeout(() => {
      timedOutRef.current = true;
      controller.abort();
    }, CLIENT_GENERATION_TIMEOUT_MS);

    setIdeaError(null);
    setGenerationError(null);
    setGeneratedImage(null);
    setGeneratedPrompt(null);
    setLastZoneLabel(zoneLabel);
    setLastStrategy(strategy ?? null);
    setGenerationStartedAt(Date.now());
    setGenerating(true);

    try {
      const response = await fetch("/api/personalization/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseId: selectedBase.id,
          idea: trimmedIdea,
          mode: previousImage ? "revise" : "create",
          referenceImage: previousImage ?? referenceImage ?? undefined,
          selection: previousImage ? selection : undefined,
          size: selectedSize,
          strategy,
        }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as {
        error?: unknown;
        image?: unknown;
        message?: unknown;
        prompt?: unknown;
        suggestedColorKey?: unknown;
        title?: unknown;
      } | null;

      if (requestId !== generationIdRef.current) {
        return;
      }

      // El servidor rechazó la petición por las normas de uso: se explica junto al campo.
      if (response.status === 422) {
        setIdeaError({
          message:
            typeof data?.message === "string"
              ? data.message
              : typeof data?.error === "string"
                ? data.error
                : "No podemos aplicar ese cambio.",
          suggestedColorKey:
            typeof data?.suggestedColorKey === "string" ? data.suggestedColorKey : undefined,
          title: typeof data?.title === "string" ? data.title : "Revisa tu descripción",
        });
        return;
      }

      if (!response.ok || typeof data?.image !== "string") {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "No pudimos generar la propuesta. Inténtalo de nuevo.";
        throw new Error(message);
      }

      const image = data.image;
      const prompt = typeof data.prompt === "string" ? data.prompt : null;
      const brief = appendDesignBrief(designBrief, trimmedIdea);

      setGeneratedImage(image);
      setGeneratedPrompt(prompt);
      setDesignBrief(brief);
      // HU-16: cada propuesta queda como una versión nueva del historial.
      setHistory((current) =>
        addProposalVersion(current, {
          basedOn: previousImage ? revisingFrom : null,
          brief,
          image,
          prompt,
          request: trimmedIdea,
          strategy: strategy ?? "create",
          zoneLabel,
        }),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (timedOutRef.current && requestId === generationIdRef.current) {
          setGenerationError(
            "La generación tardó demasiado y la detuvimos. Inténtalo de nuevo en unos segundos.",
          );
        }
        return;
      }

      if (requestId !== generationIdRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No pudimos generar la propuesta. Inténtalo de nuevo.";
      setGenerationError(message);

      if (error instanceof TypeError) {
        toast({
          title: "No pudimos conectar con el servidor",
          description: "Revisa tu conexión e inténtalo de nuevo.",
          tone: "error",
        });
      }
    } finally {
      window.clearTimeout(timeout);
      if (requestId === generationIdRef.current) {
        setGenerating(false);
        generationAbortRef.current = null;
      }
    }
  };

  const cancelGeneration = () => {
    generationIdRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerating(false);
  };

  /** Muestra una versión del historial como propuesta actual (HU-16). */
  const showProposalVersion = (version: number) => {
    const next = selectProposalVersion(history, version);
    const proposal = getCurrentProposal(next);

    if (!proposal) {
      return;
    }

    setHistory(next);
    setGeneratedImage(proposal.image);
    setGeneratedPrompt(proposal.prompt);
    setLastStrategy(proposal.strategy === "create" ? null : proposal.strategy);
    setLastZoneLabel(proposal.zoneLabel);
    setIdea(proposal.request);
    setDesignBrief(proposal.brief);
    setGenerationError(null);
    setIdeaError(null);
  };

  const compareVersion = (version: number | null) => {
    setHistory((current) => compareProposalWith(current, version));
  };

  const cancelRevision = () => {
    if (history.currentVersion !== null) {
      showProposalVersion(history.currentVersion);
    }
  };

  const beginRevision = () => {
    if (!generatedImage) {
      return;
    }

    setRevisingFrom(history.currentVersion);
    setPreviousImage(generatedImage);
    setGeneratedImage(null);
    setGeneratedPrompt(null);
    setGenerationError(null);
    setIdeaError(null);
    setIdea("");
    setLastStrategy(null);
    setSelection(null);
    setSelectionZone(null);
    setLastZoneLabel(null);
    setSelectionDrag(null);
    setApprovedDesign(null);
    setReferenceImage(null);
  };

  const handleApproved = (approval: Approval) => {
    setApprovedDesign(approval);
    toast({
      title: "Diseño aprobado",
      description: "Quedó registrado en tu cuenta. Puedes descargarlo para conservarlo.",
      tone: "success",
      duration: 6000,
    });
  };

  const handleDownload = () => {
    toast({
      title: "Descarga iniciada",
      description: "Si el archivo no aparece, revisa la carpeta de descargas de tu navegador.",
      tone: "info",
    });
  };

  const clearIdeaError = () => setIdeaError(null);

  return {
    adjustSelection,
    approvedDesign,
    cancelGeneration,
    cancelRevision,
    beginRevision,
    clearIdeaError,
    compareImage,
    compareLabel,
    compareVersion,
    confirmDiscardDraft,
    currentProposal,
    detectedText,
    downloadExtension,
    elapsedSeconds,
    formRef,
    generationError,
    generatedImage,
    generatedPrompt,
    generating,
    handleApproved,
    handleDownload,
    handleIdeaSubmit,
    handleSelectionPointerDown,
    handleSelectionPointerMove,
    handleSelectionPointerUp,
    hasUnsavedDesign,
    history,
    idea,
    ideaError,
    ideaRef,
    lastStrategy,
    lastZoneLabel,
    noticeRef,
    prepareClose,
    previousImage,
    referenceImage,
    resetGeneratedState,
    resultRef,
    revisingFrom,
    selectFreeZone,
    selectZone,
    selection,
    selectionZone,
    setDesignFocus,
    setIdea,
    setReferenceImage,
    showProposalVersion,
  };
};
