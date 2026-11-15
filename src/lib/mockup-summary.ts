import { getMockupBaseName, type MockupBase, type MockupSize } from "./mockup-bases";

/** Par etiqueta/valor que resume la configuración de un mockup (HU-15). */
export type MockupSummaryItem = { label: string; value: string };

/**
 * Construye el resumen de la propuesta: prenda, color y talla elegida.
 * Cuando no hay talla seleccionada se muestra «Sin elegir» (HU-15).
 */
export const getMockupSummary = (
  base: MockupBase,
  size: MockupSize | null,
): MockupSummaryItem[] => [
  { label: "Prenda", value: base.categoryLabel },
  { label: "Color", value: base.colorLabel },
  { label: "Talla", value: size ?? "Sin elegir" },
];

/** Texto alternativo descriptivo del mockup, con la talla cuando existe (HU-15). */
export const getMockupAlt = (base: MockupBase, size: MockupSize | null): string =>
  `Mockup de ${getMockupBaseName(base)}${size ? `, talla ${size}` : ""}, con la propuesta de diseño aplicada`;

/**
 * Nombre de archivo estable para descargar el mockup, con la extensión
 * derivada del tipo de imagen recibida (HU-15).
 */
export const getMockupDownloadName = (
  base: MockupBase,
  size: MockupSize | null,
  imageSrc: string,
): string => {
  const ext = imageSrc.startsWith("data:image/png")
    ? "png"
    : imageSrc.startsWith("data:image/webp")
      ? "webp"
      : "jpg";

  return `valdra-${base.id}-${size ?? "sin-talla"}.${ext}`;
};
