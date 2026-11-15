import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  getScaledDimensions,
  MAX_REFERENCE_FILE_BYTES,
  MAX_REFERENCE_UPLOAD_SIDE,
  validateReferenceBytes,
} from "./reference-upload";

const pngBytes = (size = 64): Uint8Array => {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes;
};

const jpegBytes = (size = 64): Uint8Array => {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
};

const webpBytes = (size = 64): Uint8Array => {
  const bytes = new Uint8Array(size);
  const ascii = (value: string) => value.split("").map((character) => character.charCodeAt(0));
  bytes.set([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")]);
  return bytes;
};

describe("validateReferenceBytes", () => {
  it("rechaza una imagen vacía", () => {
    expect(validateReferenceBytes(new Uint8Array(0))).toEqual({
      message: "La imagen de referencia está vacía.",
      ok: false,
    });
  });

  it("rechaza archivos de más de 10 MB", () => {
    const result = validateReferenceBytes(pngBytes(MAX_REFERENCE_FILE_BYTES + 1));

    expect(result).toEqual({
      message: "La imagen de referencia supera el máximo de 10 MB.",
      ok: false,
    });
  });

  it("acepta exactamente 10 MB", () => {
    const result = validateReferenceBytes(pngBytes(MAX_REFERENCE_FILE_BYTES));

    expect(result).toEqual({ mimeType: "image/png", ok: true });
  });

  it("rechaza un archivo que no es JPEG, PNG ni WebP", () => {
    const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    expect(validateReferenceBytes(bytes)).toEqual({
      message: "La imagen de referencia debe ser JPEG, PNG o WebP.",
      ok: false,
    });
  });

  it("detecta el tipo por los bytes aunque la extensión mienta", () => {
    expect(validateReferenceBytes(jpegBytes())).toEqual({ mimeType: "image/jpeg", ok: true });
    expect(validateReferenceBytes(pngBytes())).toEqual({ mimeType: "image/png", ok: true });
    expect(validateReferenceBytes(webpBytes())).toEqual({ mimeType: "image/webp", ok: true });
  });
});

describe("getScaledDimensions", () => {
  it("conserva las medidas si la imagen ya cabe", () => {
    expect(getScaledDimensions(800, 600)).toEqual({ height: 600, width: 800 });
  });

  it("reduce el lado mayor conservando la proporción", () => {
    expect(getScaledDimensions(3000, 1500)).toEqual({ height: 768, width: 1536 });
  });

  it("reduce también las imágenes verticales", () => {
    expect(getScaledDimensions(1200, 4800)).toEqual({ height: 1536, width: 384 });
  });

  it("devuelve cero cuando las medidas no son válidas", () => {
    expect(getScaledDimensions(0, 100)).toEqual({ height: 0, width: 0 });
  });

  it("respeta un lado máximo distinto", () => {
    expect(getScaledDimensions(2000, 1000, 1000)).toEqual({ height: 500, width: 1000 });
    expect(MAX_REFERENCE_UPLOAD_SIDE).toBe(1536);
  });
});

describe("formatFileSize", () => {
  it("formatea bytes, kilobytes y megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2,0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2,0 MB");
  });
});
