import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { renderTextOverlay } from "./text-overlay";

const solid = (width: number, height: number, color: { r: number; g: number; b: number }) =>
  sharp({ create: { width, height, channels: 3, background: color } })
    .png()
    .toBuffer();

describe("renderTextOverlay", () => {
  it("agrega texto sin borrar el contenido previo de la zona", async () => {
    const white = await solid(512, 512, { r: 255, g: 255, b: 255 });
    const black = await solid(256, 256, { r: 0, g: 0, b: 0 });
    const previous = await sharp(white)
      .composite([{ input: black, left: 128, top: 128 }])
      .png()
      .toBuffer();

    const result = await renderTextOverlay(
      previous,
      { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
      "HOLA",
      { idea: "agrega la palabra HOLA en blanco", baseColorKey: "black" },
    );
    const { data, info } = await sharp(result).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => {
      const offset = (y * info.width + x) * info.channels;
      return [data[offset], data[offset + 1], data[offset + 2]];
    };

    const [clearedR, clearedG, clearedB] = pixel(140, 140);
    expect(clearedR).toBe(0);
    expect(clearedG).toBe(0);
    expect(clearedB).toBe(0);

    let hasTextPixel = false;
    for (let y = 160; y < 350; y += 1) {
      for (let x = 160; x < 350; x += 1) {
        const [r, g, b] = pixel(x, y);
        if (r > 220 && g > 220 && b > 220) {
          hasTextPixel = true;
        }
      }
    }
    expect(hasTextPixel).toBe(true);
  }, 15_000);

  it("escapa caracteres especiales y de control sin romper el SVG", async () => {
    const white = await solid(512, 512, { r: 255, g: 255, b: 255 });
    const result = await renderTextOverlay(
      white,
      { x: 0.2, y: 0.2, width: 0.6, height: 0.3 },
      `<script>&"'\u0000HOLA`,
      { idea: "agrega el texto", baseColorKey: "white" },
    );
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
  }, 15_000);
});
