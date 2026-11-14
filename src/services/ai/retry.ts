import { AiProviderError, isAiProviderError } from "./errors";

/** Un intento inicial y dos reintentos: suficiente para un fallo transitorio. */
export const DEFAULT_MAX_ATTEMPTS = 3;

export const DEFAULT_RETRY_DELAYS_MS = [800, 2000] as const;

export type RetryAttemptInfo = {
  attempt: number;
  error: AiProviderError;
  nextDelayMs: number;
};

export type RetryOptions = {
  delaysMs?: readonly number[];
  maxAttempts?: number;
  onRetry?: (info: RetryAttemptInfo) => void;
  signal?: AbortSignal;
  sleep?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
};

const cancellationError = (): AiProviderError =>
  new AiProviderError("timeout", "La generación se canceló o tardó demasiado.", {
    retryable: false,
  });

/** Espera entre reintentos que se interrumpe si el cliente cancela la petición. */
export const sleepWithSignal = (delayMs: number, signal?: AbortSignal): Promise<void> => {
  if (signal?.aborted) {
    return Promise.reject(cancellationError());
  }

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(cancellationError());
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

/**
 * Ejecuta una operación con reintentos acotados. Solo reintenta errores de
 * proveedor marcados como transitorios; los de cuota, configuración o
 * contenido rechazado se devuelven de inmediato.
 */
export const retryAsync = async <T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const delays = options.delaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const sleep = options.sleep ?? sleepWithSignal;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.aborted) {
      throw cancellationError();
    }

    try {
      return await operation(attempt);
    } catch (error) {
      const canRetry = isAiProviderError(error) && error.retryable && attempt < maxAttempts;

      if (!canRetry) {
        throw error;
      }

      const nextDelayMs = delays[Math.min(attempt - 1, delays.length - 1)] ?? 0;
      options.onRetry?.({
        attempt,
        error,
        nextDelayMs,
      });

      await sleep(nextDelayMs, options.signal);
    }
  }

  // Inalcanzable: el bucle devuelve o lanza en la última iteración.
  throw new AiProviderError("unavailable", "La generación no se pudo completar.");
};
