import sharp from "sharp";
import {
  type MockupSelection,
  parseMockupSelection,
  resolveMockupSelection,
} from "../../lib/mockup-selection";

const MAX_PIXELS = 16_000_000;
const WHITE_MIN = 240;

/** HU-16: generar solo el elemento nuevo; la fotografía nunca pasa por este prompt. */
export const buildAdditionPrompt = (description: string): string =>
  [
    "Create only the NEW standalone graphic described below, for a flat vector screen print.",
    `Illustrate this object: ${description}.`,
    "Keep the entire graphic visible, centered, with generous empty margins on all four sides.",
    "Pure solid white background. Clean outlines, simple colors. No shadows, gradients, texture or mockup.",
    "Only draw the object. NO TEXT, NO LETTERS, NO WORDS, NO CAPTIONS, NO LABELS anywhere in the image.",
    "Do not draw clothing, shirts, fabric, people, frames or watermarks.",
  ].join(" ");

/**
 * Recorte acotado: alfa real o fondo blanco conectado al borde. Un gráfico
 * rectangular opaco conserva su interior blanco (líneas de una cancha, etc.).
 * Rechaza fondos complejos; nunca regenera la prenda como fallback.
 */
const cutoutAddition = async (image: Buffer): Promise<Buffer | null> => {
  const { data, info } = await sharp(image, { limitInputPixels: MAX_PIXELS })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const count = width * height;
  const isWhite = (pixel: number) => {
    const offset = pixel * 4;
    return (
      data[offset] >= WHITE_MIN && data[offset + 1] >= WHITE_MIN && data[offset + 2] >= WHITE_MIN
    );
  };
  const border: number[] = [];
  for (let x = 0; x < width; x += 1) border.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y += 1) border.push(y * width, y * width + width - 1);
  const transparentBorder = border.filter((pixel) => data[pixel * 4 + 3] === 0).length;
  if (transparentBorder / border.length < 0.8) {
    if (border.filter(isWhite).length / border.length < 0.95) return null;
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;
    let inkPixels = 0;
    for (let pixel = 0; pixel < count; pixel += 1) {
      if (isWhite(pixel) || data[pixel * 4 + 3] === 0) continue;
      inkPixels += 1;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    if (right <= left || bottom <= top) return null;

    // Solo tratar como rectángulo si sus cuatro esquinas contienen tinta.
    // Un círculo o varios árboles separados siguen el recorte por contorno.
    const cornerSize = Math.max(1, Math.floor(Math.min(right - left, bottom - top) * 0.03));
    const corners = [
      [left, top],
      [right - cornerSize + 1, top],
      [left, bottom - cornerSize + 1],
      [right - cornerSize + 1, bottom - cornerSize + 1],
    ];
    const rectangle =
      inkPixels / ((right - left + 1) * (bottom - top + 1)) > 0.8 &&
      corners.every(([cornerX, cornerY]) => {
        let ink = 0;
        for (let y = cornerY; y < cornerY + cornerSize; y += 1) {
          for (let x = cornerX; x < cornerX + cornerSize; x += 1) {
            if (!isWhite(y * width + x)) ink += 1;
          }
        }
        return ink / (cornerSize * cornerSize) > 0.8;
      });
    if (rectangle) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          data[(y * width + x) * 4 + 3] =
            x >= left && x <= right && y >= top && y <= bottom ? 255 : 0;
        }
      }
    } else {
      const visited = new Uint8Array(count);
      const stack: number[] = [];
      const push = (pixel: number) => {
        if (pixel < 0 || pixel >= count || visited[pixel] || !isWhite(pixel)) return;
        visited[pixel] = 1;
        stack.push(pixel);
      };
      for (const pixel of border) push(pixel);
      while (stack.length) {
        const pixel = stack.pop() as number;
        data[pixel * 4 + 3] = 0;
        const x = pixel % width;
        if (x > 0) push(pixel - 1);
        if (x < width - 1) push(pixel + 1);
        push(pixel - width);
        push(pixel + width);
      }
      // Reducir el halo claro sin comerse dibujos pequeños.
      const alpha = Uint8Array.from({ length: count }, (_, pixel) => data[pixel * 4 + 3]);
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const pixel = y * width + x;
          if (
            alpha[pixel - 1] === 0 ||
            alpha[pixel + 1] === 0 ||
            alpha[pixel - width] === 0 ||
            alpha[pixel + width] === 0
          ) {
            data[pixel * 4 + 3] = 0;
          }
        }
      }
    }
  }
  if (!data.some((value, index) => index % 4 === 3 && value > 0)) return null;
  return sharp(data, { raw: { width, height, channels: 4 } })
    .trim()
    .png()
    .toBuffer();
};

/**
 * Añade una capa en la selección explícita. No redimensiona ni reconstruye el
 * original; el PNG conserva sus píxeles fuera del rectángulo autorizado.
 * El elemento puede tapar contenido dentro del rectángulo: el cliente debe marcar
 * espacio libre. No detecta objetos ni adapta el dibujo a los pliegues.
 */
export const composeDesignAddition = async (
  original: Buffer,
  generatedElement: Buffer,
  selection: MockupSelection,
): Promise<Buffer | null> => {
  const parsed = parseMockupSelection(selection);
  if (!parsed) return null;
  const metadata = await sharp(original, { limitInputPixels: MAX_PIXELS }).metadata();
  if (!metadata.width || !metadata.height) return null;
  const element = await cutoutAddition(generatedElement);
  if (!element) return null;
  const { selectionRect } = resolveMockupSelection(parsed, metadata.width, metadata.height);
  const layer = await sharp(element)
    .resize({
      width: selectionRect.width,
      height: selectionRect.height,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return sharp(original, { limitInputPixels: MAX_PIXELS })
    .composite([{ input: layer, left: selectionRect.left, top: selectionRect.top }])
    .png()
    .toBuffer();
};
