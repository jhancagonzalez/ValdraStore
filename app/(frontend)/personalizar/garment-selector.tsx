"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import {
  getMockupBase,
  getMockupBaseName,
  MOCKUP_BASES,
  MOCKUP_SIZES,
  type MockupCategory,
  type MockupSize,
} from "@/lib/mockup-bases";
import {
  type MockupSelection,
  REVISION_ZONE_PRESETS,
} from "@/lib/mockup-selection";

const IDEA_MAX_LENGTH = 600;
const IDEA_SUGGESTIONS = ["Floral minimalista", "Geométrico", "Retro", "Tipografía pequeña"];
const REVISION_SUGGESTIONS = ["Más minimalista", "Más color", "Cambiar composición", "Añadir textura"];
const CATEGORY_ORDER: MockupCategory[] = ["camisetas", "hoodies"];
const CATEGORY_LABELS: Record<MockupCategory, string> = {
  camisetas: "Camisetas",
  hoodies: "Hoodies",
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const MIN_SELECTION_SIZE = 0.02;

type GarmentSelectorProps = {
  initialBaseId: string;
  initialSize: MockupSize | null;
  isAuthenticated: boolean;
};

/**
 * Selector de prenda base (HU-11) y flujo de idea (HU-12).
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
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [selection, setSelection] = useState<MockupSelection | null>(null);
  const [selectionZone, setSelectionZone] = useState<string | null>(null);
  const [lastZoneLabel, setLastZoneLabel] = useState<string | null>(null);
  const [selectionDrag, setSelectionDrag] = useState<{ x: number; y: number } | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const customizeRef = useRef<HTMLButtonElement>(null);
  const authDialogRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLUListElement>(null);

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
  const suggestions = previousImage ? REVISION_SUGGESTIONS : IDEA_SUGGESTIONS;
  const nextPath = `/personalizar?base=${encodeURIComponent(selectedBase.id)}&size=${
    selectedSize ?? ""
  }`;

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

  const hasUnsavedDesign = Boolean(generatedImage || previousImage);

  const confirmDiscardDraft = () =>
    !hasUnsavedDesign ||
    window.confirm(
      "Tu diseño se perderá porque no se guarda en la base de datos. Descárgalo antes de salir si quieres conservarlo. ¿Quieres continuar?",
    );

  const resetGeneratedState = () => {
    setIdeaError(null);
    setGenerationError(null);
    setGeneratedImage(null);
    setPreviousImage(null);
    setGeneratedPrompt(null);
    setSelection(null);
    setSelectionZone(null);
    setLastZoneLabel(null);
    setSelectionDrag(null);
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
    setIdeaOpen(false);
    setIdeaError(null);
    setGenerationError(null);
    customizeRef.current?.focus();
  };

  const handleCustomize = () => {
    if (!selectedSize) {
      return;
    }
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    setIdeaOpen(true);
  };

  const appendSuggestion = (suggestion: string) => {
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
      setIdeaError("Describe tu idea antes de continuar.");
      ideaRef.current?.focus();
      return;
    }

    if (!selectedSize) {
      setIdeaError("Selecciona una talla antes de continuar.");
      return;
    }

    if (
      previousImage &&
      (!selection ||
        selection.width < MIN_SELECTION_SIZE ||
        selection.height < MIN_SELECTION_SIZE)
    ) {
      setIdeaError("Marca la zona del diseño que quieres cambiar.");
      return;
    }

    const zoneLabel =
      selectionZone && selectionZone !== "custom"
        ? (REVISION_ZONE_PRESETS.find((zone) => zone.id === selectionZone)?.label ?? null)
        : previousImage
          ? "Zona personalizada"
          : null;

    setIdeaError(null);
    setGenerationError(null);
    setGeneratedImage(null);
    setGeneratedPrompt(null);
    setLastZoneLabel(zoneLabel);
    setGenerating(true);

    try {
      const response = await fetch("/api/personalization/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseId: selectedBase.id,
          idea: trimmedIdea,
          mode: previousImage ? "revise" : "create",
          referenceImage: previousImage ?? undefined,
          selection: previousImage ? selection : undefined,
          size: selectedSize,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: unknown;
        image?: unknown;
        prompt?: unknown;
      } | null;

      if (!response.ok || typeof data?.image !== "string") {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "No pudimos generar la propuesta. Inténtalo de nuevo.";
        throw new Error(message);
      }

      setGeneratedImage(data.image);
      setGeneratedPrompt(typeof data.prompt === "string" ? data.prompt : null);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "No pudimos generar la propuesta. Inténtalo de nuevo.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const beginRevision = () => {
    if (!generatedImage) {
      return;
    }

    setPreviousImage(generatedImage);
    setGeneratedImage(null);
    setGeneratedPrompt(null);
    setGenerationError(null);
    setIdeaError(null);
    setIdea("");
    setSelection(null);
    setSelectionZone(null);
    setLastZoneLabel(null);
    setSelectionDrag(null);
  };

  return (
    <div className="garment-selector">
      {ideaOpen ? (
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
              {previousImage && !generatedImage ? (
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
              {previousImage ? "Propuesta anterior" : selectedName}
            </p>
            <p className="design-preview-meta">
              {previousImage ? `${selectedName} · Talla ${selectedSize}` : `Talla ${selectedSize} · ${selectedBase.categoryLabel}`}
            </p>
            {previousImage && !generatedImage ? (
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
                  Marca solo la zona que quieres cambiar. La IA la integrará con la tela y
                  conservará el resto.
                </p>
              </fieldset>
            ) : null}
            <button type="button" className="design-back" onClick={closeIdeaPanel}>
              <span aria-hidden="true">←</span> Cambiar prenda
            </button>
          </aside>

          <div className="design-workspace-main">
            {generatedImage ? (
              <div className="design-result" ref={resultRef} tabIndex={-1}>
                <div className="design-result-image">
                  <Image
                    src={generatedImage}
                    alt={`Propuesta de diseño para ${selectedName}`}
                    width={1024}
                    height={1024}
                    unoptimized
                  />
                </div>
                <div className="design-result-copy">
                  <p className="design-eyebrow">Propuesta generada</p>
                  <h2 id="design-workspace-title">Así se ve tu idea</h2>
                  <p className="design-result-meta">
                    {selectedName} · Talla {selectedSize}
                    {lastZoneLabel ? ` · Zona: ${lastZoneLabel}` : ""}
                  </p>
                  <p className="design-result-idea">“{idea.trim()}”</p>
                  <p className="design-result-note">
                    Vista previa de prueba. El cambio se integró en la zona marcada; el resto del
                    diseño anterior se conservó. No se guarda en la base de datos: si sales de esta
                    página, se perderá. Descárgala si quieres conservarla.
                  </p>
                  {generatedPrompt ? (
                    <details className="design-prompt-details">
                      <summary>Ver prompt mejorado para la IA</summary>
                      <p>{generatedPrompt}</p>
                    </details>
                  ) : null}
                  <div className="design-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={beginRevision}
                    >
                      Pedir cambios
                    </button>
                    <a
                      className="button button-secondary"
                      href={generatedImage}
                      download={`valdra-${selectedBase.id}-${selectedSize}.${
                        generatedImage.startsWith("data:image/png") ? "png" : "jpg"
                      }`}
                    >
                      Descargar diseño
                    </a>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={closeIdeaPanel}
                    >
                      Elegir otra prenda
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <header className="design-workspace-head">
                  <p className="design-eyebrow">
                    {previousImage ? "Paso 2 · Ajustes" : "Paso 2 · Tu idea"}
                  </p>
                  <h2 id="design-workspace-title">
                    {previousImage ? "Pide cambios sobre tu diseño" : "Cuéntanos qué quieres crear"}
                  </h2>
                  <p className="design-lead">
                    {previousImage
                      ? "Marca la zona que quieres cambiar y describe el ajuste. La IA reconstruirá solo esa zona y la integrará con la tela; el resto de tu diseño se conserva."
                      : "Describe el diseño que imaginas. Lo aplicaremos sobre la prenda y la talla que elegiste."}
                  </p>
                </header>

                {generationError ? (
                  <p className="form-error" role="alert">
                    {generationError}
                  </p>
                ) : null}

                <form className="design-form" onSubmit={handleIdeaSubmit} noValidate>
                  <div className="design-prompt-box">
                    <label htmlFor="design-idea">
                      {previousImage ? "Describe el cambio en la zona marcada" : "Describe tu idea"}
                    </label>
                    <textarea
                      id="design-idea"
                      ref={ideaRef}
                      value={idea}
                      maxLength={IDEA_MAX_LENGTH}
                      placeholder={
                        previousImage
                          ? "Ejemplo: agrega árboles de Navidad blancos en esta zona."
                          : "Ejemplo: un paisaje andino al atardecer, con líneas finas en el pecho."
                      }
                      aria-invalid={ideaError ? true : undefined}
                      aria-describedby={
                        ideaError ? "design-idea-hint design-idea-error" : "design-idea-hint"
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
                          ? "Solo se reconstruirá la zona marcada. El resto del diseño se conserva."
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
                    <p id="design-idea-error" className="form-field-error" role="alert">
                      {ideaError}
                    </p>
                  ) : null}

                  <div className="design-actions">
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={generating}
                      aria-busy={generating}
                    >
                      {generating ? "Generando…" : "Generar propuesta"}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={closeIdeaPanel}
                      disabled={generating}
                    >
                      Volver a la prenda
                    </button>
                  </div>

                  {generating ? (
                    <p className="design-generating" role="status">
                      Tu diseño se está generando…
                    </p>
                  ) : null}
                </form>
              </>
            )}
          </div>
        </section>
      ) : (
        <>
          <div className="garment-tabs-wrap">
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
          </div>

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

            <div className="garment-main">
              <div className="garment-preview">
                <Image
                  src={selectedBase.file}
                  alt={selectedBase.alt}
                  fill
                  sizes="(max-width: 900px) 92vw, 620px"
                  loading="eager"
                  fetchPriority="high"
                />
                <span className="garment-preview-badge">Vista previa</span>
                <button
                  type="button"
                  className="garment-arrow garment-arrow-prev"
                  aria-label="Prenda anterior"
                  onClick={() => selectBase(previousBase.id)}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  className="garment-arrow garment-arrow-next"
                  aria-label="Prenda siguiente"
                  onClick={() => selectBase(nextBase.id)}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

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
                <div className="personalizer-size-options">
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
                <p id="size-hint" className="personalizer-hint" role="status">
                  {selectedSize
                    ? `Talla seleccionada: ${selectedSize}.`
                    : "Elige una talla para continuar."}
                </p>
              </fieldset>

              <button
                type="button"
                ref={customizeRef}
                className="button button-primary personalizer-cta"
                disabled={!selectedSize}
                aria-describedby="size-hint"
                aria-haspopup={!isAuthenticated ? "dialog" : undefined}
                aria-controls={!isAuthenticated && authPromptOpen ? "auth-dialog" : undefined}
                onClick={handleCustomize}
              >
                Personalizar
              </button>
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
            <p className="auth-dialog-eyebrow">Personalización</p>
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
