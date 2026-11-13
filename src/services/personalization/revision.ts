import sharp from "sharp";
import { type MockupSelection, resolveMockupSelection } from "../../lib/mockup-selection";

export type InpaintingMask = {
  buffer: Buffer;
  width: number;
  height: number;
};

/**
 * Construye la máscara que recibe el modelo de inpainting: blanco en la zona
 * que el cliente autorizó a cambiar y negro en todo el resto del mockup.
 */
export const buildInpaintingMask = async (
  image: Buffer,
  selection: MockupSelection,
): Promise<InpaintingMask> => {
  const metadata = await sharp(image).metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;
  const { selectionRect } = resolveMockupSelection(selection, width, height);
  const radius = Math.max(4, Math.round(Math.min(selectionRect.width, selectionRect.height) * 0.08));
  const feather = Math.max(4, Math.round(Math.min(selectionRect.width, selectionRect.height) * 0.04));
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="black"/><rect x="${selectionRect.left}" y="${selectionRect.top}" width="${selectionRect.width}" height="${selectionRect.height}" rx="${radius}" fill="white"/></svg>`;

  return {
    buffer: await sharp(Buffer.from(svg)).blur(feather).png().toBuffer(),
    width,
    height,
  };
};
