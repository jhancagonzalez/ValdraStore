import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { composeReferenceDesign } from "./reference-composite";

const solid = (width: number, height: number, color: { r: number; g: number; b: number }) =>
  sharp({
    create: { background: { ...color, alpha: 1 }, channels: 4, height, width },
  })
    .png()
    .toBuffer();

const referenceWithRedSquare = async () => {
  const white = await solid(100, 100, { b: 255, g: 255, r: 255 });
  const red = await solid(40, 40, { b: 0, g: 0, r: 255 });

  return sharp(white)
    .composite([{ input: red, left: 30, top: 30 }])
    .png()
    .toBuffer();
};

const pixelAt = (data: Buffer, channels: number, width: number, x: number, y: number) => {
  const index = (y * width + x) * channels;
  return { b: data[index + 2], g: data[index + 1], r: data[index] };
};

describe("composeReferenceDesign (HU-13)", () => {
  it("recorta el fondo claro y compone la referencia en el pecho", async () => {
    const base = await solid(200, 200, { b: 20, g: 20, r: 20 });
    const result = await composeReferenceDesign(base, await referenceWithRedSquare());

    expect(result).not.toBeNull();

    const { data, info } = await sharp(result as Buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Centro del cuadrado rojo: la referencia se imprime tal cual.
    const center = pixelAt(data, info.channels, info.width, 100, 88);
    expect(center.r).toBeGreaterThan(220);
    expect(center.g).toBeLessThan(40);
    expect(center.b).toBeLessThan(40);

    // El borde superior de la referencia era blanco: el recorte lo hace transparente.
    const topEdge = pixelAt(data, info.channels, info.width, 100, 42);
    expect(topEdge.r).toBeLessThan(60);
    expect(topEdge.g).toBeLessThan(60);
    expect(topEdge.b).toBeLessThan(60);
  });

  it("compone la referencia en la parte inferior cuando se solicita", async () => {
    const base = await solid(200, 200, { b: 20, g: 20, r: 20 });
    const result = await composeReferenceDesign(base, await referenceWithRedSquare(), "bottom");

    expect(result).not.toBeNull();

    const { data, info } = await sharp(result as Buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const center = pixelAt(data, info.channels, info.width, 100, 146);

    expect(center.r).toBeGreaterThan(220);
    expect(center.g).toBeLessThan(40);
    expect(center.b).toBeLessThan(40);
  });

  it("acepta una referencia con fondo transparente", async () => {
    const base = await solid(200, 200, { b: 20, g: 20, r: 20 });
    const transparent = await sharp({
      create: {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
        channels: 4,
        height: 100,
        width: 100,
      },
    })
      .png()
      .toBuffer();
    const reference = await sharp(transparent)
      .composite([{ input: await solid(40, 40, { b: 0, g: 0, r: 255 }), left: 30, top: 30 }])
      .png()
      .toBuffer();

    const result = await composeReferenceDesign(base, reference);

    expect(result).not.toBeNull();
  });

  it("devuelve null si el fondo de la referencia no es claro", async () => {
    const base = await solid(200, 200, { b: 20, g: 20, r: 20 });
    const reference = await solid(100, 100, { b: 10, g: 10, r: 10 });

    await expect(composeReferenceDesign(base, reference)).resolves.toBeNull();
  });
});
