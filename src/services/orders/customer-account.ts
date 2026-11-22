import type { Payload, PayloadRequest } from "payload";
import { ORDER_ACTIVE_STATUSES } from "@/lib/orders/status";

/** Pedidos que impiden eliminar la cuenta del cliente. */
export const countActiveOrdersForCustomer = async (
  payload: Payload,
  customerId: number,
  req?: PayloadRequest,
): Promise<number> => {
  const { totalDocs } = await payload.count({
    collection: "orders",
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: {
      customer: { equals: customerId },
      status: { in: [...ORDER_ACTIVE_STATUSES] },
    },
  });

  return totalDocs;
};
