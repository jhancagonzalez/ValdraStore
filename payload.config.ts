import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import { collections } from "@/collections";
import { ecommercePluginForCatalog } from "@/plugins/ecommerce";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta definir la variable ${name}. Consulta docs/desarrollo.md.`);
  }

  return value;
};

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, "app/(payload)"),
    },
    meta: {
      titleSuffix: " — Valdra Store",
    },
    user: "admins",
  },
  collections,
  db: postgresAdapter({
    pool: {
      connectionString: requiredEnvironmentVariable("DATABASE_URL"),
      max: 5,
    },
    disableCreateDatabase: true,
    migrationDir: path.resolve(dirname, "src/migrations"),
    // Prevent Payload/Drizzle from changing the hosted schema at application startup.
    push: false,
  }),
  plugins: [ecommercePluginForCatalog],
  secret: requiredEnvironmentVariable("PAYLOAD_SECRET"),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
