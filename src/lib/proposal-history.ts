/**
 * Historial de propuestas de una personalización (HU-16).
 *
 * Por la decisión del 2026-11-13 las propuestas viven solo en el navegador: este
 * módulo es estado puro e inmutable, sin persistencia. Cada versión guarda la imagen,
 * la petición del cliente y el brief acumulado hasta ese momento, para que pedir
 * cambios desde una versión anterior parta de su propio contexto.
 */

export type ProposalStrategy = "create" | "inpaint" | "text" | "redesign";

export type ProposalVersion = {
  /** Versión anterior desde la que se pidió el cambio; `null` en la propuesta inicial. */
  basedOn: number | null;
  /** Brief acumulado (idea + ajustes) después de esta versión. */
  brief: string;
  createdAt: number;
  /** Imagen completa del mockup como data URL. */
  image: string;
  /** Prompt mejorado que devolvió el servidor, si lo hubo. */
  prompt: string | null;
  /** Texto que escribió el cliente para esta versión. */
  request: string;
  strategy: ProposalStrategy;
  /** Número consecutivo visible para el cliente (V1, V2…). */
  version: number;
  zoneLabel: string | null;
};

export type ProposalHistory = {
  /** Versión que aparece a la izquierda; `null` muestra la prenda base. */
  compareVersion: number | null;
  /** Versión que el cliente está viendo. */
  currentVersion: number | null;
  versions: ProposalVersion[];
};

export type NewProposal = Omit<ProposalVersion, "createdAt" | "version"> & {
  createdAt?: number;
};

export const EMPTY_PROPOSAL_HISTORY: ProposalHistory = {
  compareVersion: null,
  currentVersion: null,
  versions: [],
};

export const PROPOSAL_STRATEGY_LABELS: Record<ProposalStrategy, string> = {
  create: "Propuesta inicial",
  inpaint: "Cambio en una zona",
  redesign: "Rediseño del estampado",
  text: "Texto agregado",
};

export const getProposalVersion = (
  history: ProposalHistory,
  version: number | null,
): ProposalVersion | null =>
  version === null ? null : (history.versions.find((item) => item.version === version) ?? null);

export const getCurrentProposal = (history: ProposalHistory): ProposalVersion | null =>
  getProposalVersion(history, history.currentVersion);

/**
 * Agrega una versión nueva al final, la deja como actual y la compara por defecto
 * con la versión de la que partió (o con la prenda base si es la inicial).
 */
export const addProposalVersion = (
  history: ProposalHistory,
  proposal: NewProposal,
): ProposalHistory => {
  const lastVersion = history.versions.at(-1)?.version ?? 0;
  const version = lastVersion + 1;
  const basedOn =
    proposal.basedOn !== null && getProposalVersion(history, proposal.basedOn)
      ? proposal.basedOn
      : null;

  return {
    compareVersion: basedOn,
    currentVersion: version,
    versions: [
      ...history.versions,
      {
        ...proposal,
        basedOn,
        createdAt: proposal.createdAt ?? Date.now(),
        version,
      },
    ],
  };
};

/**
 * Muestra una versión anterior sin borrar las demás. Si quedaría comparada consigo
 * misma, la comparación pasa a la versión de la que partió.
 */
export const selectProposalVersion = (
  history: ProposalHistory,
  version: number,
): ProposalHistory => {
  const selected = getProposalVersion(history, version);

  if (!selected) {
    return history;
  }

  const compareVersion =
    history.compareVersion === version ? selected.basedOn : history.compareVersion;

  return { ...history, compareVersion, currentVersion: version };
};

/** Cambia la versión de la izquierda; `null` compara con la prenda base. */
export const compareProposalWith = (
  history: ProposalHistory,
  version: number | null,
): ProposalHistory => {
  if (version === null) {
    return { ...history, compareVersion: null };
  }

  if (version === history.currentVersion || !getProposalVersion(history, version)) {
    return history;
  }

  return { ...history, compareVersion: version };
};
