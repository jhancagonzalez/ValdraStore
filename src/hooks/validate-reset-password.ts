import type { CollectionBeforeOperationHook } from "payload";
import { APIError } from "payload";
import { validateNewPassword } from "@/services/customers/password";

/**
 * Payload's reset password operation hashes the password before the collection
 * `beforeValidate` hooks run, so they never see it. This hook validates the
 * plain password from the REST payload (security audit M-02).
 */
export const validateResetPassword: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== "resetPassword") {
    return;
  }

  const data = (args as { data?: { password?: unknown } } | undefined)?.data;
  const result = validateNewPassword(data?.password);

  if (!result.ok) {
    throw new APIError(result.message, 400);
  }
};
