/** Zona del mockup que el cliente autoriza a modificar en una revisión. */
export type MockupSelection = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MockupSelectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ResolvedMockupSelection = {
  selection: MockupSelection;
  selectionRect: MockupSelectionRect;
};

/** Zona de edición por defecto: el pecho, sin tocar mangas ni fondo. */
export const DEFAULT_REVISION_SELECTION: MockupSelection = {
  x: 0.18,
  y: 0.16,
  width: 0.64,
  height: 0.7,
};

/** Atajos para marcar zonas frecuentes sin dibujar el rectángulo. */
export const REVISION_ZONE_PRESETS = [
  { id: "chest", label: "Pecho", selection: DEFAULT_REVISION_SELECTION },
  {
    id: "detail",
    label: "Detalle superior",
    selection: { x: 0.58, y: 0.28, width: 0.12, height: 0.12 },
  },
  {
    id: "bottom",
    label: "Bajo",
    selection: { x: 0.22, y: 0.62, width: 0.56, height: 0.3 },
  },
] as const;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const round = (value: number) => Math.round(value * 10_000) / 10_000;

/**
 * Valida una selección normalizada (0 a 1). Descarta valores no finitos y
 * recorta los bordes para que el rectángulo nunca salga del mockup.
 */
export const parseMockupSelection = (value: unknown): MockupSelection | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const numbers = [candidate.x, candidate.y, candidate.width, candidate.height];

  if (!numbers.every((item) => typeof item === "number" && Number.isFinite(item))) {
    return null;
  }

  const x = clamp(candidate.x as number, 0, 1);
  const y = clamp(candidate.y as number, 0, 1);
  const right = clamp(x + (candidate.width as number), 0, 1);
  const bottom = clamp(y + (candidate.height as number), 0, 1);

  if (right - x < 0.02 || bottom - y < 0.02) {
    return null;
  }

  return {
    x: round(x),
    y: round(y),
    width: round(right - x),
    height: round(bottom - y),
  };
};

/** Convierte la selección normalizada en el rectángulo de composición. */
export const resolveMockupSelection = (
  selection: MockupSelection,
  imageWidth: number,
  imageHeight: number,
): ResolvedMockupSelection => {
  const width = Math.max(1, Math.round(selection.width * imageWidth));
  const height = Math.max(1, Math.round(selection.height * imageHeight));
  const left = clamp(Math.round(selection.x * imageWidth), 0, imageWidth - width);
  const top = clamp(Math.round(selection.y * imageHeight), 0, imageHeight - height);
  const selectionRect = { left, top, width, height };

  return { selection, selectionRect };
};
