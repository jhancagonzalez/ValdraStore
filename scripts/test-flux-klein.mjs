import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Prueba mínima de Cloudflare Workers AI con FLUX.2 [klein] 4B.
 *
 * Uso:
 *   node scripts/test-flux-klein.mjs
 *   REFERENCE_IMAGE=ruta/a/referencia.jpg node scripts/test-flux-klein.mjs
 *
 * Variables necesarias en .env.local:
 *   CLOUDFLARE_ACCOUNT_ID=...
 *   CLOUDFLARE_API_TOKEN=...
 *
 * Variables opcionales:
 *   FLUX_PROMPT="otro prompt"
 *   REFERENCE_IMAGE="ruta/a/referencia.jpg"
 *   FLUX_OUTPUT="ruta/de/salida.jpg"
 */

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const envPath = path.join(projectRoot, ".env.local");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const model = "@cf/black-forest-labs/flux-2-klein-4b";

if (!accountId || !apiToken) {
  console.error("Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN.");
  console.error("");
  console.error("Agrega estas líneas a .env.local:");
  console.error("CLOUDFLARE_ACCOUNT_ID=tu_account_id");
  console.error("CLOUDFLARE_API_TOKEN=tu_api_token_de_workers_ai");
  process.exit(1);
}

const prompt =
  process.env.FLUX_PROMPT ??
  "camiseta negra con diseño floral minimalista, fondo blanco, mockup de estudio";

const outputPath = path.resolve(projectRoot, process.env.FLUX_OUTPUT ?? "test-flux-klein.jpg");

const referencePath = process.env.REFERENCE_IMAGE
  ? path.resolve(projectRoot, process.env.REFERENCE_IMAGE)
  : null;

const mimeFor = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
};

const form = new FormData();
form.append("prompt", prompt);

if (referencePath) {
  if (!fs.existsSync(referencePath)) {
    console.error(`No existe la imagen de referencia: ${referencePath}`);
    process.exit(1);
  }

  form.append(
    "input_image",
    new Blob([fs.readFileSync(referencePath)], { type: mimeFor(referencePath) }),
    path.basename(referencePath),
  );
}

console.log(`Modelo: ${model}`);
console.log(`Prompt: ${prompt}`);
if (referencePath) {
  console.log(`Referencia: ${referencePath}`);
}
console.log("Generando...");

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

let response;
try {
  response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
} catch (error) {
  console.error("No se pudo conectar con Cloudflare.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const rawBody = await response.text();
let body = null;

try {
  body = JSON.parse(rawBody);
} catch {
  // Cloudflare puede devolver texto plano en un error de proxy.
}

console.log(`HTTP ${response.status} · success=${body?.success ?? "desconocido"}`);

if (!response.ok || body?.success !== true) {
  console.error("La petición falló. Respuesta de Cloudflare:");
  console.error(rawBody.slice(0, 2000));
  process.exit(1);
}

const imageValue = body?.result?.image;

if (typeof imageValue !== "string" || imageValue.length === 0) {
  console.error("La respuesta no contiene result.image.");
  console.error(rawBody.slice(0, 1000));
  process.exit(1);
}

let imageBytes;

if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
  const imageResponse = await fetch(imageValue, {
    signal: AbortSignal.timeout(120_000),
  });

  if (!imageResponse.ok) {
    console.error(`No se pudo descargar la imagen: HTTP ${imageResponse.status}`);
    process.exit(1);
  }

  imageBytes = Buffer.from(await imageResponse.arrayBuffer());
} else {
  const base64 = imageValue.startsWith("data:")
    ? imageValue.slice(imageValue.indexOf(",") + 1)
    : imageValue;
  imageBytes = Buffer.from(base64, "base64");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, imageBytes);

console.log(`OK · imagen guardada en ${outputPath}`);
console.log(`Tamaño: ${imageBytes.length} bytes`);
