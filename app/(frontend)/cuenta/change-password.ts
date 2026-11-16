"use server";

import { revalidatePath } from "next/cache";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import { validateNewPassword } from "@/services/customers/password";
import { verifyCurrentPassword } from "@/services/customers/profile";

export type ChangePasswordField = "confirmPassword" | "currentPassword" | "newPassword";

export type ChangePasswordState = {
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
  message?: string;
  status: "idle" | "success" | "error";
};

const readText = (formData: FormData, field: string): string => {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
};

/**
 * Cambia la contraseña del cliente autenticado. La identidad sale de la sesión,
 * la contraseña actual se verifica con el login de Payload (que aplica el
 * rate-limit de intentos) y el contexto `passwordChangeVerified` autoriza la
 * escritura en el hook de la colección.
 */
export const changePassword = async (
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> => {
  const currentPassword = readText(formData, "currentPassword");
  const newPassword = readText(formData, "newPassword");
  const confirmPassword = readText(formData, "confirmPassword");
  const fieldErrors: Partial<Record<ChangePasswordField, string>> = {};

  if (!currentPassword) {
    fieldErrors.currentPassword = "Escribe tu contraseña actual.";
  }

  const validation = validateNewPassword(newPassword);

  if (!validation.ok) {
    fieldErrors.newPassword = validation.message;
  } else if (newPassword !== confirmPassword) {
    fieldErrors.confirmPassword = "Las contraseñas no coinciden.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Revisa los campos marcados.",
      status: "error",
    };
  }

  if (newPassword === currentPassword) {
    return {
      fieldErrors: { newPassword: "Elige una contraseña distinta de la actual." },
      message: "La nueva contraseña debe ser diferente de la actual.",
      status: "error",
    };
  }

  const customer = await getSessionCustomer();

  if (!customer) {
    return { message: "Tu sesión expiró. Inicia sesión de nuevo.", status: "error" };
  }

  const payload = await getPayloadClient();
  const verification = await verifyCurrentPassword(payload, customer, currentPassword);

  if (verification === "locked") {
    return {
      message:
        "La cuenta está bloqueada temporalmente por intentos fallidos. Espera unos minutos y vuelve a intentarlo.",
      status: "error",
    };
  }

  if (verification !== "valid") {
    return {
      fieldErrors: { currentPassword: "La contraseña actual no es correcta." },
      message: "La contraseña actual no es correcta.",
      status: "error",
    };
  }

  try {
    await payload.update({
      collection: "customers",
      context: { passwordChangeVerified: true },
      data: { password: newPassword },
      id: customer.id,
      overrideAccess: false,
      user: customer,
    });
  } catch {
    return {
      message: "No pudimos cambiar la contraseña. Inténtalo de nuevo.",
      status: "error",
    };
  }

  revalidatePath("/cuenta");

  return { message: "Tu contraseña se actualizó correctamente.", status: "success" };
};
