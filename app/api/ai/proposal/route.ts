import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth";
import { generateDesignProposal, type ProposalFailureReason } from "@/services/ai/proposal";
import { MAX_REFERENCE_IMAGE_BYTES } from "@/services/ai/reference-image";

export const runtime = "nodejs";

/** Cloudflare puede tardar; el tope de Vercel Hobby es 300 s con Fluid Compute. */
export const maxDuration = 240;

const STATUS_BY_REASON: Record<ProposalFailureReason, number> = {
  content_rejected: 400,
  invalid_base: 400,
  invalid_idea: 400,
  invalid_reference: 400,
  invalid_response: 502,
  invalid_size: 400,
  not_configured: 503,
  quota_exceeded: 429,
  timeout: 504,
  unavailable: 502,
};

const readText = (form: FormData, field: string): string => {
  const value = form.get(field);
  return typeof value === "string" ? value : "";
};

const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Generación de la propuesta de HU-14. Exige sesión de cliente, valida la idea
 * y la referencia, y delega en `generateDesignProposal`. Nunca devuelve la
 * respuesta cruda del proveedor ni datos de configuración.
 */
export async function POST(request: Request) {
  const customer = await getSessionCustomer();

  if (!customer) {
    return jsonError("Inicia sesión para generar una propuesta.", 401);
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return jsonError("No pudimos leer la solicitud.", 400);
  }

  let referenceImageBytes: Uint8Array | null = null;
  const reference = form.get("referenceImage");

  if (reference instanceof File && reference.size > 0) {
    if (reference.size > MAX_REFERENCE_IMAGE_BYTES) {
      return jsonError("La imagen de referencia supera el máximo de 10 MB.", 400);
    }

    referenceImageBytes = new Uint8Array(await reference.arrayBuffer());
  }

  const result = await generateDesignProposal({
    baseId: readText(form, "baseId"),
    idea: readText(form, "idea"),
    referenceImageBytes,
    size: readText(form, "size"),
  });

  if (!result.ok) {
    return jsonError(result.message, STATUS_BY_REASON[result.reason] ?? 502);
  }

  return NextResponse.json({
    image: result.proposal.dataUrl,
    model: result.proposal.image.model,
    provider: result.proposal.image.provider,
  });
}
