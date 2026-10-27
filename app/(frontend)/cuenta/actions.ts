"use server";

import { revalidatePath } from "next/cache";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import { type ProfileFormState, updateCustomerProfile } from "@/services/customers/profile";

/** Server action behind the /cuenta form (HU-04). The id always comes from the session. */
export const saveProfile = async (
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> => {
  const customer = await getSessionCustomer();

  if (!customer) {
    return { message: "Tu sesión expiró. Inicia sesión de nuevo.", status: "error" };
  }

  const payload = await getPayloadClient();
  const result = await updateCustomerProfile(payload, customer, {
    email: formData.get("email"),
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!result.ok) {
    if (result.reason === "invalid") {
      return {
        fieldErrors: result.fieldErrors,
        message: "Revisa los datos marcados y vuelve a intentarlo.",
        status: "error",
      };
    }

    if (result.reason === "email_in_use") {
      return {
        fieldErrors: { email: "Este correo ya está registrado en otra cuenta." },
        message: "Ese correo ya está registrado en otra cuenta.",
        status: "error",
      };
    }

    return {
      message: "No pudimos guardar los cambios. Inténtalo de nuevo.",
      status: "error",
    };
  }

  revalidatePath("/cuenta");

  return { message: "Guardamos tus datos.", status: "success" };
};
