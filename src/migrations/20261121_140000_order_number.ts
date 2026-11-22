import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Número de pedido visible de seis cifras (solicitud del cliente, 21 nov 2026).
 * Rellena los pedidos existentes y deja el campo único. No crea tablas, así que
 * la RLS y los privilegios revocados de `orders_core` siguen aplicando.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "order_number" varchar;
   UPDATE "orders" SET "order_number" = (100000 + "id")::text WHERE "order_number" IS NULL;
   ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;
   CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_order_number_idx";
   ALTER TABLE "orders" DROP COLUMN "order_number";`);
}
