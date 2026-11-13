import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { buildInpaintingMask } from "./revision";

const solid = (width: number, height: number, color: { r: number; g: number; b: number }) =>
  sharp({ create: { width, height, channels: 3, background: color } })
    .png()
    .toBuffer();

const readPixel = async (image: Buffer, x: number, y: number) => {
  const { data, info } = await sharp(image).raw().toBuffer({ resolveWithObject: true });
  const offset = (y * info.width + x) * info.channels;
  return [data[offset], data[offset + 1], data[offset + 2]];
};

describe("buildInpaintingMask", () => {
  it("pinta de blanco solo la zona marcada y deja el resto en negro", async () => {
    const image = await solid(512, 512, { r: 200, g: 0, b: 0 });
    const mask = await buildInpaintingMask(image, {
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
    });

    expect(mask.width).toBe(512);
    expect(mask.height).toBe(512);
    expect(await readPixel(mask.buffer, 256, 256)).toEqual([255, 255, 255]);
    expect(await readPixel(mask.buffer, 10, 10)).toEqual([0, 0, 0]);
    expect(await readPixel(mask.buffer, 500, 500)).toEqual([0, 0, 0]);
  });
});
