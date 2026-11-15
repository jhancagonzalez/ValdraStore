/**
 * HU-16: spike de adiciones, solo imágenes sintéticas.
 * No cambia el personalizador. FLUX Klein 4B, sin reintentos ni fallback.
 * Ejecutar etapas por separado para inspeccionar cada imagen antes de continuar:
 * node scripts/test-local-edit.mjs original|edit|addition|compare [panda|soccer]
 * Las generaciones se reutilizan si ya existen. Máximo: tres llamadas por ejemplo.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const fixture = process.argv[3] ?? "panda";
assert(["panda", "soccer"].includes(fixture), "Elige panda o soccer.");
const soccer = fixture === "soccer";
const output = path.join(root, "test-results", `HU-16-${fixture}-edit`);
const stage = process.argv[2];
const additionFile = soccer ? "04-field.png" : "04-trees.png";
const model = "@cf/black-forest-labs/flux-2-klein-4b";
const file = (name) => path.join(output, name);
await mkdir(output, { recursive: true });

async function generate(name, prompt, reference) {
  if (existsSync(file(name))) {
    console.log(`Se reutiliza ${name}; no se consume cuota.`);
    return;
  }
  if (existsSync(path.join(root, ".env.local"))) {
    process.loadEnvFile(path.join(root, ".env.local"));
  }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  assert(account && token, "Falta la configuración de Cloudflare en el servidor.");
  const form = new FormData();
  form.append("prompt", prompt);
  if (reference) {
    form.append("input_image", new Blob([reference], { type: "image/png" }), "reference.png");
  }
  const started = Date.now();
  console.log(`Generando ${name} con datos sintéticos; un intento.`);
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    },
  );
  assert(response.ok, `Cloudflare respondió HTTP ${response.status}; no se reintenta.`);
  const body = await response.json();
  assert(body.success === true, "Cloudflare no confirmó la generación.");
  const value = body.result?.image;
  assert(typeof value === "string" && value.length > 0, "No llegó una imagen.");
  let bytes;
  if (value.startsWith("https://")) {
    const download = await fetch(value, {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    assert(download.ok, "Falló la descarga del resultado.");
    bytes = Buffer.from(await download.arrayBuffer());
  } else {
    assert(!value.startsWith("http://"), "Se rechazó una descarga sin TLS.");
    bytes = Buffer.from(value.startsWith("data:") ? value.split(",")[1] : value, "base64");
  }
  const image = await sharp(bytes, { limitInputPixels: 16_000_000 }).png().toBuffer();
  await writeFile(file(name), image);
  await writeFile(
    file(`${name}.json`),
    JSON.stringify({ model, prompt, durationSeconds: (Date.now() - started) / 1000 }, null, 2),
  );
  console.log(`Guardada ${name}.`);
}

async function rgb(buffer) {
  return sharp(buffer).toColourspace("srgb").removeAlpha().raw().toBuffer();
}

async function compare() {
  const original = await readFile(file("01-original.png"));
  const edited = await readFile(file("02-model-edit.png"));
  const metadata = await sharp(original).metadata();
  const width = metadata.width;
  const height = metadata.height;
  assert(width && height, "La imagen original no tiene dimensiones.");
  const candidateMetadata = await sharp(edited).metadata();
  assert(
    candidateMetadata.width === width && candidateMetadata.height === height,
    "La edición cambió las dimensiones; requiere revisar alineación antes de componer.",
  );

  // Área inferior al panda; se fija después de inspeccionar la imagen original.
  const selection = {
    left: Math.round(width * 0.31),
    top: Math.round(height * (soccer ? 0.49 : 0.58)),
    width: Math.round(width * 0.38),
    height: Math.round(height * 0.22),
  };
  const before = await rgb(original);
  const candidate = await rgb(edited);
  const protectedOutput = Buffer.from(before);
  let outsideChanged = 0;
  let outsidePixels = 0;
  let insideChanged = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inside =
        x >= selection.left &&
        x < selection.left + selection.width &&
        y >= selection.top &&
        y < selection.top + selection.height;
      const offset = (y * width + x) * 3;
      const changed =
        before[offset] !== candidate[offset] ||
        before[offset + 1] !== candidate[offset + 1] ||
        before[offset + 2] !== candidate[offset + 2];
      if (!inside) {
        outsidePixels += 1;
        if (changed) outsideChanged += 1;
        continue;
      }
      if (changed) insideChanged += 1;
      // La transición queda estrictamente dentro del área autorizada.
      const distance = Math.min(
        x - selection.left,
        selection.left + selection.width - 1 - x,
        y - selection.top,
        selection.top + selection.height - 1 - y,
      );
      const alpha = Math.min(1, distance / 14);
      for (let channel = 0; channel < 3; channel += 1) {
        protectedOutput[offset + channel] = Math.round(
          before[offset + channel] * (1 - alpha) + candidate[offset + channel] * alpha,
        );
      }
    }
  }
  const rawOptions = { raw: { width, height, channels: 3 } };
  const protectedImage = await sharp(protectedOutput, rawOptions).png().toBuffer();
  await writeFile(file("03-protected-edit.png"), protectedImage);

  // Nueva capa independiente; retirar únicamente el blanco conectado al borde.
  const trees = await sharp(await readFile(file(additionFile)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const count = trees.info.width * trees.info.height;
  const visited = new Uint8Array(count);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= trees.info.width || y >= trees.info.height) return;
    const pixel = y * trees.info.width + x;
    const offset = pixel * 4;
    if (
      !visited[pixel] &&
      trees.data[offset] >= 240 &&
      trees.data[offset + 1] >= 240 &&
      trees.data[offset + 2] >= 240
    ) {
      visited[pixel] = 1;
      stack.push(pixel);
    }
  };
  for (let x = 0; x < trees.info.width; x += 1) {
    push(x, 0);
    push(x, trees.info.height - 1);
  }
  for (let y = 0; y < trees.info.height; y += 1) {
    push(0, y);
    push(trees.info.width - 1, y);
  }
  while (stack.length) {
    const pixel = stack.pop();
    trees.data[pixel * 4 + 3] = 0;
    const x = pixel % trees.info.width;
    const y = Math.floor(pixel / trees.info.width);
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  if (soccer) {
    // Caso específico del spike: una cancha rectangular verde. Las líneas
    // blancas llegan al borde; el flood fill las confundiría con el fondo.
    // Conservar el rectángulo delimitado por verde mantiene sus marcas internas.
    let left = trees.info.width;
    let right = -1;
    let top = trees.info.height;
    let bottom = -1;
    for (let y = 0; y < trees.info.height; y += 1) {
      for (let x = 0; x < trees.info.width; x += 1) {
        const offset = (y * trees.info.width + x) * 4;
        const [red, green, blue] = trees.data.subarray(offset, offset + 3);
        if (green > 50 && green - red > 25 && green - blue > 25) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    assert(right > left && bottom > top, "No se identificó una cancha verde rectangular.");
    for (let y = 0; y < trees.info.height; y += 1) {
      for (let x = 0; x < trees.info.width; x += 1) {
        trees.data[(y * trees.info.width + x) * 4 + 3] =
          x >= left && x <= right && y >= top && y <= bottom ? 255 : 0;
      }
    }
  }
  // Retira dos píxeles del borde para reducir el halo del fondo blanco.
  // Es una limitación explícita del spike: no segmenta fondos complejos.
  for (let pass = 0; pass < (soccer ? 0 : 2); pass += 1) {
    const alpha = new Uint8Array(count);
    for (let pixel = 0; pixel < count; pixel += 1) alpha[pixel] = trees.data[pixel * 4 + 3];
    for (let y = 1; y < trees.info.height - 1; y += 1) {
      for (let x = 1; x < trees.info.width - 1; x += 1) {
        const pixel = y * trees.info.width + x;
        if (
          alpha[pixel - 1] === 0 ||
          alpha[pixel + 1] === 0 ||
          alpha[pixel - trees.info.width] === 0 ||
          alpha[pixel + trees.info.width] === 0
        ) {
          trees.data[pixel * 4 + 3] = 0;
        }
      }
    }
  }
  const cutout = await sharp(trees.data, {
    raw: { width: trees.info.width, height: trees.info.height, channels: 4 },
  })
    .trim()
    .resize({
      width: selection.width,
      height: selection.height,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await writeFile(file("05-addition-layer.png"), cutout);
  const layeredImage = await sharp(before, rawOptions)
    .composite([{ input: cutout, left: selection.left, top: selection.top }])
    .png()
    .toBuffer();
  await writeFile(file("06-layered-edit.png"), layeredImage);

  const metrics = { selection, rawEdit: { outsideChanged, outsidePixels, insideChanged } };
  for (const [name, result] of [
    ["protectedEdit", protectedImage],
    ["layeredEdit", layeredImage],
  ]) {
    const after = await rgb(result);
    let outsideDifferences = 0;
    let insideDifferences = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 3;
        const changed = [0, 1, 2].some(
          (channel) => before[offset + channel] !== after[offset + channel],
        );
        if (!changed) continue;
        if (
          x >= selection.left &&
          x < selection.left + selection.width &&
          y >= selection.top &&
          y < selection.top + selection.height
        ) {
          insideDifferences += 1;
        } else {
          outsideDifferences += 1;
        }
      }
    }
    assert(outsideDifferences === 0, `${name}: cambió el exterior protegido.`);
    assert(insideDifferences > 0, `${name}: no se incorporó ningún cambio.`);
    metrics[name] = { outsideDifferences, insideDifferences };
  }
  await writeFile(file("metrics.json"), JSON.stringify(metrics, null, 2));
  const panels = [
    ["01-original.png", soccer ? "1. Original: balon" : "1. Original: pandas"],
    ["02-model-edit.png", "2. Edicion directa de FLUX"],
    ["03-protected-edit.png", "3. Recorte limitado por mascara"],
    ["06-layered-edit.png", "4. Elemento nuevo por capa"],
  ];
  const tiles = [];
  for (const [index, [name, title]] of panels.entries()) {
    const picture = await sharp(await readFile(file(name)))
      .resize(512, 512)
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg width="512" height="48"><rect width="512" height="48" fill="#151515"/><text x="16" y="30" font-family="sans-serif" font-size="18" fill="white">${title}</text></svg>`,
    );
    const left = (index % 2) * 512;
    const top = Math.floor(index / 2) * 560;
    tiles.push({ input: label, left, top }, { input: picture, left, top: top + 48 });
  }
  await sharp({ create: { width: 1024, height: 1120, channels: 3, background: "white" } })
    .composite(tiles)
    .png()
    .toFile(file("comparison.png"));
  console.log(JSON.stringify(metrics, null, 2));
}

switch (stage) {
  case "original":
    await generate(
      "01-original.png",
      soccer
        ? "Edit this product photo by printing exactly one classic black and white soccer ball on the upper chest of this black t-shirt. Compact flat vector screen-print illustration with a clear circular silhouette and pentagon panels, centered above the middle of the shirt, between 25% and 44% of the photo height. Leave all the fabric BELOW the ball blank for a future addition. No soccer field yet, no grass, no players, no text, no frames. Preserve the exact shirt, folds, collar, sleeves, lighting, white background and camera framing. Only print one soccer ball; no extra garments."
        : "Edit this product photo by printing exactly two cute black and white pandas sitting together on the upper chest of this black t-shirt. Small compact flat vector screen-print illustration, white bodies enclosed in black outlines, centered at the upper chest, between 24% and 43% of the photo height. Leave the fabric below the pandas completely blank for a future addition. No trees, no bamboo, no text, no frames. Preserve the exact shirt, folds, collar, sleeves, lighting, white background and camera framing. Only print the pandas; no extra garments.",
      await sharp(await readFile(path.join(root, "public/mockups/tshirt-black.jpg")))
        .png()
        .toBuffer(),
    );
    break;
  case "edit":
    await generate(
      "02-model-edit.png",
      soccer
        ? "Add a small green soccer field directly BELOW the existing soccer ball, between 51% and 69% of the photo height, fully separated from the ball. The soccer field is a flat vector printed graphic, green rectangular pitch with crisp white sidelines, halfway line, center circle and penalty areas. Keep the original soccer ball ABSOLUTELY IDENTICAL in every panel, detail, position, size and color. Keep the entire original black shirt, collar, folds, lighting, background and camera framing identical. No extra balls, no players, no text, no extra garments. Apply only the new soccer field below the original ball."
        : "Add exactly three small green leafy trees directly BELOW the two existing pandas, within the lower chest area between 60% and 78% of the photo height. The trees are part of the same flat vector screen-print illustration, with clean outlines. Keep both original pandas absolutely identical in appearance, pose, size, detail and position. Preserve all original shirt fabric, folds, shape, collar, sleeves, lighting, background and framing. No extra pandas, no extra shirts, no text, no frames. Apply only the requested trees.",
      await readFile(file("01-original.png")),
    );
    break;
  case "trees":
  case "addition":
    await generate(
      additionFile,
      soccer
        ? "One isolated green soccer field seen from directly overhead. Flat vector screen-print graphic: a horizontal green rectangular pitch with crisp white boundary lines, one halfway line, one center circle, and matching penalty areas and goal boxes at both ends. Entire rectangle fully visible, balanced symmetrical field markings. Wide horizontal composition. Pure solid white background with generous white empty margin on all four sides. No ball, no players, no stadium, no shadow, no shirt, no clothing, no text, no frame."
        : "Exactly three small green leafy trees arranged side by side. Isolated flat vector illustration for a t-shirt screen print, dark green clean outlines and light green leaves, simple brown trunks. Compact horizontal composition, fully visible, large pure white empty margin on all four sides. Pure solid white background, no shadows, no texture, no gradient, no landscape, no ground, no pandas, no animals, no shirt, no clothing, no text, no frame.",
    );
    break;
  case "compare":
    await compare();
    break;
  default:
    throw new Error("Selecciona original, edit, addition o compare.");
}
