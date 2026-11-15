import sharp from "sharp";

/** Ubicación del estampado dentro del mockup. */
export type ReferencePlacement = "bottom" | "chest";

/**
 * Un píxel se considera fondo solo si es casi blanco. El umbral alto evita
 * comerse el blanco interior de una ilustración (por ejemplo, el cuerpo de un
 * panda) cuando el contorno lo separa del borde.
 */
const BACKGROUND_CHANNEL_MIN = 250;

/** Proporción mínima de borde claro para intentar el recorte automático. */
const LIGHT_BORDER_RATIO = 0.5;

/** Pasadas de erosión para quitar el halo blanco del antialiasing. */
const ALPHA_ERODE_PASSES = 2;

const CHEST_WIDTH_RATIO = 0.46;
const CHEST_TOP_RATIO = 0.21;
const CHEST_MAX_HEIGHT_RATIO = 0.62;
const BOTTOM_WIDTH_RATIO = 0.34;
const BOTTOM_TOP_RATIO = 0.58;
const BOTTOM_MAX_HEIGHT_RATIO = 0.3;

const isLightPixel = (data: Buffer, index: number): boolean =>
  data[index] >= BACKGROUND_CHANNEL_MIN &&
  data[index + 1] >= BACKGROUND_CHANNEL_MIN &&
  data[index + 2] >= BACKGROUND_CHANNEL_MIN;

/** Un píxel transparente ya es fondo; uno claro también se recorta. */
const isBackgroundPixel = (data: Buffer, index: number): boolean =>
  data[index + 3] === 0 || isLightPixel(data, index);

/** Comprueba si el borde de la imagen es mayoritariamente claro. */
const hasLightBorder = (data: Buffer, width: number, height: number, channels: number): boolean => {
  let light = 0;
  let total = 0;

  const sample = (x: number, y: number) => {
    total += 1;

    if (isBackgroundPixel(data, (y * width + x) * channels)) {
      light += 1;
    }
  };

  for (let x = 0; x < width; x += 2) {
    sample(x, 0);
    sample(x, height - 1);
  }

  for (let y = 0; y < height; y += 2) {
    sample(0, y);
    sample(width - 1, y);
  }

  return total > 0 && light / total >= LIGHT_BORDER_RATIO;
};

/**
 * Vuelve transparente el fondo claro conectado al borde. No usa un simple
 * filtro por color para no borrar zonas blancas encerradas por el contorno.
 * Después erosiona el alfa para eliminar el halo blanco del antialiasing.
 */
const removeLightBackground = (
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): void => {
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixel = y * width + x;
    const offset = pixel * channels;

    if (visited[pixel] === 0 && isBackgroundPixel(data, offset)) {
      stack.push(pixel);
    }
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length > 0) {
    const pixel = stack.pop() as number;

    if (visited[pixel] === 1) {
      continue;
    }

    visited[pixel] = 1;
    data[pixel * channels + 3] = 0;

    const x = pixel % width;
    const y = Math.floor(pixel / width);

    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  for (let pass = 0; pass < ALPHA_ERODE_PASSES; pass += 1) {
    const alpha = new Uint8Array(width * height);

    for (let index = 0; index < alpha.length; index += 1) {
      alpha[index] = data[index * channels + 3];
    }

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixel = y * width + x;

        if (
          alpha[pixel] !== 0 &&
          (alpha[pixel - 1] === 0 ||
            alpha[pixel + 1] === 0 ||
            alpha[pixel - width] === 0 ||
            alpha[pixel + width] === 0)
        ) {
          data[pixel * channels + 3] = 0;
        }
      }
    }
  }
};

/**
 * Compone la imagen de referencia tal cual sobre la prenda seleccionada
 * (HU-13). No la redibuja con IA: recorta el fondo claro y la imprime en el
 * pecho o en la parte inferior. Devuelve `null` cuando el fondo no es claro;
 * en ese caso el llamador puede usar el modelo generativo como respaldo.
 */
export const composeReferenceDesign = async (
  baseImage: Buffer,
  referenceImage: Buffer,
  placement: ReferencePlacement = "chest",
): Promise<Buffer | null> => {
  const base = await sharp(baseImage).metadata();

  if (!base.width || !base.height) {
    return null;
  }

  // Se limita el trabajo del recorte; el navegador ya reduce la referencia.
  const { data, info } = await sharp(referenceImage)
    .resize({ fit: "inside", height: 1536, width: 1536, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (!hasLightBorder(data, info.width, info.height, info.channels)) {
    return null;
  }

  removeLightBackground(data, info.width, info.height, info.channels);

  const cutout = await sharp(data, {
    raw: { channels: info.channels, height: info.height, width: info.width },
  })
    .png()
    .toBuffer();

  const width = Math.round(
    base.width * (placement === "chest" ? CHEST_WIDTH_RATIO : BOTTOM_WIDTH_RATIO),
  );
  const maxHeight = Math.round(
    base.height * (placement === "chest" ? CHEST_MAX_HEIGHT_RATIO : BOTTOM_MAX_HEIGHT_RATIO),
  );
  const resized = await sharp(cutout)
    .resize({ fit: "inside", height: maxHeight, width, withoutEnlargement: false })
    .png()
    .toBuffer();
  const stamp = await sharp(resized).metadata();

  if (!stamp.width || !stamp.height) {
    return null;
  }

  const left = Math.max(0, Math.round((base.width - stamp.width) / 2));
  const top = Math.round(
    base.height * (placement === "chest" ? CHEST_TOP_RATIO : BOTTOM_TOP_RATIO),
  );

  return sharp(baseImage)
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 92 })
    .toBuffer();
};
