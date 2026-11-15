import { detectSupportedImageMimeType } from "../../lib/image-signature";
import type { AiImageInput, AiImageMimeType } from "./types";

/**
 * Detecta el tipo real por la firma de los bytes. No se confía en el MIME que
 * declara el navegador: un archivo renombrado no debe llegar al modelo.
 *
 * La implementación vive en `src/lib/image-signature.ts` porque el navegador
 * también necesita validar la referencia (HU-13) sin importar código de Node.
 */
export const detectImageMimeType = (bytes: Uint8Array): AiImageMimeType | null =>
  detectSupportedImageMimeType(bytes);

/** Decodifica Base64 puro (sin prefijo `data:`) y valida que sea una imagen. */
export const decodeBase64Image = (value: string): AiImageInput | null => {
  const compact = value.replace(/\s+/g, "");

  if (compact === "") {
    return null;
  }

  const bytes = new Uint8Array(Buffer.from(compact, "base64"));

  if (bytes.byteLength === 0) {
    return null;
  }

  const mimeType = detectImageMimeType(bytes);

  return mimeType ? { bytes, mimeType } : null;
};
