import {
  detectSupportedImageMimeType,
  type SupportedImageMimeType,
} from "../../lib/image-signature";
import { getMockupBase, isMockupSize, type MockupSize } from "../../lib/mockup-bases";
import { stripControlCharacters } from "../../lib/sanitize";

/** Mismo límite que la idea del personalizador principal. */
export const IDEA_MAX_LENGTH = 600;

/**
 * Tope de la imagen registrada. El data URL de una propuesta de 1024 px ronda
 * 1 MB; 3 millones de caracteres dejan margen sin permitir filas desmedidas.
 */
export const MAX_IMAGE_CHARS = 3_000_000;

const IMAGE_PREFIX = /^data:(image\/(?:jpeg|png|webp));base64,/;

export type ApprovalPayload = {
  baseId: string;
  idea: string;
  image: string;
  size: MockupSize;
};

export type ApprovalValidation =
  | { ok: true; value: ApprovalPayload }
  | { message: string; ok: false };

/**
 * Valida la solicitud de aprobación de HU-17 antes de tocar la base de datos.
 * No confía en el cliente: comprueba que la prenda existe, que la talla es una
 * de las ofrecidas, que la idea no está vacía y que la imagen es un data URL
 * de un tipo admitido y con tamaño acotado.
 */
export const parseApprovalPayload = (input: unknown): ApprovalValidation => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { message: "No pudimos leer la solicitud.", ok: false };
  }

  const body = input as {
    baseId?: unknown;
    idea?: unknown;
    image?: unknown;
    size?: unknown;
  };

  const base = getMockupBase(typeof body.baseId === "string" ? body.baseId : null);

  if (!base) {
    return { message: "La prenda seleccionada no existe.", ok: false };
  }

  if (typeof body.size !== "string" || !isMockupSize(body.size)) {
    return { message: "Selecciona una talla válida.", ok: false };
  }

  const idea =
    typeof body.idea === "string"
      ? stripControlCharacters(body.idea).replace(/\s+/g, " ").trim().slice(0, IDEA_MAX_LENGTH)
      : "";

  if (idea === "") {
    return { message: "La idea del diseño no puede estar vacía.", ok: false };
  }

  const image = typeof body.image === "string" ? body.image : "";
  const match = IMAGE_PREFIX.exec(image);

  if (!match) {
    return { message: "El diseño no llegó en un formato válido.", ok: false };
  }

  if (image.length > MAX_IMAGE_CHARS) {
    return { message: "El diseño es demasiado grande para registrarlo.", ok: false };
  }

  // El MIME declarado no basta: se comprueba la firma real de los bytes.
  const bytes = Buffer.from(image.slice(match[0].length), "base64");
  const mimeType = match[1] as SupportedImageMimeType;

  if (bytes.byteLength === 0 || detectSupportedImageMimeType(bytes) !== mimeType) {
    return { message: "El diseño no llegó en un formato válido.", ok: false };
  }

  return { ok: true, value: { baseId: base.id, idea, image, size: body.size } };
};
