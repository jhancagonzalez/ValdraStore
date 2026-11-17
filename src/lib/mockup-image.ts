import sharp, { type Metadata } from "sharp";

export const MAX_REFERENCE_SIDE = 4096;
export const MAX_REFERENCE_PIXELS = 16_000_000;
export const MAX_PROCESSING_SIDE = 1536;

export type NormalizedReference = {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
};

/**
 * Rechaza imágenes con dimensiones abusivas y normaliza la referencia a un
 * máximo de 1536 px antes de pasarla a sharp o al proveedor de IA.
 */
export const normalizeReferenceImage = async (
  image: Buffer,
  mimeType: string,
): Promise<NormalizedReference | null> => {
  let metadata: Metadata;

  try {
    metadata = await sharp(image, { limitInputPixels: MAX_REFERENCE_PIXELS }).metadata();
  } catch {
    return null;
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (
    width === 0 ||
    height === 0 ||
    width > MAX_REFERENCE_SIDE ||
    height > MAX_REFERENCE_SIDE ||
    width * height > MAX_REFERENCE_PIXELS
  ) {
    return null;
  }

  if (width <= MAX_PROCESSING_SIDE && height <= MAX_PROCESSING_SIDE) {
    return { buffer: image, width, height, mimeType };
  }

  try {
    const buffer = await sharp(image, { limitInputPixels: MAX_REFERENCE_PIXELS })
      .resize({
        width: MAX_PROCESSING_SIDE,
        height: MAX_PROCESSING_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    const resized = await sharp(buffer).metadata();

    return {
      buffer,
      width: resized.width ?? width,
      height: resized.height ?? height,
      mimeType: "image/jpeg",
    };
  } catch {
    return null;
  }
};
