import { detectSupportedImageMimeType, type SupportedImageMimeType } from "./image-signature";

/** Límite aprobado para imágenes de referencia (HU-13): 10 MB. */
export const MAX_REFERENCE_FILE_BYTES = 10 * 1024 * 1024;

/** Extensiones que el navegador ofrece en el selector de archivos. */
export const REFERENCE_FILE_ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Lado máximo al que se reduce la referencia antes de enviarla. Vercel Hobby
 * limita el cuerpo de una función a 4,5 MB y una imagen de 10 MB en Base64
 * supera ese tope; 1536 px es además el tamaño que el servidor usa para el
 * modelo, así que no se pierde información útil.
 */
export const MAX_REFERENCE_UPLOAD_SIDE = 1536;

export type ReferenceValidation =
  | { mimeType: SupportedImageMimeType; ok: true }
  | { message: string; ok: false };

/**
 * Valida la referencia del cliente con los mismos criterios que el servidor:
 * tipo real por firma de bytes y máximo de 10 MB.
 */
export const validateReferenceBytes = (bytes: Uint8Array): ReferenceValidation => {
  if (bytes.byteLength === 0) {
    return { message: "La imagen de referencia está vacía.", ok: false };
  }

  if (bytes.byteLength > MAX_REFERENCE_FILE_BYTES) {
    return { message: "La imagen de referencia supera el máximo de 10 MB.", ok: false };
  }

  const mimeType = detectSupportedImageMimeType(bytes);

  if (!mimeType) {
    return { message: "La imagen de referencia debe ser JPEG, PNG o WebP.", ok: false };
  }

  return { mimeType, ok: true };
};

/**
 * Calcula el tamaño reducido conservando la proporción. Devuelve las medidas
 * originales si ya caben en el lado máximo.
 */
export const getScaledDimensions = (
  width: number,
  height: number,
  maxSide: number = MAX_REFERENCE_UPLOAD_SIDE,
): { height: number; width: number } => {
  if (width <= 0 || height <= 0) {
    return { height: 0, width: 0 };
  }

  const longest = Math.max(width, height);

  if (longest <= maxSide) {
    return { height, width };
  }

  const ratio = maxSide / longest;

  return {
    height: Math.max(1, Math.round(height * ratio)),
    width: Math.max(1, Math.round(width * ratio)),
  };
};

/** Formatea el peso del archivo para el mensaje de ayuda del formulario. */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(kb < 10 ? 1 : 0).replace(".", ",")} KB`;
  }

  return `${(kb / 1024).toFixed(1).replace(".", ",")} MB`;
};
