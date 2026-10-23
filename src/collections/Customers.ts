import type { CollectionConfig } from "payload";
import { canAccessAdminPanel, isAdmin, isAdminField } from "@/access/roles";

/** Customer accounts; public self-registration with server-assigned role (HU-01). */
export const Customers: CollectionConfig = {
  slug: "customers",
  auth: true,
  admin: {
    defaultColumns: ["name", "email", "createdAt"],
    useAsTitle: "email",
  },
  access: {
    admin: canAccessAdminPanel,
    create: () => true,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Nombre",
      required: true,
    },
    {
      name: "role",
      type: "select",
      defaultValue: "customer",
      options: [{ label: "Cliente", value: "customer" }],
      access: {
        create: isAdminField,
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
        role: "customer",
      }),
    ],
  },
  labels: {
    plural: "Clientes",
    singular: "Cliente",
  },
};
