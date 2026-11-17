import { describe, expect, it } from "vitest";
import { detectImageMimeType } from "./image-bytes";
import { MAX_REFERENCE_IMAGE_BYTES, parseReferenceImage } from "./reference-image";

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("detectImageMimeType (HU-14)", () => {
  it("reconoce JPEG, PNG y WebP por su firma", () => {
    expect(detectImageMimeType(JPEG_BYTES)).toBe("image/jpeg");
    expect(detectImageMimeType(PNG_BYTES)).toBe("image/png");
    expect(detectImageMimeType(WEBP_BYTES)).toBe("image/webp");
  });

  it("rechaza archivos que no son imagen", () => {
    expect(detectImageMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull();
    expect(detectImageMimeType(new Uint8Array())).toBeNull();
  });
});

describe("parseReferenceImage (HU-14/HU-13)", () => {
  it("acepta una imagen válida", () => {
    expect(parseReferenceImage(PNG_BYTES)).toEqual({
      image: { bytes: PNG_BYTES, mimeType: "image/png" },
      ok: true,
    });
  });

  it("rechaza una imagen vacía", () => {
    expect(parseReferenceImage(new Uint8Array())).toEqual({
      message: "La imagen de referencia está vacía.",
      ok: false,
    });
  });

  it("rechaza más de 10 MB", () => {
    const oversized = new Uint8Array(MAX_REFERENCE_IMAGE_BYTES + 1);

    expect(parseReferenceImage(oversized)).toEqual({
      message: "La imagen de referencia supera el máximo de 10 MB.",
      ok: false,
    });
  });

  it("rechaza un tipo no permitido aunque tenga extensión de imagen", () => {
    expect(parseReferenceImage(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toEqual({
      message: "La imagen de referencia debe ser JPEG, PNG o WebP.",
      ok: false,
    });
  });
});
