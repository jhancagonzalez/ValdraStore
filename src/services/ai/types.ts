/** Tipos MIME aceptados para enviar imágenes al proveedor de IA. */
export type AiImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export type AiImageInput = {
  bytes: Uint8Array;
  mimeType: AiImageMimeType;
};

export type AiImageRequest = {
  /** Instrucción completa que recibe el modelo. */
  prompt: string;
  /** Imagen base de la prenda o referencia del cliente, si existe (HU-13). */
  referenceImage?: AiImageInput | null;
  /** Permite cancelar la generación en curso. */
  signal?: AbortSignal;
};

export type AiImageResult = {
  bytes: Uint8Array;
  mimeType: AiImageMimeType;
  /** Proveedor y modelo efectivos, sin secretos, para trazabilidad. */
  model: string;
  provider: string;
};

/**
 * Contrato intercambiable de generación de imágenes (HU-14, tarea S2-T04).
 * Toda implementación debe traducir sus fallos a `AiProviderError` para que la
 * capa de negocio decida si el error es reintentable.
 */
export type AiProvider = {
  readonly model: string;
  readonly name: string;
  generateImage: (request: AiImageRequest) => Promise<AiImageResult>;
};
