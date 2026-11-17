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

/** Agrega texto con una fuente sobre la propuesta sin restaurar ni borrar la tela. */
export const renderTextOverlay = async (
  previousImage: Buffer,
  selection: MockupSelection,
  text: string,
  options: { idea: string; baseColorKey: string },
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
  const svg = `<svg width="${selectionRect.width}" height="${selectionRect.height}" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black, Impact, 'DejaVu Sans', sans-serif" font-weight="900" font-size="${fontSize}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke">${escapeXml(text)}</text></svg>`;
  const textOverlay = await sharp(Buffer.from(svg)).png().toBuffer();

  return sharp(previousImage)
    .composite([{ input: textOverlay, left: selectionRect.left, top: selectionRect.top }])
    .png()
    .toBuffer();
};
