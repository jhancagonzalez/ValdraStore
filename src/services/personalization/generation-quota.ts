import type { Payload } from "payload";

/** Límite aprobado para el personalizador (3 propuestas por cuenta y día). */
export const DAILY_GENERATION_LIMIT = 3;

export type GenerationQuota = { allowed: true; remaining: number } | { allowed: false };

type QueryPool = {
  query: <T>(sql: string, params: unknown[]) => Promise<{ rows: T[] }>;
};

const startOfUtcDay = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/**
 * Consume una generación del cupo diario con un contador atómico en PostgreSQL.
 * La ventana se reinicia a medianoche UTC. Si la consulta falla, el llamador
 * debe fallar cerrado y no permitir la generación.
 */
export const consumeDailyGenerationQuota = async (
  payload: Payload,
  customerId: number | string,
  now = new Date(),
): Promise<GenerationQuota> => {
  const pool = (payload.db as unknown as { pool: QueryPool }).pool;
  const windowStart = startOfUtcDay(now);
  const key = `design-generation:${customerId}:daily`;
  const { rows } = await pool.query<{ hits: number }>(
    `INSERT INTO public.rate_limit_hits ("key", "window_start", "hits")
     VALUES ($1, $2, 1)
     ON CONFLICT ("key", "window_start")
     DO UPDATE SET "hits" = rate_limit_hits."hits" + 1
     RETURNING "hits"`,
    [key, windowStart],
  );

  const hits = rows[0]?.hits ?? 0;

  return hits <= DAILY_GENERATION_LIMIT
    ? { allowed: true, remaining: Math.max(0, DAILY_GENERATION_LIMIT - hits) }
    : { allowed: false };
};
