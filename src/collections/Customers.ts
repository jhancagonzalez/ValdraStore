import { APIError, type CollectionConfig } from "payload";
import {
  canAccessAdminPanel,
  hasAdminRole,
  isAdmin,
  isAdminField,
  isAdminOrSelf,
} from "@/access/roles";
import { enforcePasswordPolicy } from "@/hooks/enforce-password-policy";
import { requireCustomerLastName } from "@/hooks/require-customer-last-name";
import { validateResetPassword } from "@/hooks/validate-reset-password";
import { enforceOperationRateLimit } from "@/lib/rate-limit";
import { isEmailChange } from "@/services/customers/profile";
import { passwordResetEmailHtml } from "@/services/email/templates";

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
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
    forgotPassword: {
      expiration: RESET_TOKEN_LIFETIME_MS,
      minRequestInterval: 60_000,
      generateEmailHTML: (args) =>
        passwordResetEmailHtml({
          name: args?.user?.name,
          token: args?.token ?? "",
        }),
      generateEmailSubject: () => "Restablece tu contraseña — Valdra Store",
    },
  },
  admin: {
    group: "Cuentas",
    defaultColumns: ["name", "lastName", "email", "createdAt"],
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
      label: "Nombres",
      required: true,
      minLength: 2,
      maxLength: 80,
    },
    {
      name: "lastName",
      type: "text",
      label: "Apellidos",
      minLength: 2,
      maxLength: 80,
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
    beforeOperation: [validateResetPassword, enforceOperationRateLimit],
    beforeValidate: [enforcePasswordPolicy, requireCustomerLastName],
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        // A stolen session must not be able to replace the password through a
        // direct REST PATCH (security audit M-03). The reset flow bypasses this
        // hook, so password recovery keeps working.
        if (
          operation === "update" &&
          typeof data.password === "string" &&
          !hasAdminRole(req.user) &&
          req.context?.passwordChangeVerified !== true
        ) {
          throw new APIError(
            "Para cambiar la contraseña usa la recuperación de contraseña.",
            400,
          );
        }

        const nextEmail = typeof data.email === "string" ? data.email : undefined;
        const previousEmail =
          originalDoc && typeof originalDoc === "object" && "email" in originalDoc
            ? (originalDoc as { email?: unknown }).email
            : undefined;

        // The email is the login identifier: changing it requires the current
        // password, which only the profile server action verifies. The flag
        // travels in the server-side request context, so a direct REST call
        // cannot set it. Administrators keep editing freely from the panel.
        if (
          nextEmail &&
          typeof previousEmail === "string" &&
          isEmailChange(previousEmail, nextEmail) &&
          !hasAdminRole(req.user) &&
          req.context?.emailChangeVerified !== true
        ) {
          throw new APIError(
            "Para cambiar el correo electrónico confirma tu contraseña actual desde Mi cuenta.",
            400,
          );
        }

        return {
          ...data,
          role: "customer",
        };
      },
    ],
  },
  labels: {
    plural: "Clientes",
    singular: "Cliente",
  },
};
