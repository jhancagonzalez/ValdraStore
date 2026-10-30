import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * The application-level guards count admins before deleting, which two
 * concurrent transactions can both pass under READ COMMITTED. Serialize every
 * delete of `admins` and verify at commit that at least one row remains, so the
 * invariant also holds for manual SQL and role changes (security verification).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE OR REPLACE FUNCTION public.valdra_lock_admins_delete() RETURNS trigger
   LANGUAGE plpgsql AS $$
   BEGIN
     PERFORM pg_advisory_xact_lock(hashtext('valdra.admins.last_admin'));
     RETURN NULL;
   END;
   $$;

   CREATE OR REPLACE FUNCTION public.valdra_keep_last_admin() RETURNS trigger
   LANGUAGE plpgsql AS $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM public.admins) THEN
       RAISE EXCEPTION 'No se puede eliminar el último administrador' USING ERRCODE = '23514';
     END IF;
     RETURN NULL;
   END;
   $$;

   DROP TRIGGER IF EXISTS admins_lock_before_delete ON public.admins;
   CREATE TRIGGER admins_lock_before_delete
   BEFORE DELETE ON public.admins
   FOR EACH STATEMENT EXECUTE FUNCTION public.valdra_lock_admins_delete();

   DROP TRIGGER IF EXISTS admins_keep_last ON public.admins;
   CREATE CONSTRAINT TRIGGER admins_keep_last
   AFTER DELETE ON public.admins
   DEFERRABLE INITIALLY DEFERRED
   FOR EACH ROW EXECUTE FUNCTION public.valdra_keep_last_admin();`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TRIGGER IF EXISTS admins_keep_last ON public.admins;
   DROP TRIGGER IF EXISTS admins_lock_before_delete ON public.admins;
   DROP FUNCTION IF EXISTS public.valdra_keep_last_admin();
   DROP FUNCTION IF EXISTS public.valdra_lock_admins_delete();`);
}
