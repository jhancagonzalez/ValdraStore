import { readFile } from "node:fs/promises";
import path from "node:path";
import { createCloudflareAiProvider } from "./cloudflare-provider";
import { type AiErrorCode, AiProviderError, toAiErrorMessage } from "./errors";
import { findGarmentBase, isMockupSize } from "./garment-bases";
import { detectImageMimeType } from "./image-bytes";
import { buildProposalPrompt, IDEA_MAX_LENGTH, normalizeIdea } from "./proposal-prompt";
import { parseReferenceImage } from "./reference-image";
import { retryAsync } from "./retry";
import type { AiImageResult, AiProvider } from "./types";

export type ProposalFailureReason =
  | AiErrorCode
  | "invalid_base"
  | "invalid_idea"
  | "invalid_reference"
  | "invalid_size";

export type ProposalResult =
  | {
      ok: true;
      proposal: {
        /** Imagen lista para mostrar al cliente. */
        dataUrl: string;
        image: AiImageResult;
        /** Prompt efectivo; se conserva para evidencia, no se muestra crudo. */
        prompt: string;
      };
    }
  | { message: string; ok: false; reason: ProposalFailureReason };

export type ProposalInput = {
  baseId: unknown;
  idea: unknown;
  /** Bytes de la imagen de referencia opcional (HU-13); se validan aquí. */
  referenceImageBytes?: Uint8Array | null;
  size?: unknown;
};

export type ProposalDependencies = {
  maxAttempts?: number;
  provider?: AiProvider;
  readBaseImage?: (file: string) => Promise<Uint8Array>;
  /** Solo pruebas: permite acortar la espera entre reintentos. */
  retryDelaysMs?: readonly number[];
};

const defaultReadBaseImage = async (file: string): Promise<Uint8Array> => {
  const filePath = path.join(process.cwd(), "public", file.replace(/^\/+/, ""));
  return new Uint8Array(await readFile(filePath));
};

const toDataUrl = (image: AiImageResult): string =>
  `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`;

const failure = (reason: ProposalFailureReason, message: string): ProposalResult => ({
  message,
  ok: false,
  reason,
});

/**
 * Flujo de HU-14: valida la idea y la selección, resuelve la prenda base,
 * construye el prompt y llama al proveedor con reintentos acotados.
 * Devuelve mensajes seguros: nunca propaga la respuesta cruda del proveedor.
 */
export const generateDesignProposal = async (
  input: ProposalInput,
  dependencies: ProposalDependencies = {},
): Promise<ProposalResult> => {
  const idea = typeof input.idea === "string" ? normalizeIdea(input.idea) : "";

  if (idea === "") {
    return failure("invalid_idea", "Describe tu idea antes de generar la propuesta.");
  }

  if (idea.length > IDEA_MAX_LENGTH) {
    return failure(
      "invalid_idea",
      `La idea es demasiado larga. Usa máximo ${IDEA_MAX_LENGTH} caracteres.`,
    );
  }

  const base = findGarmentBase(typeof input.baseId === "string" ? input.baseId : null);

  if (!base) {
    return failure("invalid_base", "La prenda seleccionada no existe.");
  }

  if (typeof input.size === "string" && input.size !== "" && !isMockupSize(input.size)) {
    return failure("invalid_size", "Selecciona una talla válida.");
  }

  let referenceImage = null;

  if (input.referenceImageBytes) {
    const parsedReference = parseReferenceImage(input.referenceImageBytes);

    if (!parsedReference.ok) {
      return failure("invalid_reference", parsedReference.message);
    }

    referenceImage = parsedReference.image;
  }

  const readBaseImage = dependencies.readBaseImage ?? defaultReadBaseImage;
  let baseImage: Uint8Array;

  try {
    baseImage = await readBaseImage(base.file);
  } catch {
    return failure("unavailable", "No pudimos cargar la prenda seleccionada.");
  }

  // La referencia del cliente, si existe, es la entrada visual al modelo;
  // la prenda base define silueta y color en el prompt.
  const inputImage = referenceImage ?? {
    bytes: baseImage,
    mimeType: detectImageMimeType(baseImage) ?? ("image/jpeg" as const),
  };

  const prompt = buildProposalPrompt(base.name, idea);
  const provider = dependencies.provider ?? createCloudflareAiProvider();

  try {
    const image = await retryAsync(
      () =>
        provider.generateImage({
          prompt,
          referenceImage: inputImage,
        }),
      { maxAttempts: dependencies.maxAttempts, delaysMs: dependencies.retryDelaysMs },
    );

    return {
      ok: true,
      proposal: { dataUrl: toDataUrl(image), image, prompt },
    };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return failure(error.code, toAiErrorMessage(error));
    }

    return failure("unavailable", toAiErrorMessage(error));
  }
};
