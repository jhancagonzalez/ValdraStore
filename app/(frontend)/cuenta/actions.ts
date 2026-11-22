"use server";

import { revalidatePath } from "next/cache";
import { APIError } from "payload";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import {
  type ProfileFieldValues,
  type ProfileFormState,
  updateCustomerProfile,
  verifyCurrentPassword,
} from "@/services/customers/profile";
import { countActiveOrdersForCustomer } from "@/services/orders/customer-account";

export type DeleteAccountState = {
  message?: string;
  reason?: "active_orders" | "invalid_password" | "locked" | "password_required";
  status: "error" | "idle" | "success";
};

/** Deletes the signed-in customer's own account only; the id always comes from the session. */
export const deleteAccount = async (password: string): Promise<DeleteAccountState> => {
  const customer = await getSessionCustomer();

  if (!customer) {
    return { message: "Tu sesión expiró. Inicia sesión de nuevo.", status: "error" };
  }

  const currentPassword = password.trim();

  if (!currentPassword) {
    return {
      message: "Escribe tu contraseña actual para eliminar la cuenta.",
      reason: "password_required",
      status: "error",
    };
  }

  const payload = await getPayloadClient();
  const verification = await verifyCurrentPassword(payload, customer, currentPassword);

  if (verification !== "valid") {
    return verification === "locked"
      ? {
          message:
            "La cuenta está bloqueada temporalmente por intentos fallidos. Espera unos minutos y vuelve a intentarlo.",
          reason: "locked",
          status: "error",
        }
      : {
          message: "La contraseña actual no es correcta. No se eliminó la cuenta.",
          reason: "invalid_password",
          status: "error",
        };
  }

  const activeOrders = await countActiveOrdersForCustomer(payload, customer.id);

  if (activeOrders > 0) {
    return {
      message:
        activeOrders === 1
          ? "Tienes un pedido en curso. Cancélalo desde Mis pedidos o escríbenos explicando la situación."
          : `Tienes ${activeOrders} pedidos en curso. Cancélalos desde Mis pedidos o escríbenos explicando la situación.`,
      reason: "active_orders",
      status: "error",
    };
  }

  try {
    await payload.delete({
      collection: "customers",
      id: customer.id,
      overrideAccess: true,
      user: customer,
    });
    return { status: "success" };
  } catch (error) {
    if (error instanceof APIError && error.status === 409) {
      return { message: error.message, reason: "active_orders", status: "error" };
    }

    return { message: "No se pudo eliminar la cuenta. Inténtalo de nuevo.", status: "error" };
  }
};

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
    lastName: readText(formData, "lastName"),
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
    lastName: values.lastName,
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
