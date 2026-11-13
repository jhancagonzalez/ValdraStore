import { AiProviderError } from "./errors";
import { decodeBase64Image, detectImageMimeType } from "./image-bytes";
import type { AiImageMimeType, AiImageRequest, AiImageResult, AiProvider } from "./types";

export const CLOUDFLARE_PROVIDER_NAME = "cloudflare-workers-ai";
export const CLOUDFLARE_DEFAULT_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";

/**
 * Presupuesto por intento. Con tres intentos el total queda por debajo de los
 * 300 s que permite Vercel Hobby en Fluid Compute.
 */
export const CLOUDFLARE_DEFAULT_TIMEOUT_MS = 75_000;

const DOWNLOAD_TIMEOUT_MS = 30_000;

type CloudflareImageResponse = {
  errors?: unknown;
  result?: { image?: unknown };
  success?: boolean;
};

export type CloudflareAiProviderOptions = {
  accountId?: string;
  apiToken?: string;
  fetchImpl?: typeof fetch;
  model?: string;
  timeoutMs?: number;
};

const EXTENSION_BY_MIME: Record<AiImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Copia los bytes a un ArrayBuffer propio para construir el Blob del formulario. */
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
};

const fetchWithTimeout = async (
  fetchImpl: typeof fetch,
  url: string,
  init: Omit<RequestInit, "signal">,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<Response> => {
  if (signal?.aborted) {
    throw new AiProviderError("timeout", "La generación se canceló.", { retryable: false });
  }

  const controller = new AbortController();
  let timedOut = false;

  const onAbort = () => {
    controller.abort();
  };

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new AiProviderError("timeout", `Cloudflare no respondió dentro de ${timeoutMs} ms.`, {
        cause: error,
        retryable: true,
      });
    }

    if (signal?.aborted) {
      throw new AiProviderError("timeout", "La generación se canceló.", {
        cause: error,
        retryable: false,
      });
    }

    throw new AiProviderError("unavailable", "No se pudo conectar con Cloudflare.", {
      cause: error,
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
};

const resolveImage = async (
  value: unknown,
  fetchImpl: typeof fetch,
  signal: AbortSignal | undefined,
): Promise<{ bytes: Uint8Array; mimeType: AiImageMimeType } | null> => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const image = value.trim();

  if (image.startsWith("http://") || image.startsWith("https://")) {
    const download = await fetchWithTimeout(
      fetchImpl,
      image,
      { method: "GET" },
      DOWNLOAD_TIMEOUT_MS,
      signal,
    );

    if (!download.ok) {
      return null;
    }

    const bytes = new Uint8Array(await download.arrayBuffer());
    const mimeType = detectImageMimeType(bytes);

    return mimeType ? { bytes, mimeType } : null;
  }

  const base64 = image.startsWith("data:") ? image.slice(image.indexOf(",") + 1) : image;

  return decodeBase64Image(base64);
};

const parseProviderResponse = async (
  response: Response,
  model: string,
  fetchImpl: typeof fetch,
  signal: AbortSignal | undefined,
): Promise<AiImageResult> => {
  const rawBody = await response.text();

  if (response.status === 429) {
    throw new AiProviderError("quota_exceeded", "Cuota diaria de Cloudflare agotada.", {
      retryable: false,
    });
  }

  if (response.status === 401 || response.status === 403) {
    throw new AiProviderError(
      "not_configured",
      "Cloudflare rechazó las credenciales configuradas.",
      { retryable: false },
    );
  }

  if (rawBody.includes("flagged") || rawBody.includes("moderation")) {
    throw new AiProviderError("content_rejected", "El modelo rechazó el contenido.", {
      retryable: false,
    });
  }

  if (response.status >= 500) {
    throw new AiProviderError("unavailable", `Cloudflare respondió HTTP ${response.status}.`, {
      retryable: true,
    });
  }

  if (!response.ok) {
    throw new AiProviderError("unavailable", `Cloudflare respondió HTTP ${response.status}.`, {
      retryable: false,
    });
  }

  let body: CloudflareImageResponse | null = null;

  try {
    body = JSON.parse(rawBody) as CloudflareImageResponse;
  } catch {
    // Cloudflare puede devolver texto plano en un error de proxy.
  }

  if (body?.success !== true) {
    throw new AiProviderError("invalid_response", "Cloudflare no confirmó la generación.", {
      retryable: false,
    });
  }

  const image = await resolveImage(body.result?.image, fetchImpl, signal);

  if (!image) {
    throw new AiProviderError(
      "invalid_response",
      "La respuesta de Cloudflare no contiene una imagen válida.",
      { retryable: false },
    );
  }

  return {
    bytes: image.bytes,
    mimeType: image.mimeType,
    model,
    provider: CLOUDFLARE_PROVIDER_NAME,
  };
};

/**
 * Adaptador real de HU-14 sobre Cloudflare Workers AI. Sin credenciales falla
 * con `not_configured`; nunca cae a un modelo de pago ni simula una imagen.
 */
export const createCloudflareAiProvider = (
  options: CloudflareAiProviderOptions = {},
): AiProvider => {
  const accountId = (options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "").trim();
  const apiToken = (options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN ?? "").trim();
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? CLOUDFLARE_DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? CLOUDFLARE_DEFAULT_TIMEOUT_MS;

  return {
    model,

    name: CLOUDFLARE_PROVIDER_NAME,

    generateImage: async (request: AiImageRequest): Promise<AiImageResult> => {
      if (accountId === "" || apiToken === "") {
        throw new AiProviderError(
          "not_configured",
          "Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN.",
          { retryable: false },
        );
      }

      const prompt = request.prompt.trim();

      if (prompt === "") {
        throw new AiProviderError("invalid_response", "El prompt está vacío.", {
          retryable: false,
        });
      }

      const form = new FormData();
      form.append("prompt", prompt);

      if (request.referenceImage) {
        form.append(
          "input_image",
          new Blob([toArrayBuffer(request.referenceImage.bytes)], {
            type: request.referenceImage.mimeType,
          }),
          `reference.${EXTENSION_BY_MIME[request.referenceImage.mimeType]}`,
        );
      }

      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
        accountId,
      )}/ai/run/${model}`;

      const response = await fetchWithTimeout(
        fetchImpl,
        endpoint,
        {
          body: form,
          headers: { Authorization: `Bearer ${apiToken}` },
          method: "POST",
        },
        timeoutMs,
        request.signal,
      );

      return parseProviderResponse(response, model, fetchImpl, request.signal);
    },
  };
};
