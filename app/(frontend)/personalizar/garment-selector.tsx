"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { appendDesignBrief } from "@/lib/design-brief";
import { checkDesignRequest, type DesignGuardMode } from "@/lib/design-guard";
import { extractDesignText } from "@/lib/design-text";
import {
  getMockupBase,
  getMockupBaseName,
  MOCKUP_BASES,
  MOCKUP_SIZES,
  type MockupCategory,
  type MockupSize,
} from "@/lib/mockup-bases";
import {
  isSleeveSelection,
  type MockupSelection,
  REVISION_ZONE_PRESETS,
} from "@/lib/mockup-selection";
import {
  addProposalVersion,
  compareProposalWith,
  EMPTY_PROPOSAL_HISTORY,
  getCurrentProposal,
  getProposalVersion,
  type ProposalHistory,
  selectProposalVersion,
} from "@/lib/proposal-history";
import { DesignNotice, type DesignNoticeAction } from "./design-notice";
import { ProposalHistoryPanel } from "./proposal-history";

const IDEA_MAX_LENGTH = 600;
const IDEA_SUGGESTIONS = ["Floral minimalista", "Geométrico", "Retro", "Tipografía pequeña"];
const REVISION_SUGGESTIONS = [
  "Más minimalista",
  "Más color",
  "Cambiar composición",
  "Añadir textura",
];
const ZONE_SUGGESTIONS = ["Agregar elemento", "Quitar elemento", "Cambiar color", "Agregar texto"];
const STYLE_CHANGE_PATTERN =
  /\b(realista|realistas|realistic|acuarela|watercolor|minimalista|minimalist|estilo|style|profesional|professional|moderno|modern|vintage|retro|textura|texture|geométrico|geometric)\b/i;
const CATEGORY_ORDER: MockupCategory[] = ["camisetas", "hoodies"];
const CATEGORY_LABELS: Record<MockupCategory, string> = {
  camisetas: "Camisetas",
  hoodies: "Hoodies",
};
const STEPS = ["Prenda", "Idea", "Propuesta"] as const;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M14 8H2m5-5L2 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true" focusable="false">
    <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="12"
    height="12"
    aria-hidden="true"
    focusable="false"
    style={{ flex: "0 0 auto" }}
  >
    <rect x="3" y="7" width="10" height="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const MIN_SELECTION_SIZE = 0.02;
/** Si el proveedor no responde en este tiempo, se corta y se ofrece reintentar. */
const CLIENT_GENERATION_TIMEOUT_MS = 200_000;

/** Problema que el cliente debe resolver antes de generar (HU-12, HU-16). */
type FormIssue = {
  title: string;
  message: string;
  suggestRedesign?: boolean;
  suggestedColorKey?: string;
};

const formIssue = (title: string, message: string, suggestRedesign = false): FormIssue => ({
  title,
  message,
  suggestRedesign,
});

type GarmentSelectorProps = {
  initialBaseId: string;
  initialSize: MockupSize | null;
  isAuthenticated: boolean;
};

/**
 * Selector de prenda base (HU-11), flujo de idea (HU-12) y modificaciones con
 * historial de propuestas (HU-16).
 * La selección y la propuesta viven solo en el navegador: no se persisten en
 * Payload. El resultado se descarga y se advierte antes de salir.
 */
export const GarmentSelector = ({
  initialBaseId,
  initialSize,
  isAuthenticated,
}: GarmentSelectorProps) => {
  const initialBase = getMockupBase(initialBaseId) ?? MOCKUP_BASES[0];
  const [activeCategory, setActiveCategory] = useState<MockupCategory>(initialBase.category);
  const [selectedId, setSelectedId] = useState(initialBase.id);
  const [selectedSize, setSelectedSize] = useState<MockupSize | null>(initialSize);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [ideaError, setIdeaError] = useState<FormIssue | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [designBrief, setDesignBrief] = useState("");
  const [revisionMode, setRevisionMode] = useState<"zone" | "redesign">("zone");
  const [lastStrategy, setLastStrategy] = useState<"inpaint" | "text" | "redesign" | null>(null);
  const [selection, setSelection] = useState<MockupSelection | null>(null);
  const [selectionZone, setSelectionZone] = useState<string | null>(null);
  const [lastZoneLabel, setLastZoneLabel] = useState<string | null>(null);
  const [selectionDrag, setSelectionDrag] = useState<{ x: number; y: number } | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  // HU-16: todas las versiones del proceso, solo en memoria del navegador.
  const [history, setHistory] = useState<ProposalHistory>(EMPTY_PROPOSAL_HISTORY);
  const [revisingFrom, setRevisingFrom] = useState<number | null>(null);
  const [sizeMissing, setSizeMissing] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const timedOutRef = useRef(false);
  const sizeOptionsRef = useRef<HTMLDivElement>(null);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const customizeRef = useRef<HTMLButtonElement>(null);
  const authDialogRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLUListElement>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef(0);

  const categoryBases = MOCKUP_BASES.filter((base) => base.category === activeCategory);
  const selectedBase = categoryBases.find((base) => base.id === selectedId) ?? categoryBases[0];
  const currentIndex = Math.max(
    0,
    categoryBases.findIndex((base) => base.id === selectedBase.id),
  );
  const previousBase =
    categoryBases[(currentIndex - 1 + categoryBases.length) % categoryBases.length];
  const nextBase = categoryBases[(currentIndex + 1) % categoryBases.length];
  const selectedName = getMockupBaseName(selectedBase);
  const detectedText = previousImage && revisionMode === "zone" ? extractDesignText(idea) : null;
  const suggestions = previousImage
    ? revisionMode === "redesign"
      ? REVISION_SUGGESTIONS
      : ZONE_SUGGESTIONS
    : IDEA_SUGGESTIONS;
  const nextPath = `/personalizar?base=${encodeURIComponent(selectedBase.id)}&size=${
    selectedSize ?? ""
  }`;
  const downloadExtension = generatedImage?.startsWith("data:image/png")
    ? "png"
    : generatedImage?.startsWith("data:image/webp")
      ? "webp"
      : "jpg";
  const activeStep = ideaOpen ? (generatedImage ? 2 : 1) : 0;
  const currentProposal = getCurrentProposal(history);
  const comparedProposal = getProposalVersion(history, history.compareVersion);
  const compareImage = currentProposal ? (comparedProposal?.image ?? null) : previousImage;
  const compareLabel = comparedProposal
    ? `Versión ${comparedProposal.version}`
    : compareImage
      ? "Diseño anterior"
      : "Prenda base";
  // Aviso visible de la barra: explica por qué no se puede continuar todavía.
  const barNotice = !selectedSize
    ? sizeMissing
      ? "Elige una talla antes de personalizar."
      : "Elige una talla para continuar."
    : isAuthenticated
      ? `Talla ${selectedSize} seleccionada. Continúa con tu idea.`
      : "Para personalizar debes iniciar sesión. Tu prenda y talla se conservan.";
  const barNoticeTone = !selectedSize && sizeMissing ? "error" : "info";

  const closeAuthPrompt = () => {
    setAuthPromptOpen(false);
    customizeRef.current?.focus();
  };

  useEffect(() => {
    if (!authPromptOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    authDialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setAuthPromptOpen(false);
        customizeRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = authDialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [authPromptOpen]);

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

  // Keeps the active thumbnail visible when arrows reach an item outside the rail.
  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLButtonElement>(`[data-base-id="${selectedId}"]`);
    const item = active?.parentElement;
    if (!rail || !item) {
      return;
    }
    const railRect = rail.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const left = itemRect.left - railRect.left + rail.scrollLeft;
    const right = left + itemRect.width;
    if (left < rail.scrollLeft || right > rail.scrollLeft + rail.clientWidth) {
      rail.scrollLeft = Math.max(0, left - 4);
    }
  }, [selectedId]);

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
    if (!generating || generationStartedAt === null) {
      setElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - generationStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [generating, generationStartedAt]);

  const hasUnsavedDesign = Boolean(generatedImage || previousImage || history.versions.length);

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
    setRevisionMode("zone");
    setLastStrategy(null);
    setSelection(null);
    setSelectionZone(null);
    setLastZoneLabel(null);
    setSelectionDrag(null);
    setHistory(EMPTY_PROPOSAL_HISTORY);
    setRevisingFrom(null);
  };

  useEffect(() => {
    if (!hasUnsavedDesign) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onInternalLink = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;

      if (!target || target.hasAttribute("download")) {
        return;
      }

      const href = target.getAttribute("href");

      if (!href?.startsWith("/") || href.startsWith("//")) {
        return;
      }

      if (
        !window.confirm(
          "Tu diseño se perderá porque no se guarda en la base de datos. Descárgalo antes de salir si quieres conservarlo. ¿Quieres continuar?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onInternalLink, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onInternalLink, true);
    };
  }, [hasUnsavedDesign]);

  useEffect(
    () => () => {
      generationAbortRef.current?.abort();
    },
    [],
  );

  const selectBase = (id: string) => {
    if (id === selectedId) {
      return;
    }
    if (!confirmDiscardDraft()) {
      return;
    }
    setSelectedId(id);
    setIdeaOpen(false);
    resetGeneratedState();
  };

  const selectSize = (size: MockupSize) => {
    if (size === selectedSize) {
      return;
    }
    if (!confirmDiscardDraft()) {
      return;
    }
    setSelectedSize(size);
    setSizeMissing(false);
    resetGeneratedState();
  };

  const selectCategory = (category: MockupCategory) => {
    if (category === activeCategory) {
      return;
    }

    // Keep the same color when switching between t-shirts and hoodies.
    const nextBase =
      MOCKUP_BASES.find(
        (base) => base.category === category && base.colorKey === selectedBase.colorKey,
      ) ?? MOCKUP_BASES.find((base) => base.category === category);

    if (!nextBase || !confirmDiscardDraft()) {
      return;
    }

    setActiveCategory(category);
    setSelectedId(nextBase.id);
    setIdeaOpen(false);
    resetGeneratedState();
  };

  const closeIdeaPanel = () => {
    generationIdRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerating(false);
    setIdeaOpen(false);
    setIdeaError(null);
    setGenerationError(null);
    customizeRef.current?.focus();
  };

  const handleCustomize = () => {
    if (!selectedSize) {
      setSizeMissing(true);
      sizeOptionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      return;
    }
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    setIdeaOpen(true);
  };

  const appendSuggestion = (suggestion: string) => {
    if (suggestion === "Agregar texto") {
      setIdea("agrega la palabra ");
      setIdeaError(null);
      ideaRef.current?.focus();
      return;
    }

    setIdea((current) => {
      const next = current.trim() ? `${current.trim()}, ${suggestion.toLowerCase()}` : suggestion;
      return next.slice(0, IDEA_MAX_LENGTH);
    });
    setIdeaError(null);
    ideaRef.current?.focus();
  };

  const selectZone = (zone: { id: string; selection: MockupSelection }) => {
    setSelection({ ...zone.selection });
    setSelectionZone(zone.id);
    setIdeaError(null);
  };

  const changeRevisionMode = (mode: "zone" | "redesign") => {
    setRevisionMode(mode);
    setIdeaError(null);
    setGenerationError(null);
  };

  const selectionPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  };

  const handleSelectionPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!previousImage || generatedImage) {
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

    if (trimmedIdea === "") {
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

    const isRedesign = revisionMode === "redesign";
    const strategy = !previousImage
      ? undefined
      : isRedesign
        ? "redesign"
        : detectedText
          ? "text"
          : "inpaint";

    if (
      previousImage &&
      !isRedesign &&
      (!selection || selection.width < MIN_SELECTION_SIZE || selection.height < MIN_SELECTION_SIZE)
    ) {
      setIdeaError(
        formIssue(
          "Marca la zona que quieres cambiar",
          "Arrastra sobre la imagen o elige «Pecho» o «Bajo». Para cambiar todo el diseño, usa «Rediseñar estampado».",
          true,
        ),
      );
      return;
    }

    if (
      previousImage &&
      !isRedesign &&
      selection &&
      isSleeveSelection(selection, selectedBase.category)
    ) {
      setIdeaError(
        formIssue(
          "Las mangas no se editan por zona",
          "Para cambios en las mangas, usa «Rediseñar estampado».",
          true,
        ),
      );
      return;
    }

    // Normas de uso: mismas reglas que el servidor, sin gastar cuota.
    const guardMode: DesignGuardMode = !previousImage
      ? "create"
      : isRedesign
        ? "redesign"
        : detectedText
          ? "text"
          : "zone";
    const guardIssue = checkDesignRequest({
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

    const zoneLabel = isRedesign
      ? "Estampado completo"
      : selectionZone && selectionZone !== "custom"
        ? (REVISION_ZONE_PRESETS.find((zone) => zone.id === selectionZone)?.label ?? null)
        : previousImage
          ? "Zona personalizada"
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
          designBrief: previousImage ? designBrief : undefined,
          idea: trimmedIdea,
          mode: previousImage ? "revise" : "create",
          referenceImage: previousImage ?? undefined,
          selection: previousImage && !isRedesign ? selection : undefined,
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
        suggestRedesign?: unknown;
        suggestedColorKey?: unknown;
        title?: unknown;
      } | null;

      if (requestId !== generationIdRef.current) {
        return;
      }

      // El servidor rechazó la petición por las normas de uso: se explica junto al campo.
      if (response.status === 422 && typeof data?.title === "string") {
        setIdeaError({
          message: typeof data.message === "string" ? data.message : String(data.error ?? ""),
          suggestRedesign: data.suggestRedesign === true,
          suggestedColorKey:
            typeof data.suggestedColorKey === "string" ? data.suggestedColorKey : undefined,
          title: data.title,
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

      setGenerationError(
        error instanceof Error
          ? error.message
          : "No pudimos generar la propuesta. Inténtalo de nuevo.",
      );
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

  /** Cambia a la prenda base del color pedido sin cerrar el formulario. */
  const switchToColor = (colorKey: string) => {
    const target = MOCKUP_BASES.find(
      (base) => base.category === selectedBase.category && base.colorKey === colorKey,
    );

    if (!target || !confirmDiscardDraft()) {
      return;
    }

    setActiveCategory(target.category);
    setSelectedId(target.id);
    resetGeneratedState();
  };

  const ideaErrorActions: DesignNoticeAction[] = [];

  if (ideaError?.suggestRedesign && previousImage) {
    ideaErrorActions.push({
      label: "Usar «Rediseñar estampado»",
      onClick: () => changeRevisionMode("redesign"),
    });
  }

  if (ideaError?.suggestedColorKey) {
    const target = MOCKUP_BASES.find(
      (base) =>
        base.category === selectedBase.category && base.colorKey === ideaError.suggestedColorKey,
    );

    if (target) {
      ideaErrorActions.push({
        label: `Cambiar a ${getMockupBaseName(target)}`,
        onClick: () => switchToColor(target.colorKey),
      });
    }
  }

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
    setRevisionMode("zone");
    setLastStrategy(null);
    setSelection(null);
    setSelectionZone(null);
    setLastZoneLabel(null);
    setSelectionDrag(null);
  };

  return (
    <div className="garment-selector">
      <div className="personalizer-steps-wrap">
        <ol className="personalizer-steps" aria-label="Progreso de personalización">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="personalizer-step"
              data-state={
                index < activeStep ? "done" : index === activeStep ? "current" : "upcoming"
              }
              aria-current={index === activeStep ? "step" : undefined}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>

      {ideaOpen && generatedImage ? (
        <section
          id="design-workspace"
          className="design-result"
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="design-workspace-title"
        >
          <header className="design-result-head">
            <h2 id="design-workspace-title">Así se ve tu idea</h2>
            <p className="design-result-meta">
              {selectedName} · Talla {selectedSize}
              {lastZoneLabel ? ` · Zona: ${lastZoneLabel}` : ""}
            </p>
          </header>

          <div className="design-result-compare">
            <figure className="design-compare-item">
              <figcaption className="design-compare-label">{compareLabel}</figcaption>
              <div className="design-compare-frame">
                <Image
                  src={compareImage ?? selectedBase.file}
                  alt={compareImage ? `Propuesta de diseño: ${compareLabel}` : selectedBase.alt}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1240px) 44vw, 520px"
                  unoptimized={Boolean(compareImage)}
                />
              </div>
            </figure>

            <span className="design-result-divider" aria-hidden="true" />

            <figure className="design-compare-item">
              <figcaption className="design-compare-label">
                {currentProposal
                  ? `Versión ${currentProposal.version} · Actual`
                  : "Propuesta generada"}
              </figcaption>
              <div className="design-compare-frame">
                <Image
                  src={generatedImage}
                  alt={`Propuesta de diseño para ${selectedName}`}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1240px) 44vw, 520px"
                  unoptimized
                />
              </div>
            </figure>
          </div>

          <ProposalHistoryPanel
            history={history}
            onCompare={(version) => setHistory((current) => compareProposalWith(current, version))}
            onSelect={showProposalVersion}
          />

          <div className="design-result-copy">
            <p className="design-result-idea">“{idea.trim()}”</p>
            <p className="design-result-note">
              Vista previa de prueba.{" "}
              {lastStrategy === "redesign"
                ? "Se generó un estampado nuevo sobre la misma prenda; el diseño anterior no se conservó."
                : lastStrategy === "text"
                  ? "El texto se agregó con una fuente legible; el resto del diseño anterior se conservó."
                  : lastStrategy === "inpaint"
                    ? "El cambio se integró en la zona marcada; el resto del diseño anterior se conservó."
                    : "La propuesta se generó a partir de tu idea."}{" "}
              No se guarda en la base de datos: si sales de esta página, se perderá. Descárgala si
              quieres conservarla.
            </p>
            {generatedPrompt ? (
              <details className="design-prompt-details">
                <summary>
                  <span>Ver prompt mejorado para la IA</span>
                  <ChevronDownIcon />
                </summary>
                <p>{generatedPrompt}</p>
              </details>
            ) : null}
            <div className="design-actions">
              <button type="button" className="button button-primary" onClick={beginRevision}>
                Pedir cambios
              </button>
              <a
                className="button button-secondary"
                href={generatedImage}
                download={`valdra-${selectedBase.id}-${selectedSize}${
                  currentProposal ? `-v${currentProposal.version}` : ""
                }.${downloadExtension}`}
              >
                Descargar diseño
              </a>
              <button type="button" className="design-text-action" onClick={closeIdeaPanel}>
                Elegir otra prenda
              </button>
            </div>
          </div>
        </section>
      ) : ideaOpen ? (
        <section
          id="design-workspace"
          className="design-workspace"
          aria-labelledby="design-workspace-title"
        >
          <aside className="design-workspace-preview">
            <p className="design-step-label">{previousImage ? "Diseño anterior" : "Tu prenda"}</p>
            <div className="design-preview-frame">
              <Image
                src={previousImage ?? selectedBase.file}
                alt={previousImage ? "Propuesta de diseño anterior" : selectedBase.alt}
                fill
                sizes="(max-width: 900px) 70vw, 480px"
                unoptimized={Boolean(previousImage)}
              />
              {previousImage && !generatedImage && revisionMode === "zone" ? (
                <div
                  className="design-selection-layer"
                  aria-hidden="true"
                  title="Marca la zona que quieres cambiar"
                  onPointerDown={handleSelectionPointerDown}
                  onPointerMove={handleSelectionPointerMove}
                  onPointerUp={handleSelectionPointerUp}
                  onPointerCancel={handleSelectionPointerUp}
                >
                  {selection && selection.width > 0 && selection.height > 0 ? (
                    <span
                      className="design-selection-box"
                      style={{
                        left: `${selection.x * 100}%`,
                        top: `${selection.y * 100}%`,
                        width: `${selection.width * 100}%`,
                        height: `${selection.height * 100}%`,
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="design-preview-name">
              {previousImage
                ? revisingFrom
                  ? `Cambios sobre la versión ${revisingFrom}`
                  : "Propuesta anterior"
                : selectedName}
            </p>
            <p className="design-preview-meta">
              {previousImage
                ? `${selectedName} · Talla ${selectedSize}`
                : `Talla ${selectedSize} · ${selectedBase.categoryLabel}`}
            </p>
            {previousImage && !generatedImage && revisionMode === "redesign" ? (
              <p className="design-redesign-note">
                Se generará un estampado nuevo sobre la misma prenda. El diseño anterior no se
                conserva.
              </p>
            ) : null}
            {previousImage && !generatedImage && revisionMode === "zone" ? (
              <fieldset className="design-zone-picker">
                <legend>Zona a cambiar</legend>
                <div className="design-zone-options">
                  {REVISION_ZONE_PRESETS.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      className="design-zone"
                      aria-pressed={selectionZone === zone.id}
                      onClick={() => selectZone(zone)}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
                <p className="form-hint">
                  Arrastra sobre la imagen o elige una zona. La IA la integrará con la tela y
                  conservará el resto.
                </p>
                <p className="form-hint">Para cambios en mangas, usa «Rediseñar estampado».</p>
              </fieldset>
            ) : null}
            <button
              type="button"
              className="design-back"
              onClick={closeIdeaPanel}
              disabled={generating}
            >
              <ArrowLeftIcon />
              Cambiar prenda
            </button>
          </aside>

          <div className="design-workspace-main">
            <header className="design-workspace-head">
              <h2 id="design-workspace-title">
                {previousImage ? "Pide cambios sobre tu diseño" : "Cuéntanos qué quieres crear"}
              </h2>
              <p className="design-lead">
                {previousImage
                  ? revisionMode === "redesign"
                    ? "Describe el nuevo estilo del estampado. Se generará una versión nueva sobre la misma prenda; el diseño anterior no se conserva."
                    : "Marca la zona que quieres cambiar y describe el ajuste. La IA reconstruirá solo esa zona y la integrará con la tela; el resto de tu diseño se conserva."
                  : "Describe el diseño que imaginas. Lo aplicaremos sobre la prenda y la talla que elegiste."}
              </p>
            </header>

            <form className="design-form" ref={formRef} onSubmit={handleIdeaSubmit} noValidate>
              {previousImage ? (
                <fieldset className="design-revision-mode">
                  <legend>Cómo aplicar el cambio</legend>
                  <div className="design-revision-options">
                    <button
                      type="button"
                      className="design-revision-option"
                      aria-pressed={revisionMode === "zone"}
                      onClick={() => changeRevisionMode("zone")}
                    >
                      <strong>Editar la zona</strong>
                      <span>Conserva el diseño anterior. Ideal para agregar un elemento.</span>
                    </button>
                    <button
                      type="button"
                      className="design-revision-option"
                      aria-pressed={revisionMode === "redesign"}
                      onClick={() => changeRevisionMode("redesign")}
                    >
                      <strong>Rediseñar estampado</strong>
                      <span>Crea una versión nueva. Ideal para cambiar el estilo.</span>
                    </button>
                  </div>
                </fieldset>
              ) : null}
              <div className="design-prompt-box">
                <label htmlFor="design-idea">
                  {previousImage
                    ? revisionMode === "redesign"
                      ? "Describe el nuevo estilo"
                      : detectedText
                        ? "Texto a agregar"
                        : "Describe el cambio en la zona marcada"
                    : "Describe tu idea"}
                </label>
                <textarea
                  id="design-idea"
                  ref={ideaRef}
                  value={idea}
                  maxLength={IDEA_MAX_LENGTH}
                  placeholder={
                    previousImage
                      ? revisionMode === "redesign"
                        ? "Ejemplo: haz que los árboles se vean realistas."
                        : detectedText
                          ? "Ejemplo: I LOVE YOU"
                          : "Ejemplo: agrega árboles de Navidad blancos en esta zona."
                      : "Ejemplo: un paisaje andino al atardecer, con líneas finas en el pecho."
                  }
                  aria-invalid={ideaError ? true : undefined}
                  aria-describedby={
                    ideaError ? "design-idea-hint design-idea-notice" : "design-idea-hint"
                  }
                  onChange={(event) => {
                    setIdea(event.target.value);
                    if (ideaError) {
                      setIdeaError(null);
                    }
                  }}
                />
                <div className="design-form-meta">
                  <p id="design-idea-hint" className="form-hint">
                    {previousImage
                      ? revisionMode === "redesign"
                        ? "Se generará un estampado nuevo sobre la misma prenda; el diseño anterior no se conserva."
                        : detectedText
                          ? `Texto detectado: “${detectedText}”. Se agregará con una fuente legible en la zona marcada.`
                          : STYLE_CHANGE_PATTERN.test(idea)
                            ? "Este cambio parece de estilo. Para mejores resultados, elige “Rediseñar estampado”."
                            : "Solo se reconstruirá la zona marcada. El resto del diseño se conserva."
                      : "La IA ampliará tu idea con composición, estilo y restricciones."}
                  </p>
                  <span className="design-form-count" aria-hidden="true">
                    {idea.length}/{IDEA_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <fieldset className="design-suggestions" aria-label="Ideas de ejemplo">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="design-suggestion"
                    onClick={() => appendSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </fieldset>

              {ideaError ? (
                <DesignNotice
                  id="design-idea-notice"
                  noticeRef={noticeRef}
                  tone="error"
                  title={ideaError.title}
                  actions={ideaErrorActions}
                >
                  {ideaError.message}
                </DesignNotice>
              ) : generationError ? (
                <DesignNotice
                  noticeRef={noticeRef}
                  tone="error"
                  title="No pudimos generar la propuesta"
                  actions={[
                    { label: "Reintentar", onClick: () => formRef.current?.requestSubmit() },
                  ]}
                >
                  {generationError}
                </DesignNotice>
              ) : null}

              {generating ? (
                <div className="design-progress" ref={noticeRef} role="status">
                  <span className="design-progress-spinner" aria-hidden="true" />
                  <div className="design-progress-body">
                    <p className="design-progress-title">Tu diseño se está generando…</p>
                    <p className="design-progress-meta">
                      {elapsedSeconds > 0 ? `${elapsedSeconds} s · ` : ""}Suele tardar entre 15 y 60
                      segundos. No cierres esta página.
                    </p>
                  </div>
                  <button type="button" className="design-text-action" onClick={cancelGeneration}>
                    Cancelar
                  </button>
                </div>
              ) : null}

              <div className="design-actions">
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={generating}
                  aria-busy={generating}
                >
                  {generating
                    ? "Generando…"
                    : previousImage
                      ? revisionMode === "redesign"
                        ? "Generar rediseño"
                        : detectedText
                          ? "Agregar texto"
                          : "Aplicar en la zona"
                      : "Generar propuesta"}
                </button>
                {previousImage && currentProposal ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={cancelRevision}
                    disabled={generating}
                  >
                    Volver a la propuesta
                  </button>
                ) : null}
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeIdeaPanel}
                  disabled={generating}
                >
                  Volver a la prenda
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <>
          <nav className="garment-tabs" aria-label="Tipo de prenda">
            {CATEGORY_ORDER.map((category) => {
              const count = MOCKUP_BASES.filter((base) => base.category === category).length;
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className="garment-tab"
                  aria-pressed={active}
                  onClick={() => selectCategory(category)}
                >
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="garment-tab-count">{count}</span>
                </button>
              );
            })}
          </nav>

          <section className="garment-stage" aria-label="Selector de prenda">
            <button
              type="button"
              className="garment-side garment-side-prev"
              aria-label={`Ver ${getMockupBaseName(previousBase)}`}
              onClick={() => selectBase(previousBase.id)}
            >
              <span className="garment-side-frame">
                <Image src={previousBase.file} alt="" fill sizes="220px" />
              </span>
              <span className="garment-side-name">{getMockupBaseName(previousBase)}</span>
            </button>

            <figure className="garment-main">
              <div className="garment-preview">
                <Image
                  src={selectedBase.file}
                  alt={selectedBase.alt}
                  fill
                  sizes="(max-width: 900px) 92vw, 620px"
                  loading="eager"
                  fetchPriority="high"
                />
                <button
                  type="button"
                  className="garment-arrow garment-arrow-prev"
                  aria-label="Prenda anterior"
                  onClick={() => selectBase(previousBase.id)}
                >
                  <ArrowLeftIcon />
                </button>
                <button
                  type="button"
                  className="garment-arrow garment-arrow-next"
                  aria-label="Prenda siguiente"
                  onClick={() => selectBase(nextBase.id)}
                >
                  <ArrowRightIcon />
                </button>
              </div>
              <figcaption className="garment-stage-caption">
                <span className="garment-stage-name">{selectedName}</span>
                <span className="garment-stage-meta">
                  {selectedBase.categoryLabel} · Vista frontal
                </span>
              </figcaption>
            </figure>

            <button
              type="button"
              className="garment-side garment-side-next"
              aria-label={`Ver ${getMockupBaseName(nextBase)}`}
              onClick={() => selectBase(nextBase.id)}
            >
              <span className="garment-side-frame">
                <Image src={nextBase.file} alt="" fill sizes="220px" />
              </span>
              <span className="garment-side-name">{getMockupBaseName(nextBase)}</span>
            </button>
          </section>

          <p className="sr-only" role="status">
            Prenda seleccionada: {selectedName}.
          </p>

          <div className="garment-rail-block">
            <div className="garment-rail-head">
              <h2 className="garment-rail-title">{CATEGORY_LABELS[activeCategory]}</h2>
              <span className="garment-rail-count">{categoryBases.length} disponibles</span>
            </div>
            <ul className="garment-rail" ref={railRef}>
              {categoryBases.map((base) => {
                const name = getMockupBaseName(base);
                const active = base.id === selectedBase.id;
                return (
                  <li key={base.id}>
                    <button
                      type="button"
                      className="garment-thumb"
                      data-base-id={base.id}
                      aria-pressed={active}
                      aria-label={name}
                      onClick={() => selectBase(base.id)}
                    >
                      <span className="garment-thumb-frame">
                        <Image src={base.file} alt="" fill sizes="96px" />
                      </span>
                      <span className="garment-thumb-name" aria-hidden="true">
                        {name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="personalizer-bar">
            <div className="personalizer-bar-inner">
              <div className="personalizer-summary">
                <span className="personalizer-summary-thumb">
                  <Image src={selectedBase.file} alt="" fill sizes="56px" />
                </span>
                <span className="personalizer-summary-text">
                  <span className="personalizer-summary-label">Prenda seleccionada</span>
                  <span className="personalizer-summary-name">{selectedName}</span>
                </span>
              </div>

              <fieldset className="personalizer-sizes">
                <legend className="personalizer-label">Talla</legend>
                <div
                  className="personalizer-size-options"
                  ref={sizeOptionsRef}
                  data-missing={!selectedSize && sizeMissing ? "true" : undefined}
                >
                  {MOCKUP_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="option-chip"
                      aria-pressed={selectedSize === size}
                      onClick={() => selectSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                ref={customizeRef}
                className="button button-primary personalizer-cta"
                aria-describedby="size-hint"
                aria-haspopup={!isAuthenticated ? "dialog" : undefined}
                aria-controls={!isAuthenticated && authPromptOpen ? "auth-dialog" : undefined}
                onClick={handleCustomize}
              >
                Personalizar
              </button>

              <p
                id="size-hint"
                className="personalizer-notice"
                data-tone={barNoticeTone}
                role="status"
              >
                {!isAuthenticated && selectedSize ? <LockIcon /> : null}
                {barNotice}
              </p>
            </div>
          </div>
        </>
      )}

      {authPromptOpen ? (
        <div className="auth-dialog-backdrop">
          <div
            id="auth-dialog"
            ref={authDialogRef}
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-dialog-title"
            aria-describedby="auth-dialog-description"
            tabIndex={-1}
          >
            <h2 id="auth-dialog-title">Inicia sesión para personalizar</h2>
            <p id="auth-dialog-description">
              Conserva tu prenda, talla y color y continúa con tu idea de diseño.
            </p>
            <p className="auth-dialog-selection">
              {selectedName} · Talla {selectedSize}
            </p>
            <p className="auth-dialog-note">
              Tu selección se conserva al iniciar sesión o crear tu cuenta.
            </p>
            <div className="auth-dialog-actions">
              <Link
                className="button button-primary"
                href={`/login?next=${encodeURIComponent(nextPath)}`}
              >
                Iniciar sesión
              </Link>
              <Link
                className="button button-secondary"
                href={`/registro?next=${encodeURIComponent(nextPath)}`}
              >
                Crear cuenta
              </Link>
              <button type="button" className="auth-dialog-dismiss" onClick={closeAuthPrompt}>
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
