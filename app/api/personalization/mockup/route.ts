import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth";
import { MAX_DESIGN_BRIEF_LENGTH } from "@/lib/design-brief";
import { extractDesignText } from "@/lib/design-text";
import { getMockupBase, getMockupBaseName, isMockupSize } from "@/lib/mockup-bases";
import { normalizeReferenceImage } from "@/lib/mockup-image";
import { DEFAULT_REVISION_SELECTION, parseMockupSelection } from "@/lib/mockup-selection";
import { stripControlCharacters } from "@/lib/sanitize";
import {
  buildInpaintingMask,
  hasVisibleSelectionChange,
  type InpaintingMask,
} from "@/services/personalization/revision";
import { renderTextOverlay } from "@/services/personalization/text-overlay";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const INPAINTING_MODEL = "@cf/runwayml/stable-diffusion-v1-5-inpainting";
const REWRITE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const REWRITE_SYSTEM_PROMPT = `You convert Spanish t-shirt design edit requests into short English descriptions of the requested visual change inside a marked zone.
Rules:
- Preserve the existing subject. Do not add objects, holidays, colors, or themes the user did not mention.
- Describe only the requested change, not the old content.
- Resolve vague references like "eso" by describing the replacement content.
- Never use "that", "it", "existing", "remove", or "add".
- Keep text exactly as written.
- Output one comma-separated phrase, no quotes, no explanations.

Examples:
User: Quita eso y agrega la palabra I LOVE YOU
Assistant: bold black lettering reading I LOVE YOU, centered, clean vector text
User: agrega tres árboles al fondo
Assistant: three trees in the background, clean vector shapes
User: haz los árboles realistas
Assistant: realistic trees with natural foliage and detailed trunks, same composition
User: agrega árboles de Navidad blancos en la parte de abajo
Assistant: white Christmas trees, clean vector shapes, centered
User: hazlo más minimalista
Assistant: minimalist artwork, simple shapes, reduced detail, clean vector style
User: cambia el color del diseño a azul
Assistant: blue artwork, clean vector shapes, same composition`;
const INPAINTING_NEGATIVE_PROMPT =
  "person, mannequin, body, hands, text, logo, photo, 3d, shadow, background change";
const MAX_IDEA_LENGTH = 600;
const MAX_REFERENCE_BYTES = 3_000_000;
const MAX_PROVIDER_IMAGE_BYTES = 3_000_000;
const ALLOWED_REFERENCE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type MockupRequest = {
  baseId?: unknown;
  designBrief?: unknown;
  idea?: unknown;
  mode?: unknown;
  referenceImage?: unknown;
  selection?: unknown;
  size?: unknown;
  strategy?: unknown;
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

const cleanInput = (value: string) => stripControlCharacters(value).trim();

const hasValidOrigin = (request: Request) => {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>();

  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    return false;
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  if (serverUrl) {
    try {
      allowedOrigins.add(new URL(serverUrl).origin);
    } catch {
      return false;
    }
  }

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
};

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
    "No other artwork inside the marked area.",
  ].join(" ");
};

const buildRedesignPrompt = (garmentName: string, designBrief: string, idea: string) =>
  buildCreatePrompt(
    garmentName,
    `${designBrief || "el diseño anterior"}. Ajuste solicitado: ${idea}. El estampado va impreso en el pecho de la camiseta, no en el fondo de la foto.`,
  );

/**
 * Reescribe la petición del cliente como una descripción concreta en inglés.
 * Evita referencias ambiguas como "eso" y mejora la adherencia del inpainting.
 */
const rewriteIdea = async (idea: string): Promise<string> => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return idea;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${REWRITE_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: REWRITE_SYSTEM_PROMPT },
            { role: "user", content: idea },
          ],
          max_tokens: 120,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );

    if (!response.ok) {
      return idea;
    }

    const body = (await response.json()) as {
      result?: {
        response?: unknown;
        choices?: Array<{ message?: { content?: unknown } }>;
      };
    };
    const content = body.result?.choices?.[0]?.message?.content ?? body.result?.response;

    return typeof content === "string" && content.trim().length > 0
      ? content.trim().replace(/^["']|["']$/g, "")
      : idea;
  } catch {
    return idea;
  }
};

const normalizeMimeType = (value: string) => {
  const mimeType = value.toLowerCase();
  return mimeType === "image/jpg" ? "image/jpeg" : mimeType;
};

const detectImageMime = (buffer: Buffer): string | null => {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
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
  const mimeType = normalizeMimeType(header.split(";")[0]);
  const buffer = Buffer.from(value.slice(comma + 1), "base64");
  const detected = detectImageMime(buffer);

  if (
    !ALLOWED_REFERENCE_MIME_TYPES.has(mimeType) ||
    detected !== mimeType ||
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

    const mimeType = normalizeMimeType(value.slice(5, comma).split(";")[0]);
    const buffer = Buffer.from(value.slice(comma + 1), "base64");
    const detected = detectImageMime(buffer);

    if (
      !ALLOWED_REFERENCE_MIME_TYPES.has(mimeType) ||
      detected !== mimeType ||
      buffer.length === 0 ||
      buffer.length > MAX_PROVIDER_IMAGE_BYTES
    ) {
      return null;
    }

    return { buffer, mimeType };
  }

  if (value.startsWith("https://")) {
    try {
      const response = await fetch(value, {
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const contentLength = Number(response.headers.get("content-length") ?? 0);

      if (!contentType.startsWith("image/") || contentLength > MAX_PROVIDER_IMAGE_BYTES) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const detected = detectImageMime(buffer);

      if (!detected || buffer.length === 0 || buffer.length > MAX_PROVIDER_IMAGE_BYTES) {
        return null;
      }

      return { buffer, mimeType: detected };
    } catch {
      return null;
    }
  }

  const buffer = Buffer.from(value, "base64");
  const detected = detectImageMime(buffer);

  if (!detected || buffer.length === 0 || buffer.length > MAX_PROVIDER_IMAGE_BYTES) {
    return null;
  }

  return { buffer, mimeType: detected };
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

const generateFromBase = async (baseImage: Buffer, prompt: string): Promise<ProviderResult> => {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append(
    "input_image",
    new Blob([new Uint8Array(baseImage)], { type: "image/jpeg" }),
    "prenda.jpg",
  );
  return runModel(form);
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
    let body: CloudflareImageResponse;

    try {
      body = (await providerResponse.json()) as CloudflareImageResponse;
    } catch {
      return {
        ok: false,
        status: 502,
        message: "La propuesta no llegó con una imagen válida.",
      };
    }

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

  const contentLength = Number(providerResponse.headers.get("content-length") ?? 0);

  if (contentLength > MAX_PROVIDER_IMAGE_BYTES) {
    return {
      ok: false,
      status: 502,
      message: "La propuesta no llegó con una imagen válida.",
    };
  }

  const buffer = Buffer.from(await providerResponse.arrayBuffer());

  if (buffer.length === 0) {
    return {
      ok: false,
      status: 502,
      message: "La propuesta no llegó con una imagen válida.",
    };
  }

  const detected = detectImageMime(buffer);

  if (!detected) {
    return {
      ok: false,
      status: 502,
      message: "La propuesta no llegó con una imagen válida.",
    };
  }

  return { ok: true, image: { buffer, mimeType: detected } };
};

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) {
    return errorResponse("Origen no permitido.", 403);
  }

  const customer = await getSessionCustomer();

  if (!customer) {
    return errorResponse("Inicia sesión para generar una propuesta.", 401);
  }

  let body: MockupRequest;

  try {
    const parsed = (await request.json()) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return errorResponse("No pudimos leer la solicitud.", 400);
    }

    body = parsed as MockupRequest;
  } catch {
    return errorResponse("No pudimos leer la solicitud.", 400);
  }

  const baseId = typeof body.baseId === "string" ? body.baseId : "";
  const designBrief =
    typeof body.designBrief === "string"
      ? stripControlCharacters(body.designBrief).slice(0, MAX_DESIGN_BRIEF_LENGTH).trim()
      : "";
  const idea = typeof body.idea === "string" ? cleanInput(body.idea) : "";
  const size = typeof body.size === "string" ? body.size : "";
  const mode = body.mode === "revise" ? "revise" : "create";
  const strategy =
    body.strategy === "redesign" || body.strategy === "text" ? body.strategy : "inpaint";
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
  const basePath = path.join(process.cwd(), "public", base.file.replace(/^\//, ""));
  const loadBaseImage = async () => {
    try {
      return await readFile(basePath);
    } catch {
      return null;
    }
  };

  if (mode === "revise") {
    const rawReference = body.referenceImage ? parseReferenceImage(body.referenceImage) : null;

    if (!rawReference) {
      return errorResponse("Falta la propuesta anterior para aplicar cambios.", 400);
    }

    const referenceImage = await normalizeReferenceImage(
      rawReference.buffer,
      rawReference.mimeType,
    );

    if (!referenceImage) {
      return errorResponse("La propuesta anterior tiene dimensiones no válidas.", 400);
    }

    const parsedSelection = parseMockupSelection(body.selection);

    if (body.selection !== undefined && !parsedSelection) {
      return errorResponse("La zona marcada no es válida.", 400);
    }

    const selection = parsedSelection ?? DEFAULT_REVISION_SELECTION;

    if (strategy === "text") {
      const text = extractDesignText(idea);

      if (text) {
        const baseImage = await loadBaseImage();

        if (!baseImage) {
          return errorResponse("No pudimos cargar la prenda seleccionada.", 500);
        }

        let composite: Buffer;

        try {
          composite = await renderTextOverlay(referenceImage.buffer, baseImage, selection, text, {
            idea,
            baseColorKey: base.colorKey,
            clearSelection: /\b(quita|elimina|borra|remueve|remove|erase)\b/i.test(idea),
          });
        } catch {
          return errorResponse("No pudimos agregar el texto sobre el diseño.", 500);
        }

        return NextResponse.json({
          image: `data:image/png;base64,${composite.toString("base64")}`,
          prompt: `Texto: "${text}"`,
        });
      }
    }

    if (strategy === "redesign") {
      const baseImage = await loadBaseImage();

      if (!baseImage) {
        return errorResponse("No pudimos cargar la prenda seleccionada.", 500);
      }

      const prompt = buildRedesignPrompt(garmentName, designBrief, idea);
      const result = await generateFromBase(baseImage, prompt);

      if (!result.ok) {
        return errorResponse(result.message, result.status);
      }

      return NextResponse.json({
        image: `data:${result.image.mimeType};base64,${result.image.buffer.toString("base64")}`,
        prompt,
      });
    }

    const rewrittenIdea = await rewriteIdea(idea);
    const prompt = buildInpaintingPrompt(garmentName, rewrittenIdea);

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

    let changed = true;

    try {
      changed = await hasVisibleSelectionChange(
        referenceImage.buffer,
        result.image.buffer,
        selection,
      );
    } catch {
      // Si la comparación falla, no bloqueamos una respuesta válida del modelo.
    }

    if (!changed) {
      return errorResponse(
        "La IA no aplicó un cambio visible en esa zona. Prueba con una descripción más concreta o usa “Rediseñar estampado”.",
        422,
      );
    }

    return NextResponse.json({
      image: `data:${result.image.mimeType};base64,${result.image.buffer.toString("base64")}`,
      prompt,
    });
  }

  const baseImage = await loadBaseImage();

  if (!baseImage) {
    return errorResponse("No pudimos cargar la prenda seleccionada.", 500);
  }

  const prompt = buildCreatePrompt(garmentName, idea);
  const result = await generateFromBase(baseImage, prompt);

  if (!result.ok) {
    return errorResponse(result.message, result.status);
  }

  return NextResponse.json({
    image: `data:${result.image.mimeType};base64,${result.image.buffer.toString("base64")}`,
    prompt,
  });
}
