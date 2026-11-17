import Image from "next/image";
import type { RefObject } from "react";
import type { MockupBase, MockupSize } from "@/lib/mockup-bases";
import type { ProposalHistory, ProposalVersion } from "@/lib/proposal-history";
import type { Approval } from "./approve-design";
import { ApproveDesign } from "./approve-design";
import { MockupViewer } from "./mockup-viewer";
import { ChevronDownIcon } from "./personalization-icons";
import { ProposalHistoryPanel } from "./proposal-history";

type DesignResultProps = {
  approvedDesign: Approval | null;
  compareImage: string | null;
  compareLabel: string;
  currentProposal: ProposalVersion | null;
  downloadExtension: string;
  generatedImage: string;
  generatedPrompt: string | null;
  history: ProposalHistory;
  idea: string;
  lastStrategy: "addition" | "text" | null;
  lastZoneLabel: string | null;
  onApproved: (approval: Approval) => void;
  onBeginRevision: () => void;
  onClose: () => void;
  onCompare: (version: number | null) => void;
  onDownload: () => void;
  onSelectVersion: (version: number) => void;
  resultRef: RefObject<HTMLElement | null>;
  selectedBase: MockupBase;
  selectedName: string;
  selectedSize: MockupSize | null;
};

/** Paso 3: comparar la propuesta, revisar versiones, aprobar o descargar. */
export const DesignResult = ({
  approvedDesign,
  compareImage,
  compareLabel,
  currentProposal,
  downloadExtension,
  generatedImage,
  generatedPrompt,
  history,
  idea,
  lastStrategy,
  lastZoneLabel,
  onApproved,
  onBeginRevision,
  onClose,
  onCompare,
  onDownload,
  onSelectVersion,
  resultRef,
  selectedBase,
  selectedName,
  selectedSize,
}: DesignResultProps) => (
  <section
    id="design-workspace"
    className="design-result"
    ref={resultRef}
    tabIndex={-1}
    aria-labelledby="design-workspace-title"
  >
    <header className="design-result-head">
      <h2 id="design-workspace-title">
        {idea.trim() ? "Así se ve tu idea" : "Así se ve tu imagen"}
      </h2>
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

      <MockupViewer
        key={generatedImage}
        base={selectedBase}
        size={selectedSize}
        imageSrc={generatedImage}
        label={
          currentProposal ? `Versión ${currentProposal.version} · Actual` : "Propuesta generada"
        }
      />
    </div>

    {approvedDesign ? null : (
      <ProposalHistoryPanel history={history} onCompare={onCompare} onSelect={onSelectVersion} />
    )}

    <div className="design-result-copy">
      {idea.trim() ? <p className="design-result-idea">“{idea.trim()}”</p> : null}
      {approvedDesign ? (
        <div className="design-approval-note" role="status">
          <p className="design-approval-title">Diseño aprobado</p>
          <p>
            Quedó registrado en tu cuenta
            {approvedDesign.approvedAt
              ? ` el ${new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(
                  new Date(approvedDesign.approvedAt),
                )}`
              : ""}
            . Ya no se puede modificar desde aquí; si quieres otro diseño, inicia una nueva
            personalización.
          </p>
        </div>
      ) : (
        <p className="design-result-note">
          Vista previa de prueba.{" "}
          {lastStrategy === "text"
            ? "El texto se agregó con una fuente legible; el resto del diseño anterior se conservó."
            : lastStrategy === "addition"
              ? "El elemento se agregó en la zona marcada. Los píxeles fuera de esa zona se conservaron; el dibujo nuevo puede cubrir lo que hubiera dentro."
              : idea.trim()
                ? "La propuesta se generó a partir de tu idea."
                : "La imagen de referencia se aplicó tal cual sobre la prenda."}{" "}
          Todavía no está registrada: si sales de esta página antes de aprobarla, se perderá.
          Descárgala si quieres conservarla.
        </p>
      )}
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
        {approvedDesign ? null : selectedSize ? (
          <ApproveDesign
            baseId={selectedBase.id}
            // La aprobación exige una descripción; con solo la referencia se
            // registra qué se estampó sin inventar una idea del cliente.
            idea={idea.trim() || "Imagen de referencia aplicada tal cual."}
            image={generatedImage}
            size={selectedSize}
            onApproved={onApproved}
          />
        ) : null}
        {approvedDesign ? null : (
          <button type="button" className="button button-secondary" onClick={onBeginRevision}>
            Pedir cambios
          </button>
        )}
        <a
          className="button button-secondary"
          href={generatedImage}
          download={`valdra-${selectedBase.id}-${selectedSize}${
            currentProposal ? `-v${currentProposal.version}` : ""
          }.${downloadExtension}`}
          onClick={onDownload}
        >
          Descargar diseño
        </a>
        <button type="button" className="design-text-action" onClick={onClose}>
          {approvedDesign ? "Nueva personalización" : "Elegir otra prenda"}
        </button>
      </div>
    </div>
  </section>
);
