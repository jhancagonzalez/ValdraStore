import type { CollectionConfig } from "payload";
import { isAdmin } from "@/access/roles";
import { revalidateCatalog } from "@/hooks/revalidate-catalog";

/** Public catalog images (garments); writes are admin-only. */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  admin: {
    group: "Medios",
    useAsTitle: "filename",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Texto alternativo",
      required: true,
    },
  ],
  labels: {
    plural: "Medios de catálogo",
    singular: "Medio de catálogo",
  },
  hooks: {
    afterChange: [() => revalidateCatalog()],
    afterDelete: [() => revalidateCatalog()],
  },
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};
