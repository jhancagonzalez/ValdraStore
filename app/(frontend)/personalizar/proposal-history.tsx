"use client";

import Image from "next/image";
import { useId } from "react";
import { PROPOSAL_STRATEGY_LABELS, type ProposalHistory } from "@/lib/proposal-history";

type ProposalHistoryPanelProps = {
  disabled?: boolean;
  history: ProposalHistory;
  onCompare: (version: number | null) => void;
  onSelect: (version: number) => void;
};

/**
 * Historial de propuestas (HU-16): lista todas las versiones del proceso, permite
 * volver a cualquiera y elegir con cuál compararla. Solo vive en el navegador.
 */
export const ProposalHistoryPanel = ({
  disabled = false,
  history,
  onCompare,
  onSelect,
}: ProposalHistoryPanelProps) => {
  const titleId = useId();
  const compareId = useId();
  const { compareVersion, currentVersion, versions } = history;

  if (versions.length < 2) {
    return null;
  }

  return (
    <section className="proposal-history" aria-labelledby={titleId}>
      <header className="proposal-history-head">
        <h3 id={titleId} className="proposal-history-title">
          Historial de propuestas
          <span className="proposal-history-count">{versions.length} versiones</span>
        </h3>
        <div className="proposal-history-compare">
          <label htmlFor={compareId}>Comparar con</label>
          <select
            id={compareId}
            value={compareVersion ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onCompare(event.target.value === "" ? null : Number(event.target.value))
            }
          >
            <option value="">Prenda base</option>
            {versions
              .filter((item) => item.version !== currentVersion)
              .map((item) => (
                <option key={item.version} value={item.version}>
                  V{item.version} · {PROPOSAL_STRATEGY_LABELS[item.strategy]}
                </option>
              ))}
          </select>
        </div>
      </header>

      <ol className="proposal-history-list">
        {versions.map((item) => {
          const isCurrent = item.version === currentVersion;
          const isCompared = item.version === compareVersion;
          return (
            <li key={item.version}>
              <button
                type="button"
                className="proposal-history-item"
                aria-pressed={isCurrent}
                disabled={disabled}
                onClick={() => onSelect(item.version)}
              >
                <span className="proposal-history-thumb">
                  <Image src={item.image} alt="" fill sizes="120px" unoptimized />
                </span>
                <span className="proposal-history-label">
                  V{item.version}
                  {isCurrent ? " · Actual" : isCompared ? " · Comparando" : ""}
                </span>
                <span className="proposal-history-strategy">
                  {PROPOSAL_STRATEGY_LABELS[item.strategy]}
                  {item.basedOn ? ` desde V${item.basedOn}` : ""}
                </span>
                <span className="proposal-history-request">“{item.request}”</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="proposal-history-note">
        Elige una versión para verla o pedir cambios desde ella. El historial se conserva mientras
        no salgas de esta página.
      </p>
    </section>
  );
};
