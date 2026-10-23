import type { CollectionConfig } from "payload";
import { canAccessAdminPanel, isAdmin, isAdminField } from "@/access/roles";

/** Customer account schema only; customer registration is not enabled here. */
export const Customers: CollectionConfig = {
  slug: "customers",
  auth: true,
  admin: {
    defaultColumns: ["email", "createdAt"],
    useAsTitle: "email",
  },
  access: {
    admin: canAccessAdminPanel,
    create: () => false,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
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
