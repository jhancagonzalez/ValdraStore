import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Base de pedidos del Sprint 3: `orders`, su historial de estados y el
 * inventario por prenda base + talla (`garment-stock`).
 *
 * Se escribe a mano para no arrastrar el esquema completo desde el último
 * snapshot. No se aplica automáticamente: `push: false` y la migración debe
 * revisarse y ejecutarse con `DATABASE_URL_MIGRATIONS` cuando se apruebe.
 *
 * Incluye RLS y revocación de privilegios de Data API para toda tabla nueva,
 * como exige la migración base del proyecto.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_status" AS ENUM('pendiente', 'en_produccion', 'lista', 'entregada', 'cancelada');
  CREATE TYPE "public"."enum_orders_source" AS ENUM('customer', 'admin');
  CREATE TYPE "public"."enum_orders_status_history_from_status" AS ENUM('pendiente', 'en_produccion', 'lista', 'entregada', 'cancelada');
  CREATE TYPE "public"."enum_orders_status_history_to_status" AS ENUM('pendiente', 'en_produccion', 'lista', 'entregada', 'cancelada');

  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"design_id" integer NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"garment_base" varchar NOT NULL,
  	"garment_label" varchar NOT NULL,
  	"category" varchar NOT NULL,
  	"color_label" varchar NOT NULL,
  	"size" varchar NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"total" numeric NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pendiente' NOT NULL,
  	"source" "enum_orders_source" NOT NULL,
  	"created_by_id" integer,
  	"stock_restored" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "orders_status_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_status" "enum_orders_status_history_from_status" NOT NULL,
  	"to_status" "enum_orders_status_history_to_status" NOT NULL,
  	"changed_at" timestamp(3) with time zone NOT NULL,
  	"changed_by_id" integer,
  	"note" varchar
  );

  CREATE TABLE "garment_stock" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"base_id" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"size" varchar NOT NULL,
  	"quantity" numeric DEFAULT 0 NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "garment_stock_id" integer;

  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_design_id_approved_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."approved_designs"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_status_history" ADD CONSTRAINT "orders_status_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_status_history" ADD CONSTRAINT "orders_status_history_changed_by_id_admins_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_garment_stock_fk" FOREIGN KEY ("garment_stock_id") REFERENCES "public"."garment_stock"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_design_id_idx" ON "orders" USING btree ("design_id");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "orders_status_history_order_idx" ON "orders_status_history" USING btree ("_order");
  CREATE INDEX "orders_status_history_parent_id_idx" ON "orders_status_history" USING btree ("_parent_id");
  CREATE INDEX "orders_status_history_changed_by_id_idx" ON "orders_status_history" USING btree ("changed_by_id");
  CREATE UNIQUE INDEX "garment_stock_key_idx" ON "garment_stock" USING btree ("key");
  CREATE INDEX "garment_stock_updated_at_idx" ON "garment_stock" USING btree ("updated_at");
  CREATE INDEX "garment_stock_created_at_idx" ON "garment_stock" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_garment_stock_id_idx" ON "payload_locked_documents_rels" USING btree ("garment_stock_id");

  ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public."orders_status_history" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public."garment_stock" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE public.orders, public.orders_status_history, public.garment_stock FROM anon, authenticated, service_role, PUBLIC;
  REVOKE ALL PRIVILEGES ON SEQUENCE public.orders_id_seq, public.orders_status_history_id_seq, public.garment_stock_id_seq FROM anon, authenticated, service_role, PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE public."orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public."orders_status_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public."garment_stock" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_garment_stock_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  DROP INDEX "payload_locked_documents_rels_garment_stock_id_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "garment_stock_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "orders_status_history" DROP CONSTRAINT "orders_status_history_changed_by_id_admins_id_fk";
  ALTER TABLE "orders_status_history" DROP CONSTRAINT "orders_status_history_parent_id_fk";
  ALTER TABLE "orders" DROP CONSTRAINT "orders_created_by_id_admins_id_fk";
  ALTER TABLE "orders" DROP CONSTRAINT "orders_design_id_approved_designs_id_fk";
  ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
  DROP INDEX "garment_stock_created_at_idx";
  DROP INDEX "garment_stock_updated_at_idx";
  DROP INDEX "garment_stock_key_idx";
  DROP INDEX "orders_status_history_changed_by_id_idx";
  DROP INDEX "orders_status_history_parent_id_idx";
  DROP INDEX "orders_status_history_order_idx";
  DROP INDEX "orders_created_at_idx";
  DROP INDEX "orders_updated_at_idx";
  DROP INDEX "orders_status_idx";
  DROP INDEX "orders_design_id_idx";
  DROP INDEX "orders_customer_id_idx";
  DROP TABLE "orders_status_history" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "garment_stock" CASCADE;
  DROP TYPE "public"."enum_orders_status_history_to_status";
  DROP TYPE "public"."enum_orders_status_history_from_status";
  DROP TYPE "public"."enum_orders_source";
  DROP TYPE "public"."enum_orders_status";`);
}
