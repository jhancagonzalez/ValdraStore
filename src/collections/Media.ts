import type { CollectionConfig } from "payload";
import { isAdmin } from "@/access/roles";

/** Public catalog images (garments); writes are admin-only. */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
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
  upload: true,
};
