import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizeReferenceImage } from "./mockup-image";

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .png()
    .toBuffer();

describe("normalizeReferenceImage", () => {
  it("mantiene una imagen dentro del límite de procesamiento", async () => {
    const image = await solid(512, 512);
    const normalized = await normalizeReferenceImage(image, "image/png");

    expect(normalized?.width).toBe(512);
    expect(normalized?.height).toBe(512);
    expect(normalized?.mimeType).toBe("image/png");
    expect(normalized?.buffer.equals(image)).toBe(true);
  });

  it("reduce una imagen grande a 1536 px de lado máximo", async () => {
    const image = await solid(2000, 1000);
    const normalized = await normalizeReferenceImage(image, "image/png");

    expect(normalized?.width).toBe(1536);
    expect(normalized?.height).toBe(768);
    expect(normalized?.mimeType).toBe("image/jpeg");
  });

  it("rechaza una imagen que supera el límite de píxeles", async () => {
    const image = await solid(4096, 4096);
    const normalized = await normalizeReferenceImage(image, "image/png");

    expect(normalized).toBeNull();
  });
});
