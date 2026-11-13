import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth";
import { getMockupBase, getMockupBaseName, isMockupSize } from "@/lib/mockup-bases";
import {
  DEFAULT_REVISION_SELECTION,
  parseMockupSelection,
} from "@/lib/mockup-selection";
import { buildInpaintingMask, type InpaintingMask } from "@/services/personalization/revision";

export const runtime = "nodejs";

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const INPAINTING_MODEL = "@cf/runwayml/stable-diffusion-v1-5-inpainting";
const TRANSLATION_MODEL = "@cf/meta/m2m100-1.2b";
const INPAINTING_NEGATIVE_PROMPT =
  "person, mannequin, body, hands, text, logo, photo, 3d, shadow, background change";
const MAX_IDEA_LENGTH = 600;
const MAX_REFERENCE_BYTES = 3_000_000;
const ALLOWED_REFERENCE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type MockupRequest = {
  baseId?: unknown;
  idea?: unknown;
  mode?: unknown;
  referenceImage?: unknown;
  selection?: unknown;
  size?: unknown;
};

type CloudflareImageResponse = {
  success?: boolean;
  result?: { image?: unknown };
};

type ImagePayload = {
  buffer: Buffer;
  mimeType: string;
};

type ProviderResult =
  | { ok: true; image: ImagePayload }
  | { ok: false; status: number; message: string };

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const buildCreatePrompt = (garmentName: string, idea: string) =>
  [
    `Crea una propuesta de estampado para una ${garmentName.toLowerCase()}.`,
    `Idea principal: ${idea}.`,
    "Construye el estampado completo a partir de la descripción.",
    "Estilo visual: ilustración vectorial limpia, composición centrada, alto contraste, detalles nítidos y acabado profesional de estampado.",
    "Composición: motivo principal centrado en el pecho, escala equilibrada, legible a distancia, sin repeticiones ni bordes.",
    "Paleta: 2 a 4 colores coherentes que contrasten con el color de la prenda.",
    "Fondo de estudio liso, sin sombras, sin textura de tela, sin cuadrícula de transparencia y sin marco rectangular.",
    "Conserva exactamente la silueta, el cuello, las mangas, el color, el fondo, la iluminación y el encuadre de la prenda de referencia.",
    "Muestra solo la prenda sobre el fondo liso: no incluyas personas, maniquíes, cuellos humanos, brazos, manos ni partes del cuerpo.",
    "No añadas logos ni texto que no se haya pedido.",
  ].join(" ");

const buildInpaintingPrompt = (garmentName: string, idea: string) => {
  const element = idea.replace(/^add\s+/i, "").trim();

  return [
    `Design printed on a ${garmentName.toLowerCase()}: ${element}.`,
    "Flat vector illustration, clean edges, high contrast, professional print, matching the existing design style.",
    "Printed on fabric with the same lighting, perspective and garment color.",
  ].join(" ");
};

/**
 * El modelo de inpainting entiende mejor el inglés. Si la traducción falla,
 * se conserva la idea original para no bloquear la revisión.
 */
const translateIdea = async (idea: string): Promise<string> => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return idea;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${TRANSLATION_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: idea,
          source_lang: "es",
          target_lang: "en",
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      return idea;
    }

    const body = (await response.json()) as {
      result?: { translated_text?: unknown };
    };
    const translated = body.result?.translated_text;

    return typeof translated === "string" && translated.trim().length > 0
      ? translated.trim()
      : idea;
  } catch {
    return idea;
  }
};

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

const parseReferenceImage = (value: unknown): ImagePayload | null => {
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

const decodeProviderImage = async (value: unknown): Promise<ImagePayload | null> => {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  if (value.startsWith("data:")) {
    const comma = value.indexOf(",");

    if (comma === -1) {
      return null;
    }

    const mimeType = value.slice(5, comma).split(";")[0];

    if (!ALLOWED_REFERENCE_MIME_TYPES.has(mimeType)) {
      return null;
    }

    const buffer = Buffer.from(value.slice(comma + 1), "base64");
    return buffer.length > 0 ? { buffer, mimeType } : null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const response = await fetch(value, { signal: AbortSignal.timeout(30_000) });

      if (!response.ok) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.length > 0 ? { buffer, mimeType: detectImageMime(buffer) } : null;
    } catch {
      return null;
    }
  }

  const buffer = Buffer.from(value, "base64");
  return buffer.length > 0 ? { buffer, mimeType: detectImageMime(buffer) } : null;
};

const runModel = async (form: FormData): Promise<ProviderResult> => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return { ok: false, status: 503, message: "El servicio de diseño no está configurado." };
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
    return {
      ok: false,
      status: 502,
      message: "El servicio de diseño no respondió. Inténtalo de nuevo.",
    };
  }

  const rawBody = await providerResponse.text();
  let providerBody: CloudflareImageResponse | null = null;

  try {
    providerBody = JSON.parse(rawBody) as CloudflareImageResponse;
  } catch {
    // Cloudflare puede devolver texto plano en un error de proxy.
  }

  if (providerResponse.status === 429) {
    return {
      ok: false,
      status: 429,
      message: "La cuota gratuita de diseño se agotó por hoy. Inténtalo de nuevo más tarde.",
    };
  }

  if (rawBody.includes("flagged") || rawBody.includes("moderation")) {
    return {
      ok: false,
      status: 400,
      message: "No pudimos aplicar ese cambio. Prueba con otra descripción.",
    };
  }

  if (!providerResponse.ok || providerBody?.success !== true) {
    return {
      ok: false,
      status: 502,
      message: "No pudimos generar la propuesta. Inténtalo de nuevo.",
    };
  }

  const image = await decodeProviderImage(providerBody.result?.image);

  if (!image) {
    return {
      ok: false,
      status: 502,
      message: "La propuesta no llegó con una imagen válida.",
    };
  }

  return { ok: true, image };
};

const runInpainting = async (
  image: ImagePayload,
  prompt: string,
  mask: InpaintingMask,
): Promise<ProviderResult> => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return { ok: false, status: 503, message: "El servicio de diseño no está configurado." };
  }

  let providerResponse: Response;

  try {
    providerResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${INPAINTING_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: INPAINTING_NEGATIVE_PROMPT,
          image: Array.from(image.buffer),
          mask: Array.from(mask.buffer),
          num_steps: 20,
          strength: 1,
          guidance: 7.5,
          width: mask.width,
          height: mask.height,
        }),
        signal: AbortSignal.timeout(180_000),
      },
    );
  } catch {
    return {
      ok: false,
      status: 502,
      message: "El servicio de diseño no respondió. Inténtalo de nuevo.",
    };
  }

  if (!providerResponse.ok) {
    const rawBody = await providerResponse.text();

    if (providerResponse.status === 429) {
      return {
        ok: false,
        status: 429,
        message: "La cuota gratuita de diseño se agotó por hoy. Inténtalo de nuevo más tarde.",
      };
    }

    if (rawBody.includes("flagged") || rawBody.includes("moderation")) {
      return {
        ok: false,
        status: 400,
        message: "No pudimos aplicar ese cambio. Prueba con otra descripción.",
      };
    }

    return {
      ok: false,
      status: 502,
      message: "No pudimos generar la propuesta. Inténtalo de nuevo.",
    };
  }

  const contentType = providerResponse.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await providerResponse.json()) as CloudflareImageResponse;
    const decoded = await decodeProviderImage(body.result?.image);

    if (!decoded) {
      return {
        ok: false,
        status: 502,
        message: "La propuesta no llegó con una imagen válida.",
      };
    }

    return { ok: true, image: decoded };
  }

  const buffer = Buffer.from(await providerResponse.arrayBuffer());

  if (buffer.length === 0) {
    return {
      ok: false,
      status: 502,
      message: "La propuesta no llegó con una imagen válida.",
    };
  }

  return { ok: true, image: { buffer, mimeType: detectImageMime(buffer) } };
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

  const garmentName = getMockupBaseName(base);

  if (mode === "revise") {
    const referenceImage = body.referenceImage
      ? parseReferenceImage(body.referenceImage)
      : null;

    if (!referenceImage) {
      return errorResponse("Falta la propuesta anterior para aplicar cambios.", 400);
    }

    const selection = parseMockupSelection(body.selection) ?? DEFAULT_REVISION_SELECTION;
    const translatedIdea = await translateIdea(idea);
    const prompt = buildInpaintingPrompt(garmentName, translatedIdea);

    let mask: InpaintingMask;

    try {
      mask = await buildInpaintingMask(referenceImage.buffer, selection);
    } catch {
      return errorResponse("No pudimos preparar la máscara de edición.", 500);
    }

    const result = await runInpainting(referenceImage, prompt, mask);

    if (!result.ok) {
      return errorResponse(result.message, result.status);
    }

    return NextResponse.json({
      image: `data:${result.image.mimeType};base64,${result.image.buffer.toString("base64")}`,
      prompt,
    });
  }

  const basePath = path.join(process.cwd(), "public", base.file.replace(/^\//, ""));
  let baseImage: Buffer;

  try {
    baseImage = await readFile(basePath);
  } catch {
    return errorResponse("No pudimos cargar la prenda seleccionada.", 500);
  }

  const prompt = buildCreatePrompt(garmentName, idea);
  const form = new FormData();
  form.append("prompt", prompt);
  form.append(
    "input_image",
    new Blob([new Uint8Array(baseImage)], { type: "image/jpeg" }),
    `${base.id}.jpg`,
  );

  const result = await runModel(form);

  if (!result.ok) {
    return errorResponse(result.message, result.status);
  }

  return NextResponse.json({
    image: `data:${result.image.mimeType};base64,${result.image.buffer.toString("base64")}`,
    prompt,
  });
}
