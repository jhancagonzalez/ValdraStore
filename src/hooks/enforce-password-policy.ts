import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";
import { validateNewPassword } from "@/services/customers/password";

/**
 * Applies the project's password rules on the server, not only in the forms.
 * Without this, Payload's REST endpoints accept its default minimum of three
 * characters (security audit M-05).
 */
export const enforcePasswordPolicy: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data.password !== "string") {
    return data;
  }

  const result = validateNewPassword(data.password);

  if (!result.ok) {
    throw new APIError(result.message, 400);
  }

  return data;
};
