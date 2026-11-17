import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Registration now asks for Nombres and Apellidos separately (HU-01). The
 * column is optional so existing rows and admin-to-customer role changes keep
 * working; the public registration hook requires it for new accounts.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" ADD COLUMN "last_name" varchar;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" DROP COLUMN "last_name";`);
}
