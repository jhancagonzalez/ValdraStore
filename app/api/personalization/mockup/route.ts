import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth";
import { getMockupBase, getMockupBaseName, isMockupSize } from "@/lib/mockup-bases";

export const runtime = "nodejs";

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const MAX_IDEA_LENGTH = 600;
const MAX_REFERENCE_BYTES = 3_000_000;
const ALLOWED_REFERENCE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type MockupRequest = {
  baseId?: unknown;
  idea?: unknown;
  mode?: unknown;
  referenceImage?: unknown;
  size?: unknown;
};

type CloudflareImageResponse = {
  success?: boolean;
  result?: { image?: unknown };
};

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/**
 * Turns the short customer idea into a complete art direction. The model needs
 * composition, palette and negative constraints to produce a clean print.
 */
const buildPrompt = (garmentName: string, idea: string, revise: boolean) =>
  [
    revise
      ? "La primera imagen es la prenda base y define la ropa: conserva exactamente su silueta, cuello, mangas, color, fondo, iluminación y encuadre. La segunda imagen es la propuesta anterior y define únicamente el estampado."
      : `Crea una propuesta de estampado para una ${garmentName.toLowerCase()}.`,
    revise ? `Cambio solicitado: ${idea}.` : `Idea principal: ${idea}.`,
    revise
      ? "Copia el estampado de la segunda imagen y intégralo sobre la prenda de la primera. Conserva todos sus elementos, colores, composición y estilo; si el cliente pide agregar algo, añádelo sin borrar lo anterior. No generes un estampado nuevo desde cero. No copies la ropa de la segunda imagen."
      : "Construye el estampado completo a partir de la descripción.",
    "Estilo visual: ilustración vectorial limpia, composición centrada, alto contraste, detalles nítidos y acabado profesional de estampado.",
    "Composición: motivo principal centrado en el pecho, escala equilibrada, legible a distancia, sin repeticiones ni bordes.",
    "Paleta: 2 a 4 colores coherentes que contrasten con el color de la prenda.",
    "Fondo de estudio liso, sin sombras, sin textura de tela, sin cuadrícula de transparencia y sin marco rectangular.",
    revise
      ? `El resultado debe mostrar la misma prenda de la primera imagen (${garmentName.toLowerCase()}), no una prenda nueva. La segunda imagen solo aporta el estampado.`
      : "Conserva exactamente la silueta, el cuello, las mangas, el color, el fondo, la iluminación y el encuadre de la prenda de referencia.",
    "Muestra solo la prenda sobre el fondo liso: no incluyas personas, maniquíes, cuellos humanos, brazos, manos ni partes del cuerpo.",
    "No añadas logos ni texto que no se haya pedido.",
  ].join(" ");

const detectImageMime = (buffer: Buffer) => {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF") {
    return "image/webp";
  }
  return "image/jpeg";
};

const parseReferenceImage = (
  value: unknown,
): { buffer: Buffer; mimeType: string } | null => {
  if (typeof value !== "string" || !value.startsWith("data:image/")) {
    return null;
  }

  const comma = value.indexOf(",");

  if (comma === -1) {
    return null;
  }

  const header = value.slice(5, comma);
  const mimeType = header.split(";")[0];
  const buffer = Buffer.from(value.slice(comma + 1), "base64");

  if (
    !ALLOWED_REFERENCE_MIME_TYPES.has(mimeType) ||
    buffer.length === 0 ||
    buffer.length > MAX_REFERENCE_BYTES
  ) {
    return null;
  }

  return { buffer, mimeType };
};

export async function POST(request: Request) {
  const customer = await getSessionCustomer();

  if (!customer) {
    return errorResponse("Inicia sesión para generar una propuesta.", 401);
  }

  let body: MockupRequest;

  try {
    body = (await request.json()) as MockupRequest;
  } catch {
    return errorResponse("No pudimos leer la solicitud.", 400);
  }

  const baseId = typeof body.baseId === "string" ? body.baseId : "";
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const size = typeof body.size === "string" ? body.size : "";
  const mode = body.mode === "revise" ? "revise" : "create";
  const base = getMockupBase(baseId);

  if (!base) {
    return errorResponse("La prenda seleccionada no existe.", 400);
  }

  if (!isMockupSize(size)) {
    return errorResponse("Selecciona una talla válida.", 400);
  }

  if (idea.length === 0) {
    return errorResponse("Describe tu idea antes de generar la propuesta.", 400);
  }

  if (idea.length > MAX_IDEA_LENGTH) {
    return errorResponse("La idea es demasiado larga.", 400);
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return errorResponse("El servicio de diseño no está configurado.", 503);
  }

  const referenceImage = body.referenceImage
    ? parseReferenceImage(body.referenceImage)
    : null;

  if (body.referenceImage && !referenceImage) {
    return errorResponse("La propuesta anterior no es una imagen válida.", 400);
  }

  if (mode === "revise" && !referenceImage) {
    return errorResponse("Falta la propuesta anterior para aplicar cambios.", 400);
  }

  const basePath = path.join(process.cwd(), "public", base.file.replace(/^\//, ""));
  let baseImage: Buffer;

  try {
    baseImage = await readFile(basePath);
  } catch {
    return errorResponse("No pudimos cargar la prenda seleccionada.", 500);
  }

  const prompt = buildPrompt(getMockupBaseName(base), idea, mode === "revise");
  const form = new FormData();
  form.append("prompt", prompt);

  if (mode === "revise" && referenceImage) {
    const referenceExtension =
      referenceImage.mimeType === "image/png"
        ? "png"
        : referenceImage.mimeType === "image/webp"
          ? "webp"
          : "jpg";

    // The base garment is primary so the model keeps the product silhouette;
    // the previous design is the secondary reference for the print only.
    form.append(
      "input_image",
      new Blob([new Uint8Array(baseImage)], { type: "image/jpeg" }),
      `${base.id}.jpg`,
    );
    form.append(
      "input_image_2",
      new Blob([new Uint8Array(referenceImage.buffer)], {
        type: referenceImage.mimeType,
      }),
      `${base.id}-anterior.${referenceExtension}`,
    );
  } else {
    form.append(
      "input_image",
      new Blob([new Uint8Array(baseImage)], { type: "image/jpeg" }),
      `${base.id}.jpg`,
    );
  }

  let providerResponse: Response;

  try {
    providerResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        body: form,
        signal: AbortSignal.timeout(120_000),
      },
    );
  } catch {
    return errorResponse("El servicio de diseño no respondió. Inténtalo de nuevo.", 502);
  }

  const rawBody = await providerResponse.text();
  let providerBody: CloudflareImageResponse | null = null;

  try {
    providerBody = JSON.parse(rawBody) as CloudflareImageResponse;
  } catch {
    // Cloudflare puede devolver texto plano en un error de proxy.
  }

  if (!providerResponse.ok || providerBody?.success !== true) {
    return errorResponse("No pudimos generar la propuesta. Inténtalo de nuevo.", 502);
  }

  const image = providerBody.result?.image;

  if (typeof image !== "string" || image.length === 0) {
    return errorResponse("La propuesta no llegó con una imagen válida.", 502);
  }

  const imageUrl = image.startsWith("http")
    ? image
    : image.startsWith("data:")
      ? image
      : `data:${detectImageMime(Buffer.from(image, "base64"))};base64,${image}`;

  return NextResponse.json({ image: imageUrl, prompt });
}
