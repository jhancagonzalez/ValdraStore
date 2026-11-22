import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Refuerza el número de pedido de seis cifras: repara cualquier valor legado
 * fuera del formato (por ejemplo, el backfill `100000 + id` si el id creció
 * demasiado) y añade una restricción en PostgreSQL. La aplicación ya valida el
 * formato; la restricción protege la base ante escrituras externas.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
   DECLARE
     bad RECORD;
     candidate text;
     attempts integer;
   BEGIN
     FOR bad IN
       SELECT "id" FROM "orders" WHERE "order_number" !~ '^[1-9][0-9]{5}$'
     LOOP
       attempts := 0;
       LOOP
         candidate := (100000 + floor(random() * 900000))::int::text;
         EXIT WHEN NOT EXISTS (
           SELECT 1 FROM "orders" WHERE "order_number" = candidate AND "id" <> bad.id
         );
         attempts := attempts + 1;
         IF attempts >= 20 THEN
           RAISE EXCEPTION 'No se pudo asignar un número de pedido único';
         END IF;
       END LOOP;
       UPDATE "orders" SET "order_number" = candidate WHERE "id" = bad.id;
     END LOOP;
   END $$;

   ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_check"
     CHECK ("order_number" ~ '^[1-9][0-9]{5}$');`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_order_number_check";`);
}
