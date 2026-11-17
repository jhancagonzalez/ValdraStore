import type { CollectionBeforeOperationHook, PayloadRequest } from "payload";
import { APIError } from "payload";
import { hasAdminRole } from "@/access/roles";

/**
 * Fixed-window counter in PostgreSQL (security audit, rate limiting decision).
 * Keys are per operation and client IP, so a shared hosting IP can still reach
 * the limit on its own; the window resets every 15 minutes (1 hour for sign-up).
 * A distributed attacker rotating IPs can still exhaust the Brevo quota: this is
 * a best-effort guard, not a substitute for provider-side limits.
 */
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

const POLICIES: Record<string, { limit: number; windowMs?: number }> = {
  // A classroom or office behind one NAT shares the IP, so login and sign-up
  // leave room for a demo while still throttling brute force.
  "customers:create": { limit: 30, windowMs: 60 * 60 * 1000 },
  "customers:login": { limit: 30 },
  // 3 per 15 minutes keeps one IP below Brevo's 300 messages/day.
  "customers:forgotPassword": { limit: 3 },
  "admins:login": { limit: 30 },
  "admins:forgotPassword": { limit: 3 },
};

const clientIp = (req: PayloadRequest): string => {
  const forwarded = req.headers?.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers?.get("x-real-ip")?.trim();

  // Local development and direct requests have no proxy header: one shared
  // bucket is acceptable there because it only affects the local machine.
  return ip || "local";
};

export const enforceOperationRateLimit: CollectionBeforeOperationHook = async ({
  collection,
  operation,
  req,
}) => {
  // Administrators creating customer accounts from the panel are trusted.
  if (collection.slug === "customers" && operation === "create" && hasAdminRole(req.user)) {
    return;
  }

  const policy = POLICIES[`${collection.slug}:${operation}`];

  if (!policy) {
    return;
  }

  const ip = clientIp(req);

  // Local development must not lock the developer out after repeated tests;
  // production and LAN clients keep the limit.
  if (
    process.env.NODE_ENV !== "production" &&
    (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1")
  ) {
    return;
  }

  const windowMs = policy.windowMs ?? DEFAULT_WINDOW_MS;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const key = `${collection.slug}:${operation}:${ip}`;

  const { rows } = await req.payload.db.pool.query<{ hits: number }>(
    `INSERT INTO public.rate_limit_hits ("key", "window_start", "hits")
     VALUES ($1, $2, 1)
     ON CONFLICT ("key", "window_start")
     DO UPDATE SET "hits" = rate_limit_hits."hits" + 1
     RETURNING "hits"`,
    [key, windowStart],
  );

  if ((rows[0]?.hits ?? 0) > policy.limit) {
    throw new APIError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", 429);
  }

  // Old windows are useless; prune them occasionally without blocking the
  // request path on every hit.
  if (Math.random() < 0.01) {
    await req.payload.db.pool.query(
      `DELETE FROM public.rate_limit_hits WHERE "window_start" < now() - interval '1 day'`,
    );
  }
};
