import type { CollectionConfig } from "payload";
import { canAccessAdminPanel, isAdmin, isAdminField, isAdminOrSelf } from "@/access/roles";
import { passwordResetEmailHtml, resolveBaseUrl } from "@/services/email/templates";

/** Accepts digits with optional country prefix, spaces, hyphens or parentheses. */
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

/**
 * Customer accounts; public self-registration with server-assigned role (HU-01).
 * A customer reads and updates only their own document (HU-04).
 */
export const Customers: CollectionConfig = {
  slug: "customers",
  auth: {
    forgotPassword: {
      expiration: RESET_TOKEN_LIFETIME_MS,
      generateEmailHTML: (args) =>
        passwordResetEmailHtml({
          baseUrl: resolveBaseUrl(args?.req?.headers),
          name: args?.user?.name,
          token: args?.token ?? "",
        }),
      generateEmailSubject: () => "Restablece tu contraseña — Valdra Store",
    },
  },
  admin: {
    defaultColumns: ["name", "email", "createdAt"],
    useAsTitle: "email",
  },
  access: {
    admin: canAccessAdminPanel,
    create: () => true,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Nombre",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      label: "Teléfono",
      admin: {
        description: "Opcional. Incluye el indicativo del país si aplica.",
      },
      validate: (value: string | null | undefined) => {
        if (!value) {
          return true;
        }

        return (
          PHONE_PATTERN.test(value.trim()) ||
          "El teléfono debe tener entre 7 y 20 caracteres: dígitos, espacios, guiones o paréntesis."
        );
      },
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
