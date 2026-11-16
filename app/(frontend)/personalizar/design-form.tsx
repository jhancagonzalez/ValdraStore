import Image from "next/image";
import type { FormEventHandler, PointerEventHandler, RefObject } from "react";
import type { MockupBase, MockupSize } from "@/lib/mockup-bases";
import type { MockupSelection } from "@/lib/mockup-selection";
import type { ProposalVersion } from "@/lib/proposal-history";
import { StatusMark } from "../_components/status-mark";
import { DesignNotice, type DesignNoticeAction } from "./design-notice";
import { DesignZonePicker } from "./design-zone-picker";
import { type FormIssue, IDEA_MAX_LENGTH } from "./personalization-config";
import { ArrowLeftIcon } from "./personalization-icons";
import { ReferenceUpload } from "./reference-upload";

type DesignFormProps = {
  currentProposal: ProposalVersion | null;
  detectedText: string | null;
  elapsedSeconds: number;
  formRef: RefObject<HTMLFormElement | null>;
  generating: boolean;
  generationError: string | null;
  idea: string;
  ideaError: FormIssue | null;
  ideaErrorActions: DesignNoticeAction[];
  ideaRef: RefObject<HTMLTextAreaElement | null>;
  noticeRef: RefObject<HTMLDivElement | null>;
  onAdjustSelection: (patch: Partial<MockupSelection>) => void;
  onCancelGeneration: () => void;
  onCancelRevision: () => void;
  onChangeIdea: (value: string) => void;
  onClose: () => void;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onReferenceChange: (value: string | null) => void;
  onSelectFreeZone: () => void;
  onSelectZone: (zone: { id: string; selection: MockupSelection }) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  previousImage: string | null;
  referenceImage: string | null;
  revisingFrom: number | null;
  selectedBase: MockupBase;
  selectedName: string;
  selectedSize: MockupSize | null;
  selection: MockupSelection | null;
  selectionZone: string | null;
};

/** Paso 2: describir la idea, marcar la zona de cambio y generar la propuesta. */
export const DesignForm = ({
  currentProposal,
  detectedText,
  elapsedSeconds,
  formRef,
  generating,
  generationError,
  idea,
  ideaError,
  ideaErrorActions,
  ideaRef,
  noticeRef,
  onAdjustSelection,
  onCancelGeneration,
  onCancelRevision,
  onChangeIdea,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onReferenceChange,
  onSelectFreeZone,
  onSelectZone,
  onSubmit,
  previousImage,
  referenceImage,
  revisingFrom,
  selectedBase,
  selectedName,
  selectedSize,
  selection,
  selectionZone,
}: DesignFormProps) => (
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
        {previousImage ? (
          <div
            className="design-selection-layer"
            aria-hidden="true"
            title="Marca la zona que quieres cambiar"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
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
      {previousImage ? (
        <DesignZonePicker
          generating={generating}
          onAdjust={onAdjustSelection}
          onSelectFree={onSelectFreeZone}
          onSelectZone={onSelectZone}
          selection={selection}
          selectionZone={selectionZone}
        />
      ) : null}
      <button type="button" className="design-back" onClick={onClose} disabled={generating}>
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
            ? "Marca dónde cabe el elemento nuevo y describe solo lo que quieres agregar. Conservaremos el diseño fuera de esa zona."
            : "Describe el diseño que imaginas. Lo aplicaremos sobre la prenda y la talla que elegiste."}
        </p>
      </header>

      <form className="design-form" ref={formRef} onSubmit={onSubmit} noValidate>
        <div className="design-prompt-box">
          <label htmlFor="design-idea">
            {previousImage
              ? detectedText
                ? "Texto a agregar"
                : "Describe solo el elemento nuevo"
              : "Describe tu idea"}
          </label>
          <textarea
            id="design-idea"
            ref={ideaRef}
            value={idea}
            maxLength={IDEA_MAX_LENGTH}
            disabled={generating}
            placeholder={
              previousImage
                ? detectedText
                  ? "Ejemplo: I LOVE YOU"
                  : "Ejemplo: un sol amarillo con rayos cortos."
                : "Ejemplo: un paisaje andino al atardecer, con líneas finas en el pecho."
            }
            aria-invalid={ideaError ? true : undefined}
            aria-describedby={
              ideaError ? "design-idea-hint design-idea-notice" : "design-idea-hint"
            }
            onChange={(event) => onChangeIdea(event.target.value)}
          />
          <div className="design-form-meta">
            <p id="design-idea-hint" className="form-hint">
              {previousImage
                ? detectedText
                  ? `Texto detectado: “${detectedText}”. Se agregará con una fuente legible en la zona marcada.`
                  : "Elige una zona sin dibujos que quieras conservar. El elemento aún no se adapta automáticamente a los pliegues."
                : "La IA ampliará tu idea con composición, estilo y restricciones."}{" "}
              Máximo {IDEA_MAX_LENGTH} caracteres.
            </p>
            <span className="design-form-count" aria-hidden="true">
              {idea.length}/{IDEA_MAX_LENGTH}
            </span>
          </div>
        </div>

        {previousImage ? null : (
          <ReferenceUpload
            disabled={generating}
            onChange={onReferenceChange}
            value={referenceImage}
          />
        )}

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
            actions={[{ label: "Reintentar", onClick: () => formRef.current?.requestSubmit() }]}
          >
            {generationError}
          </DesignNotice>
        ) : null}

        {generating ? (
          <div className="design-progress" ref={noticeRef}>
            <StatusMark />
            <div className="design-progress-body">
              <p className="design-progress-title" role="status">
                Tu diseño se está generando…
              </p>
              <p className="design-progress-meta">
                {elapsedSeconds > 0 ? <span aria-hidden="true">{elapsedSeconds} s · </span> : null}
                Suele tardar entre 15 y 60 segundos. No cierres esta página.
              </p>
            </div>
            <button type="button" className="design-text-action" onClick={onCancelGeneration}>
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
                ? detectedText
                  ? "Agregar texto"
                  : "Agregar al diseño"
                : "Generar propuesta"}
          </button>
          {previousImage && currentProposal ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={onCancelRevision}
              disabled={generating}
            >
              Volver a la propuesta
            </button>
          ) : null}
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={generating}
          >
            Volver a la prenda
          </button>
        </div>
      </form>
    </div>
  </section>
);
