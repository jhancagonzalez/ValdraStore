"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMockupBase,
  getMockupBaseName,
  MOCKUP_BASES,
  type MockupCategory,
  type MockupSize,
} from "@/lib/mockup-bases";
import { AuthPrompt } from "./auth-prompt";
import { DesignForm } from "./design-form";
import type { DesignNoticeAction } from "./design-notice";
import { DesignResult } from "./design-result";
import { GarmentPicker } from "./garment-picker";
import { PersonalizerSteps } from "./personalizer-steps";
import { useDesignGeneration } from "./use-design-generation";

type GarmentSelectorProps = {
  initialBaseId: string;
  initialSize: MockupSize | null;
  isAuthenticated: boolean;
};

/**
 * Selector de prenda base (HU-11), flujo de idea (HU-12) y modificaciones con
 * historial de propuestas (HU-16). La selección y la propuesta viven solo en el
 * navegador: no se persisten en Payload. El resultado se descarga y se advierte
 * antes de salir.
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
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [sizeMissing, setSizeMissing] = useState(false);
  const customizeRef = useRef<HTMLButtonElement>(null);
  const sizeOptionsRef = useRef<HTMLDivElement>(null);
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
  const design = useDesignGeneration({ ideaOpen, selectedBase, selectedSize });
  const generatedImage = design.generatedImage;
  const nextPath = `/personalizar?base=${encodeURIComponent(selectedBase.id)}&size=${
    selectedSize ?? ""
  }`;
  const activeStep = ideaOpen ? (generatedImage ? 2 : 1) : 0;
  const barNotice = !selectedSize
    ? sizeMissing
      ? "Elige una talla antes de personalizar."
      : "Elige una talla para continuar."
    : isAuthenticated
      ? `Talla ${selectedSize} lista. Continúa para describir tu diseño.`
      : "Para personalizar debes iniciar sesión. Tu prenda y talla se conservan.";
  const barNoticeTone = !selectedSize && sizeMissing ? "error" : "info";

  const selectBase = (id: string) => {
    if (id === selectedId) {
      return;
    }
    if (!design.confirmDiscardDraft()) {
      return;
    }
    setSelectedId(id);
    setIdeaOpen(false);
    design.resetGeneratedState();
  };

  const selectSize = (size: MockupSize) => {
    if (size === selectedSize) {
      return;
    }
    if (!design.confirmDiscardDraft()) {
      return;
    }
    setSelectedSize(size);
    setSizeMissing(false);
    design.resetGeneratedState();
  };

  const selectCategory = (category: MockupCategory) => {
    if (category === activeCategory) {
      return;
    }

    // Keep the same color when switching between t-shirts and hoodies.
    const next =
      MOCKUP_BASES.find(
        (base) => base.category === category && base.colorKey === selectedBase.colorKey,
      ) ?? MOCKUP_BASES.find((base) => base.category === category);

    if (!next || !design.confirmDiscardDraft()) {
      return;
    }

    setActiveCategory(category);
    setSelectedId(next.id);
    setIdeaOpen(false);
    design.resetGeneratedState();
  };

  const closeIdeaPanel = () => {
    design.prepareClose();
    setIdeaOpen(false);
    customizeRef.current?.focus();
  };

  const handleCustomize = (): boolean => {
    if (!selectedSize) {
      setSizeMissing(true);
      sizeOptionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      return false;
    }
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return false;
    }
    setIdeaOpen(true);
    return true;
  };

  const openDesigner = (target: "image" | "text") => {
    // Solo se fija el foco deseado si el panel se abrió; si falta talla o
    // sesión, el intento se descarta para no robar el foco más tarde.
    if (handleCustomize()) {
      design.setDesignFocus(target);
    }
  };

  const closeAuthPrompt = () => {
    setAuthPromptOpen(false);
    customizeRef.current?.focus();
  };

  /** Cambia a la prenda base del color pedido sin cerrar el formulario. */
  const switchToColor = (colorKey: string) => {
    const target = MOCKUP_BASES.find(
      (base) => base.category === selectedBase.category && base.colorKey === colorKey,
    );

    if (!target || !design.confirmDiscardDraft()) {
      return;
    }

    setActiveCategory(target.category);
    setSelectedId(target.id);
    design.resetGeneratedState();
  };

  const ideaErrorActions: DesignNoticeAction[] = [];

  if (design.ideaError?.suggestedColorKey) {
    const target = MOCKUP_BASES.find(
      (base) =>
        base.category === selectedBase.category &&
        base.colorKey === design.ideaError?.suggestedColorKey,
    );

    if (target) {
      ideaErrorActions.push({
        label: `Cambiar a ${getMockupBaseName(target)}`,
        onClick: () => switchToColor(target.colorKey),
      });
    }
  }

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

  useEffect(() => {
    if (!design.hasUnsavedDesign) {
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
  }, [design.hasUnsavedDesign]);

  return (
    <div className="garment-selector">
      <PersonalizerSteps activeStep={activeStep} />

      {generatedImage && ideaOpen ? (
        <DesignResult
          approvedDesign={design.approvedDesign}
          compareImage={design.compareImage}
          compareLabel={design.compareLabel}
          currentProposal={design.currentProposal}
          downloadExtension={design.downloadExtension}
          generatedImage={generatedImage}
          generatedPrompt={design.generatedPrompt}
          history={design.history}
          idea={design.idea}
          lastStrategy={design.lastStrategy}
          lastZoneLabel={design.lastZoneLabel}
          onApproved={design.handleApproved}
          onBeginRevision={design.beginRevision}
          onClose={closeIdeaPanel}
          onCompare={design.compareVersion}
          onDownload={design.handleDownload}
          onSelectVersion={design.showProposalVersion}
          resultRef={design.resultRef}
          selectedBase={selectedBase}
          selectedName={selectedName}
          selectedSize={selectedSize}
        />
      ) : ideaOpen ? (
        <DesignForm
          currentProposal={design.currentProposal}
          detectedText={design.detectedText}
          elapsedSeconds={design.elapsedSeconds}
          formRef={design.formRef}
          generating={design.generating}
          generationError={design.generationError}
          idea={design.idea}
          ideaError={design.ideaError}
          ideaErrorActions={ideaErrorActions}
          ideaRef={design.ideaRef}
          noticeRef={design.noticeRef}
          onAdjustSelection={design.adjustSelection}
          onCancelGeneration={design.cancelGeneration}
          onCancelRevision={design.cancelRevision}
          onChangeIdea={(value) => {
            design.setIdea(value);
            if (design.ideaError) {
              design.clearIdeaError();
            }
          }}
          onClose={closeIdeaPanel}
          onPointerDown={design.handleSelectionPointerDown}
          onPointerMove={design.handleSelectionPointerMove}
          onPointerUp={design.handleSelectionPointerUp}
          onReferenceChange={design.setReferenceImage}
          onSelectFreeZone={design.selectFreeZone}
          onSelectZone={design.selectZone}
          onSubmit={design.handleIdeaSubmit}
          previousImage={design.previousImage}
          referenceImage={design.referenceImage}
          revisingFrom={design.revisingFrom}
          selectedBase={selectedBase}
          selectedName={selectedName}
          selectedSize={selectedSize}
          selection={design.selection}
          selectionZone={design.selectionZone}
        />
      ) : (
        <GarmentPicker
          activeCategory={activeCategory}
          authPromptOpen={authPromptOpen}
          barNotice={barNotice}
          barNoticeTone={barNoticeTone}
          categoryBases={categoryBases}
          customizeRef={customizeRef}
          isAuthenticated={isAuthenticated}
          nextBase={nextBase}
          onCustomize={handleCustomize}
          onOpenDesigner={openDesigner}
          onSelectBase={selectBase}
          onSelectCategory={selectCategory}
          onSelectSize={selectSize}
          previousBase={previousBase}
          railRef={railRef}
          selectedBase={selectedBase}
          selectedName={selectedName}
          selectedSize={selectedSize}
          sizeMissing={sizeMissing}
          sizeOptionsRef={sizeOptionsRef}
        />
      )}

      <AuthPrompt
        nextPath={nextPath}
        onClose={closeAuthPrompt}
        open={authPromptOpen}
        selectedName={selectedName}
        selectedSize={selectedSize}
      />
    </div>
  );
};
