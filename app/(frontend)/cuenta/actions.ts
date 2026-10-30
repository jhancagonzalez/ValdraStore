"use server";

import { revalidatePath } from "next/cache";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import {
  type ProfileFieldValues,
  type ProfileFormState,
  updateCustomerProfile,
} from "@/services/customers/profile";

const readText = (formData: FormData, field: string): string => {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
};

/**
 * Server action behind the /cuenta form (HU-04). The id always comes from the
 * session. When something fails, the typed values come back so the customer does
 * not lose the new address, but the password is never echoed.
 */
export const saveProfile = async (
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> => {
  const values: ProfileFieldValues = {
    email: readText(formData, "email"),
    name: readText(formData, "name"),
    phone: readText(formData, "phone"),
  };

  const withValues = (state: ProfileFormState): ProfileFormState => ({ ...state, values });

  const customer = await getSessionCustomer();

  if (!customer) {
    return withValues({
      message: "Tu sesión expiró. Inicia sesión de nuevo.",
      status: "error",
    });
  }

  const payload = await getPayloadClient();
  const result = await updateCustomerProfile(payload, customer, {
    currentPassword: formData.get("currentPassword"),
    email: values.email,
    name: values.name,
    phone: values.phone,
  });

  if (!result.ok) {
    if (result.reason === "invalid") {
      return withValues({
        fieldErrors: result.fieldErrors,
        message: "Revisa los datos marcados y vuelve a intentarlo.",
        status: "error",
      });
    }

    if (result.reason === "email_in_use") {
      return withValues({
        fieldErrors: { email: "Este correo ya está registrado en otra cuenta." },
        message: "Ese correo ya está registrado en otra cuenta.",
        status: "error",
      });
    }

    if (result.reason === "password_required") {
      return withValues({
        fieldErrors: result.fieldErrors,
        message: "Para cambiar el correo, confirma tu contraseña actual.",
        status: "error",
      });
    }

    if (result.reason === "invalid_password") {
      return withValues({
        fieldErrors: { currentPassword: "La contraseña actual no es correcta." },
        message: "La contraseña actual no es correcta. El correo no cambió.",
        status: "error",
      });
    }

    if (result.reason === "locked") {
      return withValues({
        message:
          "La cuenta está bloqueada temporalmente por intentos fallidos. Espera unos minutos y vuelve a intentarlo.",
        status: "error",
      });
    }

    return withValues({
      message: "No pudimos guardar los cambios. Inténtalo de nuevo.",
      status: "error",
    });
  }

  revalidatePath("/cuenta");

  return { message: "Guardamos tus datos.", status: "success" };
};
