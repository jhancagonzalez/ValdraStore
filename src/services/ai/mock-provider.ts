import { AiProviderError } from "./errors";
import type { AiImageRequest, AiImageResult, AiProvider } from "./types";

/** PNG transparente de 1×1 píxel. */
const PLACEHOLDER_PNG = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

export type MockAiProviderOptions = {
  /** Número de fallos transitorios simulados antes de responder bien. */
  failTimes?: number;
  model?: string;
};

/**
 * Proveedor falso SOLO para pruebas y para desarrollo local sin credenciales.
 * No se conecta a la interfaz real: la aplicación usa `CloudflareAiProvider`.
 * Una propuesta de este proveedor no cumple HU-14 y no puede presentarse como
 * generada por IA.
 */
export const createMockAiProvider = (options: MockAiProviderOptions = {}): AiProvider => {
  const model = options.model ?? "mock-model";
  let remainingFailures = options.failTimes ?? 0;

  return {
    model,

    name: "mock",

    generateImage: async (request: AiImageRequest): Promise<AiImageResult> => {
      if (request.prompt.trim() === "") {
        throw new AiProviderError("invalid_response", "El prompt está vacío.");
      }

      if (remainingFailures > 0) {
        remainingFailures -= 1;
        throw new AiProviderError("unavailable", "Fallo transitorio simulado.", {
          retryable: true,
        });
      }

      return {
        bytes: PLACEHOLDER_PNG,
        mimeType: "image/png",
        model,
        provider: "mock",
      };
    },
  };
};
