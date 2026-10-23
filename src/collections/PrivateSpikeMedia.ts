import type { CollectionConfig } from "payload";
import { hasAdminRole, isAdmin } from "@/access/roles";

/**
 * Sprint 0 storage spike collection. It is restricted to administrators and
 * exists only to validate private uploads through Supabase S3.
 */
export const PrivateSpikeMedia: CollectionConfig = {
  slug: "private-spike-media",
  access: {
    admin: async ({ req }) => hasAdminRole(req.user),
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["filename", "mimeType", "filesize", "createdAt"],
    group: "Pruebas técnicas",
    useAsTitle: "filename",
  },
  fields: [],
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    staticDir: "private-spike-media",
  },
  labels: {
    plural: "Imágenes privadas de prueba",
    singular: "Imagen privada de prueba",
  },
};
