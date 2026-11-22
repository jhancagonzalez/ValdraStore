import { NextResponse } from "next/server";
import { APIError } from "payload";
import { getSessionCustomer } from "@/lib/auth";
import { MAX_ORDER_QUANTITY, MIN_ORDER_QUANTITY } from "@/lib/orders/pricing";
import { getPayloadClient } from "@/lib/payload";
import { hasValidOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/**
 * Crea un pedido para el cliente autenticado (HU-18).
 *
 * Vive en `/api/orders/create` para no tapar el REST de Payload en
 * `/api/orders`, que usa el panel de administración.
 */
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) {
    return errorResponse("Origen no permitido.", 403);
  }

  const customer = await getSessionCustomer();

  if (!customer) {
    return errorResponse("Inicia sesión para crear un pedido.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("No pudimos leer la solicitud.", 400);
  }

  const input = body as { designId?: unknown; quantity?: unknown };
  const designId = Number(input.designId);
  const quantity = Number(input.quantity ?? 1);

  if (!Number.isInteger(designId) || designId <= 0) {
    return errorResponse("Selecciona un diseño aprobado.", 400);
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_ORDER_QUANTITY ||
    quantity > MAX_ORDER_QUANTITY
  ) {
    return errorResponse("La cantidad debe ser un entero entre 1 y 10.", 400);
  }

  const payload = await getPayloadClient();

  try {
    const order = await payload.create({
      collection: "orders",
      // El hook completa cliente, instantáneas, precio y estado inicial.
      data: { design: designId, quantity } as never,
      overrideAccess: false,
      user: customer,
    });

    return NextResponse.json(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        quantity: order.quantity,
        status: order.status,
        total: order.total,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof APIError) {
      return errorResponse(error.message, error.status ?? 400);
    }

    return errorResponse("No pudimos crear el pedido. Inténtalo de nuevo.", 500);
  }
}
