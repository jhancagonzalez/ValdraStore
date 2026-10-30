"use server";

import { getPayloadClient } from "@/lib/payload";

export type RecoverFormState = {
  message?: string;
  status: "idle" | "success" | "error";
};

const GENERIC_MESSAGE =
  "Si el correo está registrado, enviamos un enlace para restablecer la contraseña. Revisa también la carpeta de spam.";

/**
 * Requests a reset link (HU-03). The response is always the same whether the
 * account exists or not, so the screen cannot be used to discover emails.
 */
export const requestPasswordReset = async (
  _previousState: RecoverFormState,
  formData: FormData,
): Promise<RecoverFormState> => {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { message: "Escribe tu correo electrónico.", status: "error" };
  }

  const payload = await getPayloadClient();

  try {
    await payload.forgotPassword({
      collection: "customers",
      data: { email },
      overrideAccess: true,
    });
  } catch {
    return {
      message: "No pudimos procesar la solicitud. Inténtalo de nuevo más tarde.",
      status: "error",
    };
  }

  return { message: GENERIC_MESSAGE, status: "success" };
};
