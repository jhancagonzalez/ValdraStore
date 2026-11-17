import type { CollectionBeforeOperationHook, CollectionConfig, Where } from "payload";
import { APIError } from "payload";
import {
  canAccessAdminPanel,
  hasAdminRole,
  isAdmin,
  isAdminField,
  isAdminOrLocalBootstrap,
  isAdminOrLocalBootstrapField,
  isLocalBootstrapEnabled,
} from "@/access/roles";
import { enforcePasswordPolicy } from "@/hooks/enforce-password-policy";
import { validateResetPassword } from "@/hooks/validate-reset-password";
import { enforceOperationRateLimit } from "@/lib/rate-limit";

/**
 * Bulk delete runs `beforeDelete` for every document in parallel, so the
 * last-admin guard cannot rely on it. Reject any request whose `where` would
 * remove every administrator (security verification, medium finding).
 */
const protectLastAdminOnBulkDelete: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== "delete") {
    return;
  }

  const where = (args as { where?: Where } | undefined)?.where;

  // Single-document deletion (deleteByID) also reaches this hook as "delete"
  // but without a `where`; the per-document beforeDelete guard covers it.
  if (!where) {
    return;
  }

  const { totalDocs: total } = await req.payload.count({
    collection: "admins",
    overrideAccess: true,
  });
  const { totalDocs: targeted } = await req.payload.count({
    collection: "admins",
    overrideAccess: true,
    where,
  });

  if (total > 0 && targeted >= total) {
    throw new APIError("No se pueden eliminar todos los administradores.", 400);
  }
};

export const Admins: CollectionConfig = {
  slug: "admins",
  auth: {
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
    forgotPassword: {
      minRequestInterval: 60_000,
    },
  },
  admin: {
    group: "Cuentas",
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
    beforeOperation: [
      validateResetPassword,
      protectLastAdminOnBulkDelete,
      enforceOperationRateLimit,
    ],
    beforeValidate: [enforcePasswordPolicy],
    beforeChange: [
      async ({ data, operation, req }) => {
        // Payload's /api/admins/first-register creates with overrideAccess, so the
        // collection hook is the only place that can enforce the local-only rule.
        if (operation === "create" && !hasAdminRole(req.user)) {
          if (!isLocalBootstrapEnabled()) {
            throw new APIError("La creación del primer administrador está deshabilitada.", 403);
          }

          const { totalDocs } = await req.payload.count({
            collection: "admins",
            overrideAccess: true,
          });

          if (totalDocs > 0) {
            throw new APIError("Ya existe un administrador. Inicia sesión para crear otro.", 403);
          }
        }

        return { ...data, role: "admin" };
      },
    ],
    beforeDelete: [
      async ({ req }) => {
        const { totalDocs } = await req.payload.count({
          collection: "admins",
          overrideAccess: true,
        });

        if (totalDocs <= 1) {
          throw new APIError("No se puede eliminar el último administrador.", 400);
        }
      },
    ],
  },
  labels: {
    plural: "Administradores",
    singular: "Administrador",
  },
};
