import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Colección de categorías del catálogo (HU-22, decisión D-09).
 *
 * Se escribe a mano, como las migraciones desde `20261115`, porque los snapshots
 * de Payload se detuvieron en `20261027_041746`. No se aplica automáticamente:
 * `push: false` y debe revisarse y ejecutarse con `DATABASE_URL_MIGRATIONS`.
 *
 * 1. Crea `categories` (nombre e identificador únicos y `active`).
 * 2. Siembra las cuatro opciones que tenía el `select` de prendas, activas y con
 *    el mismo identificador, para que los enlaces `?category=…` sigan sirviendo.
 * 3. Agrega `category_id` a prendas y a sus versiones, lo llena desde el valor
 *    anterior y elimina la columna y los tipos enumerados viejos.
 * 4. Deja RLS activo y los privilegios de Data API revocados.
 *
 * `down` devuelve el `select`: una prenda cuya categoría no sea una de las cuatro
 * originales queda sin categoría.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE UNIQUE INDEX "categories_name_idx" ON "categories" USING btree ("name");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_active_idx" ON "categories" USING btree ("active");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");

  INSERT INTO "categories" ("name", "slug", "active") VALUES
    ('Camisetas', 'camisetas', true),
    ('Hoodies', 'hoodies', true),
    ('Camisa', 'camisa', true),
    ('Gorras', 'gorras', true);

  ALTER TABLE "products" ADD COLUMN "category_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_category_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;

  UPDATE "products" p
  SET "category_id" = c."id"
  FROM "categories" c
  WHERE c."slug" = p."category"::text;

  UPDATE "_products_v" v
  SET "version_category_id" = c."id"
  FROM "categories" c
  WHERE c."slug" = v."version_category"::text;

  ALTER TABLE "products" DROP COLUMN "category";
  ALTER TABLE "_products_v" DROP COLUMN "version_category";
  DROP TYPE "public"."enum_products_category";
  DROP TYPE "public"."enum__products_v_version_category";

  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX "_products_v_version_version_category_idx" ON "_products_v" USING btree ("version_category_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");

  ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE public.categories FROM anon, authenticated, service_role, PUBLIC;
  REVOKE ALL PRIVILEGES ON SEQUENCE public.categories_id_seq FROM anon, authenticated, service_role, PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_category" AS ENUM('camisetas', 'hoodies', 'camisa', 'gorras');
  CREATE TYPE "public"."enum__products_v_version_category" AS ENUM('camisetas', 'hoodies', 'camisa', 'gorras');
  ALTER TABLE "products" ADD COLUMN "category" "enum_products_category";
  ALTER TABLE "_products_v" ADD COLUMN "version_category" "enum__products_v_version_category";

  UPDATE "products" p
  SET "category" = c."slug"::"enum_products_category"
  FROM "categories" c
  WHERE c."id" = p."category_id" AND c."slug" IN ('camisetas', 'hoodies', 'camisa', 'gorras');

  UPDATE "_products_v" v
  SET "version_category" = c."slug"::"enum__products_v_version_category"
  FROM "categories" c
  WHERE c."id" = v."version_category_id" AND c."slug" IN ('camisetas', 'hoodies', 'camisa', 'gorras');

  ALTER TABLE "products" DROP CONSTRAINT "products_category_id_categories_id_fk";
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_category_id_categories_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  DROP INDEX "products_category_idx";
  DROP INDEX "_products_v_version_version_category_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  ALTER TABLE "products" DROP COLUMN "category_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_category_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE public."categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories" CASCADE;`);
}
