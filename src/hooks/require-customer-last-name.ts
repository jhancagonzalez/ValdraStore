import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";
import { hasAdminRole } from "@/access/roles";

/**
 * Public registration asks for Apellidos (HU-01). The column stays optional so
 * an admin can still be demoted to customer without inventing a surname, while
 * the public endpoint cannot create an account without it.
 */
export const requireCustomerLastName: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== "create" || hasAdminRole(req.user)) {
    return data;
  }

  const lastName = typeof data?.lastName === "string" ? data.lastName.trim() : "";

  if (lastName.length < 2) {
    throw new APIError("Escribe tus apellidos (mínimo 2 caracteres).", 400);
  }

  return data;
};
