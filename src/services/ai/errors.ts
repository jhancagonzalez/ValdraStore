export type AiErrorCode =
  | "content_rejected"
  | "invalid_response"
  | "not_configured"
  | "quota_exceeded"
  | "timeout"
  | "unavailable";

/** Solo los fallos transitorios justifican un reintento automático. */
const RETRYABLE_CODES: ReadonlySet<AiErrorCode> = new Set<AiErrorCode>(["timeout", "unavailable"]);

export class AiProviderError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;

  constructor(
    code: AiErrorCode,
    message: string,
    options: { cause?: unknown; retryable?: boolean } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AiProviderError";
    this.code = code;
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(code);
  }
}

export const isAiProviderError = (error: unknown): error is AiProviderError =>
  error instanceof AiProviderError;

/**
 * Mensajes seguros para el cliente. Nunca incluyen la respuesta cruda del
 * proveedor, la petición ni fragmentos de credenciales.
 */
export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  content_rejected: "No pudimos generar esa propuesta. Prueba con otra descripción.",
  invalid_response: "La propuesta no llegó completa. Inténtalo de nuevo.",
  not_configured:
    "El servicio de diseño no está disponible en este momento. Avisa a la persona administradora.",
  quota_exceeded: "La cuota gratuita de diseño se agotó por hoy. Inténtalo de nuevo más tarde.",
  timeout: "El servicio de diseño tardó demasiado. Inténtalo de nuevo.",
  unavailable: "No pudimos generar la propuesta. Inténtalo de nuevo.",
};

export const toAiErrorMessage = (error: unknown): string =>
  isAiProviderError(error) ? AI_ERROR_MESSAGES[error.code] : AI_ERROR_MESSAGES.unavailable;
