import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import { collections } from "@/collections";
import { ecommercePluginForCatalog } from "@/plugins/ecommerce";
import { createEmailAdapter } from "@/services/email/mailer";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta definir la variable ${name}. Consulta docs/desarrollo.md.`);
  }

  return value;
};

const s3StorageEnabled = Boolean(
  process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET,
);

const privateS3Storage = s3Storage({
  bucket: process.env.S3_BUCKET ?? "valdra-private-spike",
  clientUploads: true,
  collections: {
    "private-spike-media": {
      signedDownloads: {
        expiresIn: 900,
        shouldUseSignedURL: () => true,
      },
    },
  },
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    region: process.env.S3_REGION ?? "us-east-1",
  },
  enabled: s3StorageEnabled,
});

const catalogBucket = process.env.S3_CATALOG_BUCKET ?? "valdra-catalog-media";

/** Catalog images live in a public bucket; the stored URL is the public object URL. */
const catalogS3Storage = s3Storage({
  bucket: catalogBucket,
  collections: {
    media: {
      disablePayloadAccessControl: true,
      generateFileURL: ({ filename }) =>
        `${requiredEnvironmentVariable("SUPABASE_URL")}/storage/v1/object/public/${catalogBucket}/${filename}`,
    },
  },
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    region: process.env.S3_REGION ?? "us-east-1",
  },
  enabled: s3StorageEnabled,
});

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
  email: createEmailAdapter(),
  plugins: [ecommercePluginForCatalog, privateS3Storage, catalogS3Storage],
  secret: requiredEnvironmentVariable("PAYLOAD_SECRET"),
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
