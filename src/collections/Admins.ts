import type { CollectionConfig } from "payload";
import {
  canAccessAdminPanel,
  isAdmin,
  isAdminField,
  isAdminOrLocalBootstrap,
  isAdminOrLocalBootstrapField,
} from "@/access/roles";

export const Admins: CollectionConfig = {
  slug: "admins",
  auth: true,
  admin: {
    defaultColumns: ["email", "createdAt"],
    useAsTitle: "email",
  },
  access: {
    admin: canAccessAdminPanel,
    create: isAdminOrLocalBootstrap,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: "role",
      type: "select",
      defaultValue: "admin",
      options: [{ label: "Administrador", value: "admin" }],
      access: {
        create: isAdminOrLocalBootstrapField,
        update: isAdminField,
      },
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => ({
        ...data,
        role: "admin",
      }),
    ],
  },
  labels: {
    plural: "Administradores",
    singular: "Administrador",
  },
};
