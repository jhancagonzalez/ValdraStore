import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Colección de diseños disponibles (HU-23, decisión D-10).
 *
 * Se escribe a mano, como las migraciones desde `20261115`, porque los snapshots
 * de Payload se detuvieron en `20261027_041746`. Las sentencias de esquema se
 * obtuvieron con el mismo generador de Drizzle que usa Payload, comparando el
 * esquema de `integracion` con el de esta rama, sin conectarse a la base.
 *
 * 1. Crea `designs` (nombre único, imagen, descripción y `active`).
 * 2. Agrega `designs_id` a las tablas de relaciones de prendas y de bloqueo.
 * 3. Convierte los diseños que hoy son medios (`products.designs`) en documentos de
 *    `designs`, activos, y apunta las relaciones existentes al nuevo documento.
 * 4. Deja RLS activo y los privilegios de Data API revocados (D-16, D-17).
 *
 * `down` devuelve las relaciones a sus medios antes de borrar la tabla.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "designs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"description" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "products_rels" ADD COLUMN "designs_id" integer;
  ALTER TABLE "_products_v_rels" ADD COLUMN "designs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "designs_id" integer;
  ALTER TABLE "designs" ADD CONSTRAINT "designs_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "designs_name_idx" ON "designs" USING btree ("name");
  CREATE INDEX "designs_image_idx" ON "designs" USING btree ("image_id");
  CREATE INDEX "designs_active_idx" ON "designs" USING btree ("active");
  CREATE INDEX "designs_updated_at_idx" ON "designs" USING btree ("updated_at");
  CREATE INDEX "designs_created_at_idx" ON "designs" USING btree ("created_at");
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_designs_fk" FOREIGN KEY ("designs_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_designs_fk" FOREIGN KEY ("designs_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_designs_fk" FOREIGN KEY ("designs_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_rels_designs_id_idx" ON "products_rels" USING btree ("designs_id");
  CREATE INDEX "_products_v_rels_designs_id_idx" ON "_products_v_rels" USING btree ("designs_id");
  CREATE INDEX "payload_locked_documents_rels_designs_id_idx" ON "payload_locked_documents_rels" USING btree ("designs_id");

  INSERT INTO "designs" ("name", "image_id", "active")
  SELECT
    left(coalesce(nullif(trim(m."alt"), ''), 'Diseño'), 70) || ' (' || m."id" || ')',
    m."id",
    true
  FROM "media" m
  WHERE m."id" IN (
    SELECT "media_id" FROM "products_rels" WHERE "path" = 'designs' AND "media_id" IS NOT NULL
    UNION
    SELECT "media_id" FROM "_products_v_rels" WHERE "path" = 'version.designs' AND "media_id" IS NOT NULL
  );

  UPDATE "products_rels" r
  SET "designs_id" = d."id", "media_id" = NULL
  FROM "designs" d
  WHERE r."path" = 'designs' AND r."media_id" = d."image_id";

  UPDATE "_products_v_rels" r
  SET "designs_id" = d."id", "media_id" = NULL
  FROM "designs" d
  WHERE r."path" = 'version.designs' AND r."media_id" = d."image_id";

  ALTER TABLE public."designs" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE public.designs FROM anon, authenticated, service_role, PUBLIC;
  REVOKE ALL PRIVILEGES ON SEQUENCE public.designs_id_seq FROM anon, authenticated, service_role, PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "products_rels" r
  SET "media_id" = d."image_id", "designs_id" = NULL
  FROM "designs" d
  WHERE r."path" = 'designs' AND r."designs_id" = d."id";

  UPDATE "_products_v_rels" r
  SET "media_id" = d."image_id", "designs_id" = NULL
  FROM "designs" d
  WHERE r."path" = 'version.designs' AND r."designs_id" = d."id";

  ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_designs_fk";
  ALTER TABLE "_products_v_rels" DROP CONSTRAINT "_products_v_rels_designs_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_designs_fk";
  DROP INDEX "products_rels_designs_id_idx";
  DROP INDEX "_products_v_rels_designs_id_idx";
  DROP INDEX "payload_locked_documents_rels_designs_id_idx";
  ALTER TABLE "products_rels" DROP COLUMN "designs_id";
  ALTER TABLE "_products_v_rels" DROP COLUMN "designs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "designs_id";
  ALTER TABLE public."designs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "designs" CASCADE;`);
}
