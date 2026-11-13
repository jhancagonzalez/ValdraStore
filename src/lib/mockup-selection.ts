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

export type MockupCropRect = {
  left: number;
  top: number;
  size: number;
};

export type ResolvedMockupSelection = {
  selection: MockupSelection;
  selectionRect: MockupSelectionRect;
  cropRect: MockupCropRect;
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
    id: "bottom",
    label: "Bajo",
    selection: { x: 0.22, y: 0.62, width: 0.56, height: 0.3 },
  },
  {
    id: "left-sleeve",
    label: "Manga izquierda",
    selection: { x: 0.04, y: 0.24, width: 0.24, height: 0.32 },
  },
  {
    id: "right-sleeve",
    label: "Manga derecha",
    selection: { x: 0.72, y: 0.24, width: 0.24, height: 0.32 },
  },
  {
    id: "all",
    label: "Toda la prenda",
    selection: { x: 0.1, y: 0.1, width: 0.8, height: 0.84 },
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

/**
 * Convierte la selección normalizada en píxeles y calcula un recorte cuadrado
 * con contexto alrededor. El modelo edita el recorte; la composición final usa
 * solo `selectionRect`, así el resto del mockup no cambia.
 */
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

  const longestSide = Math.min(imageWidth, imageHeight);
  const minimumCrop = Math.max(64, Math.round(longestSide * 0.15));
  const desiredCrop = Math.round(Math.max(width, height) * 1.5);
  const cropSize = clamp(desiredCrop, minimumCrop, longestSide);
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const cropLeft = clamp(Math.round(centerX - cropSize / 2), 0, imageWidth - cropSize);
  const cropTop = clamp(Math.round(centerY - cropSize / 2), 0, imageHeight - cropSize);

  return {
    selection,
    selectionRect,
    cropRect: { left: cropLeft, top: cropTop, size: cropSize },
  };
};
