import sharp from "sharp";
import { type MockupSelection, resolveMockupSelection } from "../../lib/mockup-selection";
import { stripControlCharacters } from "../../lib/sanitize";

const escapeXml = (value: string) =>
  stripControlCharacters(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const textColor = (idea: string, baseColorKey: string) => {
  if (/\b(blanco|white)\b/i.test(idea)) {
    return "#ffffff";
  }
  if (/\b(negro|black)\b/i.test(idea)) {
    return "#111111";
  }
  return baseColorKey === "white" || baseColorKey === "beige" ? "#111111" : "#ffffff";
};

const selectionMask = async (width: number, height: number) => {
  const radius = Math.max(4, Math.round(Math.min(width, height) * 0.06));
  const feather = Math.max(3, Math.round(Math.min(width, height) * 0.03));
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`;
  return sharp(Buffer.from(svg)).blur(feather).png().toBuffer();
};

/**
 * Restaura la tela base dentro de la zona marcada (si el cliente pidió quitar
 * el diseño anterior) y escribe el texto con una fuente, sin pedírselo a la IA.
 */
export const renderTextOverlay = async (
  previousImage: Buffer,
  baseImage: Buffer,
  selection: MockupSelection,
  text: string,
  options: { idea: string; baseColorKey: string; clearSelection: boolean },
): Promise<Buffer> => {
  const metadata = await sharp(previousImage).metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;
  const { selectionRect } = resolveMockupSelection(selection, width, height);
  const fill = textColor(options.idea, options.baseColorKey);
  const stroke = fill === "#111111" ? "#ffffff" : "#111111";
  const widthLimitedSize = (selectionRect.width * 0.88) / Math.max(1, text.length * 0.62);
  const fontSize = Math.max(
    12,
    Math.round(Math.min(selectionRect.height * 0.56, widthLimitedSize)),
  );
  const strokeWidth = Math.max(2, Math.round(fontSize * 0.045));
  const mask = await selectionMask(selectionRect.width, selectionRect.height);

  let working = previousImage;

  if (options.clearSelection) {
    const base = await sharp(baseImage).resize(width, height, { fit: "fill" }).png().toBuffer();
    const basePatch = await sharp(base).extract(selectionRect).png().toBuffer();
    const maskedBase = await sharp(basePatch)
      .ensureAlpha()
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();

    working = await sharp(working)
      .composite([{ input: maskedBase, left: selectionRect.left, top: selectionRect.top }])
      .png()
      .toBuffer();
  }

  const svg = `<svg width="${selectionRect.width}" height="${selectionRect.height}" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black, Impact, 'DejaVu Sans', sans-serif" font-weight="900" font-size="${fontSize}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke">${escapeXml(text)}</text></svg>`;
  const textOverlay = await sharp(Buffer.from(svg)).png().toBuffer();

  return sharp(working)
    .composite([{ input: textOverlay, left: selectionRect.left, top: selectionRect.top }])
    .png()
    .toBuffer();
};
