import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth";
import { getMockupBase, getMockupBaseName } from "@/lib/mockup-bases";
import { getPayloadClient } from "@/lib/payload";
import { hasValidOrigin } from "@/lib/request-origin";
import { parseApprovalPayload } from "@/services/approved-designs/approval";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/**
 * Aprueba el diseño final de HU-17. Exige sesión de cliente, valida la
 * selección y la imagen, y registra el diseño en `approved-designs` aplicando
 * el control de acceso de Payload: la propiedad se fija en el servidor.
 */
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) {
    return errorResponse("Origen no permitido.", 403);
  }

  const customer = await getSessionCustomer();

  if (!customer) {
    return errorResponse("Inicia sesión para aprobar el diseño.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("No pudimos leer la solicitud.", 400);
  }

  const parsed = parseApprovalPayload(body);

  if (!parsed.ok) {
    return errorResponse(parsed.message, 400);
  }

  const base = getMockupBase(parsed.value.baseId);

  if (!base) {
    return errorResponse("La prenda seleccionada no existe.", 400);
  }

  const payload = await getPayloadClient();
  const approvedAt = new Date().toISOString();

  try {
    const created = await payload.create({
      collection: "approved-designs",
      data: {
        approvedAt,
        colorLabel: base.colorLabel,
        customer: customer.id,
        garment: base.id,
        garmentLabel: getMockupBaseName(base),
        idea: parsed.value.idea,
        image: parsed.value.image,
        size: parsed.value.size,
      },
      // La operación actúa en nombre del cliente: se respeta el acceso de la
      // colección y el hook fija `customer` con el usuario de la sesión.
      overrideAccess: false,
      user: customer,
    });

    return NextResponse.json({ approvedAt: created.approvedAt, id: created.id });
  } catch {
    return errorResponse("No pudimos registrar la aprobación. Inténtalo de nuevo.", 500);
  }
}
