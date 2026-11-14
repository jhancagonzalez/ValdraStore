import { detectImageMimeType } from "./image-bytes";
import type { AiImageInput } from "./types";

/** Límite aprobado para imágenes de referencia (HU-13: 10 MB). */
export const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;

export const REFERENCE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const REFERENCE_IMAGE_ACCEPT = REFERENCE_IMAGE_MIME_TYPES.join(",");

export type ReferenceImageResult =
  | { image: AiImageInput; ok: true }
  | { message: string; ok: false };

/**
 * Valida la imagen de referencia opcional antes de enviarla al proveedor.
 * El tipo se decide por los bytes, no por la extensión ni por el MIME declarado.
 */
export const parseReferenceImage = (bytes: Uint8Array | null | undefined): ReferenceImageResult => {
  if (!bytes || bytes.byteLength === 0) {
    return { message: "La imagen de referencia está vacía.", ok: false };
  }

  if (bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
    return { message: "La imagen de referencia supera el máximo de 10 MB.", ok: false };
  }

  const mimeType = detectImageMimeType(bytes);

  if (!mimeType) {
    return { message: "La imagen de referencia debe ser JPEG, PNG o WebP.", ok: false };
  }

  return { image: { bytes, mimeType }, ok: true };
};
