"use server";

import { revalidatePath } from "next/cache";
import { APIError } from "payload";
import { getSessionCustomer } from "@/lib/auth";
import { isOrderNumber } from "@/lib/orders/order-number";
import { canTransitionOrderStatus, isOrderStatus } from "@/lib/orders/status";
import { getPayloadClient } from "@/lib/payload";

export type CancelOrderState = {
  message?: string;
  reason?: "not_cancellable";
  status: "error" | "success";
};

/** Cancela un pedido propio si la máquina de estados lo permite. */
export const cancelOrder = async (orderNumber: string): Promise<CancelOrderState> => {
  const customer = await getSessionCustomer();

  if (!customer) {
    return { message: "Tu sesión expiró. Inicia sesión de nuevo.", status: "error" };
  }

  if (!isOrderNumber(orderNumber)) {
    return { message: "El número de pedido no es válido.", status: "error" };
  }

  const payload = await getPayloadClient();

  try {
    const found = await payload.find({
      collection: "orders",
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user: customer,
      where: {
        customer: { equals: customer.id },
        orderNumber: { equals: orderNumber },
      },
    });

    const order = found.docs[0];

    if (!order) {
      return { message: "No encontramos ese pedido en tu cuenta.", status: "error" };
    }

    if (order.status === "cancelada") {
      return { message: "El pedido ya estaba cancelado.", status: "success" };
    }

    if (!isOrderStatus(order.status) || !canTransitionOrderStatus(order.status, "cancelada")) {
      return {
        message: "Este pedido ya no se puede cancelar desde la cuenta.",
        reason: "not_cancellable",
        status: "error",
      };
    }

    await payload.update({
      collection: "orders",
      context: { customerCancellation: true },
      data: { status: "cancelada" },
      id: order.id,
      overrideAccess: true,
      user: customer,
    });

    revalidatePath("/pedidos");
    revalidatePath("/cuenta");

    return { message: "Pedido cancelado. El stock se devolvió.", status: "success" };
  } catch (error) {
    if (error instanceof APIError) {
      return { message: error.message, status: "error" };
    }

    return { message: "No pudimos cancelar el pedido. Inténtalo de nuevo.", status: "error" };
  }
};
