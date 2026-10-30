import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Backing table for the per-IP fixed-window limiter in src/lib/rate-limit.ts.
 * Payload never reads it through its API; the table still follows the project
 * rule of RLS enabled and Data API privileges revoked.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
     "key" text NOT NULL,
     "window_start" timestamp (3) with time zone NOT NULL,
     "hits" integer DEFAULT 0 NOT NULL,
     PRIMARY KEY ("key", "window_start")
   );

   ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
   REVOKE ALL PRIVILEGES ON TABLE public.rate_limit_hits FROM anon, authenticated, service_role, PUBLIC;

   CREATE INDEX IF NOT EXISTS rate_limit_hits_window_idx ON public.rate_limit_hits ("window_start");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS public.rate_limit_hits;`);
}
