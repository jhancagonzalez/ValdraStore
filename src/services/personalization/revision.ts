import sharp from "sharp";
import { type MockupSelection, resolveMockupSelection } from "../../lib/mockup-selection";

export type InpaintingMask = {
  buffer: Buffer;
  width: number;
  height: number;
};

/**
 * Detecta si el inpainting cambió de verdad la zona marcada. Evita reportar
 * como éxito una salida que es prácticamente igual a la imagen anterior.
 */
export const hasVisibleSelectionChange = async (
  previousImage: Buffer,
  outputImage: Buffer,
  selection: MockupSelection,
): Promise<boolean> => {
  const metadata = await sharp(previousImage).metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;
  const { selectionRect } = resolveMockupSelection(selection, width, height);

  const previous = await sharp(previousImage)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .extract(selectionRect)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = await sharp(outputImage)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .extract(selectionRect)
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (previous.info.channels !== output.info.channels) {
    return true;
  }

  const pixelCount = selectionRect.width * selectionRect.height;
  let changedPixels = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * previous.info.channels;
    const difference = Math.max(
      Math.abs(previous.data[offset] - output.data[offset]),
      Math.abs(previous.data[offset + 1] - output.data[offset + 1]),
      Math.abs(previous.data[offset + 2] - output.data[offset + 2]),
    );

    if (difference > 16) {
      changedPixels += 1;
    }
  }

  return changedPixels / pixelCount > 0.01;
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
