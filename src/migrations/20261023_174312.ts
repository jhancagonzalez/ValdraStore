import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "private_spike_media" (
	"id" serial PRIMARY KEY NOT NULL,
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

  ALTER TABLE "private_spike_media" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE public.private_spike_media FROM anon, authenticated, service_role, PUBLIC;
  REVOKE ALL PRIVILEGES ON SEQUENCE public.private_spike_media_id_seq FROM anon, authenticated, service_role, PUBLIC;

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "private_spike_media_id" integer;
  CREATE INDEX "private_spike_media_updated_at_idx" ON "private_spike_media" USING btree ("updated_at");
  CREATE INDEX "private_spike_media_created_at_idx" ON "private_spike_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "private_spike_media_filename_idx" ON "private_spike_media" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_spike_media_fk" FOREIGN KEY ("private_spike_media_id") REFERENCES "public"."private_spike_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_private_spike_media_id_idx" ON "payload_locked_documents_rels" USING btree ("private_spike_media_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_private_spike_media_fk";
  DROP INDEX "payload_locked_documents_rels_private_spike_media_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "private_spike_media_id";
  ALTER TABLE "private_spike_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "private_spike_media";`);
}
