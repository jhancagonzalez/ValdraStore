"use server";

import { getPayloadClient } from "@/lib/payload";
import { validateNewPassword } from "@/services/customers/password";

export type ResetPasswordState = {
  message?: string;
  status: "idle" | "success" | "error";
};

/**
 * Step 2 of HU-03: applies the new password. The rules run on the server and
 * Payload's reset operation rejects a token that is unknown, expired or reused.
 */
export const submitNewPassword = async (
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> => {
  const token = String(formData.get("token") ?? "").trim();
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");

  if (!token) {
    return { message: "El enlace no es válido. Solicita uno nuevo.", status: "error" };
  }

  const validation = validateNewPassword(password, confirmation);

  if (!validation.ok) {
    return { message: validation.message, status: "error" };
  }

  const payload = await getPayloadClient();

  try {
    await payload.resetPassword({
      collection: "customers",
      data: { password: password as string, token },
      overrideAccess: true,
    });
  } catch {
    return {
      message: "El enlace es inválido, ya expiró o ya fue utilizado. Solicita uno nuevo.",
      status: "error",
    };
  }

  return { message: "Contraseña actualizada. Ya puedes iniciar sesión.", status: "success" };
};
