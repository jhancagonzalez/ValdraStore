/**
 * Moderación con modelo antes de generar (HU-12, HU-16).
 *
 * Segunda capa, solo en servidor, después de las reglas deterministas de
 * `lib/design-guard.ts`. Usa Llama Guard 3 en Cloudflare Workers AI, que clasifica
 * el texto con la taxonomía de riesgos de MLCommons (S1–S14).
 *
 * Si el moderador no responde, la petición continúa (fail-open) porque las reglas
 * deterministas ya se aplicaron; se registra para revisión. Ver «Requiere
 * aprobación» en la evidencia de HU-16.
 */

export const MODERATION_MODEL = "@cf/meta/llama-guard-3-8b";

const MODERATION_TIMEOUT_MS = 15_000;

/** Categorías de Llama Guard 3 que se bloquean para estampados. */
const BLOCKED_CATEGORIES = new Set([
  "S1", // Delitos violentos
  "S2", // Delitos no violentos
  "S3", // Delitos sexuales
  "S4", // Explotación sexual infantil
  "S5", // Difamación
  "S7", // Privacidad
  "S8", // Propiedad intelectual
  "S9", // Armas indiscriminadas
  "S10", // Odio
  "S11", // Suicidio y autolesión
  "S12", // Contenido sexual
  "S13", // Elecciones
  "S14", // Abuso de intérprete de código
]);

export type ModerationResult = {
  allowed: boolean;
  /** `false` cuando el moderador no estaba disponible y no se pudo verificar. */
  checked: boolean;
  categories: string[];
  message?: string;
};

type ModerationOptions = {
  accountId?: string;
  apiToken?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/**
 * Interpreta la salida de Llama Guard. Workers AI puede devolver texto
 * («safe» / «unsafe\nS1,S10») o un objeto con `safe` y `categories`.
 */
export const parseModerationOutput = (
  value: unknown,
): { safe: boolean; categories: string[] } | null => {
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();

    if (text.startsWith("safe")) {
      return { safe: true, categories: [] };
    }

    if (text.startsWith("unsafe")) {
      return { safe: false, categories: value.toUpperCase().match(/S\d{1,2}/g) ?? [] };
    }

    return null;
  }

  if (value && typeof value === "object" && "safe" in value) {
    const { categories, safe } = value as { safe?: unknown; categories?: unknown };

    if (typeof safe !== "boolean") {
      return null;
    }

    const list = Array.isArray(categories)
      ? categories
          .map(
            (item) =>
              String(item)
                .toUpperCase()
                .match(/S\d{1,2}/)?.[0],
          )
          .filter((item): item is string => Boolean(item))
      : [];

    return { safe, categories: list };
  }

  return null;
};

const messageFor = (categories: string[]) =>
  categories.includes("S8")
    ? "No podemos usar logos, marcas, escudos ni personajes con derechos de terceros. Describe un diseño original."
    : "Ese diseño no cumple las normas de contenido de Valdra Store. Prueba con otra idea.";

const unchecked = (): ModerationResult => ({ allowed: true, checked: false, categories: [] });

export const moderateDesignRequest = async (
  text: string,
  {
    accountId = process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken = process.env.CLOUDFLARE_API_TOKEN,
    fetchImpl = fetch,
    timeoutMs = MODERATION_TIMEOUT_MS,
  }: ModerationOptions = {},
): Promise<ModerationResult> => {
  if (!accountId || !apiToken) {
    return unchecked();
  }

  try {
    const response = await fetchImpl(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODERATION_MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Imprime este diseño en una camiseta: ${text}`,
            },
          ],
          max_tokens: 32,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    if (!response.ok) {
      return unchecked();
    }

    const body = (await response.json()) as { result?: { response?: unknown } };
    const parsed = parseModerationOutput(body.result?.response);

    if (!parsed) {
      return unchecked();
    }

    const blocked = parsed.categories.filter((category) => BLOCKED_CATEGORIES.has(category));

    if (!parsed.safe && (blocked.length > 0 || parsed.categories.length === 0)) {
      return {
        allowed: false,
        checked: true,
        categories: parsed.categories,
        message: messageFor(parsed.categories),
      };
    }

    return { allowed: true, checked: true, categories: parsed.categories };
  } catch {
    return unchecked();
  }
};
