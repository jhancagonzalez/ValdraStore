import type { AiImageInput, AiImageMimeType } from "./types";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

const startsWith = (bytes: Uint8Array, signature: readonly number[]): boolean => {
  if (bytes.byteLength < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
};

const ascii = (bytes: Uint8Array, start: number, end: number): string => {
  let text = "";

  for (let index = start; index < end; index += 1) {
    text += String.fromCharCode(bytes[index] ?? 0);
  }

  return text;
};

/**
 * Detecta el tipo real por la firma de los bytes. No se confía en el MIME que
 * declara el navegador: un archivo renombrado no debe llegar al modelo.
 */
export const detectImageMimeType = (bytes: Uint8Array): AiImageMimeType | null => {
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return "image/png";
  }

  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return "image/jpeg";
  }

  // Contenedor RIFF con marca WEBP en la cabecera.
  if (bytes.byteLength >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
};

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
