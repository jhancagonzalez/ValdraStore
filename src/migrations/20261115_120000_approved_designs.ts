import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Tabla del diseño final aprobado (HU-17). Se escribe a mano porque los
 * snapshots de Payload se detuvieron en `20261027_041746`; no se genera con
 * `payload:migrate:create` para no arrastrar el esquema completo.
 *
 * Además de la tabla y sus índices, deja el mismo endurecimiento que la
 * migración base exige para toda tabla nueva en `public`: RLS activo y
 * privilegios de Data API revocados para `anon`, `authenticated`,
 * `service_role` y `PUBLIC`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "approved_designs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"garment" varchar NOT NULL,
  	"garment_label" varchar NOT NULL,
  	"color_label" varchar NOT NULL,
  	"size" varchar NOT NULL,
  	"idea" varchar NOT NULL,
  	"image" varchar NOT NULL,
  	"approved_at" timestamp(3) with time zone NOT NULL,
  	"order_reference" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "approved_designs_id" integer;

  ALTER TABLE "approved_designs" ADD CONSTRAINT "approved_designs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_approved_designs_fk" FOREIGN KEY ("approved_designs_id") REFERENCES "public"."approved_designs"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "approved_designs_customer_idx" ON "approved_designs" USING btree ("customer_id");
  CREATE INDEX "approved_designs_garment_idx" ON "approved_designs" USING btree ("garment");
  CREATE INDEX "approved_designs_updated_at_idx" ON "approved_designs" USING btree ("updated_at");
  CREATE INDEX "approved_designs_created_at_idx" ON "approved_designs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_approved_designs_id_idx" ON "payload_locked_documents_rels" USING btree ("approved_designs_id");

  ALTER TABLE public."approved_designs" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE public.approved_designs FROM anon, authenticated, service_role, PUBLIC;
  REVOKE ALL PRIVILEGES ON SEQUENCE public.approved_designs_id_seq FROM anon, authenticated, service_role, PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE public."approved_designs" DISABLE ROW LEVEL SECURITY;
  DROP INDEX "payload_locked_documents_rels_approved_designs_id_idx";
  DROP INDEX "approved_designs_created_at_idx";
  DROP INDEX "approved_designs_updated_at_idx";
  DROP INDEX "approved_designs_garment_idx";
  DROP INDEX "approved_designs_customer_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "approved_designs_id";
  DROP TABLE "approved_designs" CASCADE;`);
}
