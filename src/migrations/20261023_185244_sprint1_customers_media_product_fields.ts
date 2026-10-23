import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_category" AS ENUM('camisetas', 'hoodies', 'camisa', 'gorras');
  CREATE TYPE "public"."enum__products_v_version_category" AS ENUM('camisetas', 'hoodies', 'camisa', 'gorras');
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "customers" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "products" ADD COLUMN "title" varchar;
  ALTER TABLE "products" ADD COLUMN "image_id" integer;
  ALTER TABLE "products" ADD COLUMN "category" "enum_products_category";
  ALTER TABLE "products" ADD COLUMN "material" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_category" "enum__products_v_version_category";
  ALTER TABLE "_products_v" ADD COLUMN "version_material" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_image_idx" ON "products" USING btree ("image_id");
  CREATE INDEX "_products_v_version_version_image_idx" ON "_products_v" USING btree ("version_image_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_image_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  DROP INDEX "products_image_idx";
  DROP INDEX "_products_v_version_version_image_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  ALTER TABLE "customers" DROP COLUMN "name";
  ALTER TABLE "products" DROP COLUMN "title";
  ALTER TABLE "products" DROP COLUMN "image_id";
  ALTER TABLE "products" DROP COLUMN "category";
  ALTER TABLE "products" DROP COLUMN "material";
  ALTER TABLE "_products_v" DROP COLUMN "version_title";
  ALTER TABLE "_products_v" DROP COLUMN "version_image_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_category";
  ALTER TABLE "_products_v" DROP COLUMN "version_material";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  DROP TYPE "public"."enum_products_category";
  DROP TYPE "public"."enum__products_v_version_category";`);
}
