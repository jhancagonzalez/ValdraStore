import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Hardening for the `media` table created in 20261023_185244: it never enabled
 * RLS or revoked Data API privileges explicitly, relying on the `ensure_rls`
 * trigger and the default privileges from the base migration (database audit).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE public."media" ENABLE ROW LEVEL SECURITY;
   REVOKE ALL PRIVILEGES ON TABLE public.media FROM anon, authenticated, service_role, PUBLIC;
   REVOKE ALL PRIVILEGES ON SEQUENCE public.media_id_seq FROM anon, authenticated, service_role, PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE public."media" DISABLE ROW LEVEL SECURITY;`);
}
