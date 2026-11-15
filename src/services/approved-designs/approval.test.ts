import { describe, expect, it } from "vitest";
import { IDEA_MAX_LENGTH, MAX_IMAGE_CHARS, parseApprovalPayload } from "./approval";

const VALID_IMAGE = "data:image/png;base64,iVBORw0KGgo=";

const validPayload = {
  baseId: "camisetas-black",
  idea: "Un tigre geométrico en el pecho",
  image: VALID_IMAGE,
  size: "M",
};

describe("parseApprovalPayload (HU-17)", () => {
  it("acepta una solicitud completa y válida", () => {
    const result = parseApprovalPayload(validPayload);

    expect(result).toEqual({
      ok: true,
      value: {
        baseId: "camisetas-black",
        idea: validPayload.idea,
        image: VALID_IMAGE,
        size: "M",
      },
    });
  });

  it("rechaza un cuerpo que no es un objeto", () => {
    for (const input of [null, undefined, "texto", 42, []]) {
      expect(parseApprovalPayload(input)).toEqual({
        message: "No pudimos leer la solicitud.",
        ok: false,
      });
    }
  });

  it("rechaza una prenda que no existe", () => {
    expect(parseApprovalPayload({ ...validPayload, baseId: "pantalones-verdes" })).toEqual({
      message: "La prenda seleccionada no existe.",
      ok: false,
    });
  });

  it("rechaza una talla que no se ofrece", () => {
    expect(parseApprovalPayload({ ...validPayload, size: "XXL" })).toEqual({
      message: "Selecciona una talla válida.",
      ok: false,
    });

    expect(parseApprovalPayload({ ...validPayload, size: 3 })).toEqual({
      message: "Selecciona una talla válida.",
      ok: false,
    });
  });

  it("rechaza una idea vacía o sin texto útil", () => {
    for (const idea of ["", "   ", "\u0000\u0001", 7]) {
      expect(parseApprovalPayload({ ...validPayload, idea })).toEqual({
        message: "La idea del diseño no puede estar vacía.",
        ok: false,
      });
    }
  });

  it("recorta la idea al límite del personalizador", () => {
    const result = parseApprovalPayload({ ...validPayload, idea: "a".repeat(900) });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.idea).toHaveLength(IDEA_MAX_LENGTH);
    }
  });

  it("rechaza una imagen que no es un data URL permitido", () => {
    for (const image of [
      "",
      "https://example.com/diseno.png",
      "data:image/svg+xml;base64,PHN2Zz4=",
    ]) {
      expect(parseApprovalPayload({ ...validPayload, image })).toEqual({
        message: "El diseño no llegó en un formato válido.",
        ok: false,
      });
    }
  });

  it("rechaza una imagen cuyo contenido no coincide con el tipo declarado", () => {
    const jpegBytes = "/9j/4AAQSkZJRg==";

    expect(
      parseApprovalPayload({ ...validPayload, image: `data:image/png;base64,${jpegBytes}` }),
    ).toEqual({
      message: "El diseño no llegó en un formato válido.",
      ok: false,
    });
  });

  it("rechaza una imagen por encima del máximo de caracteres", () => {
    const image = `data:image/jpeg;base64,${"A".repeat(MAX_IMAGE_CHARS)}`;

    expect(parseApprovalPayload({ ...validPayload, image })).toEqual({
      message: "El diseño es demasiado grande para registrarlo.",
      ok: false,
    });
  });

  it("normaliza los espacios de la idea antes de guardarla", () => {
    const result = parseApprovalPayload({
      ...validPayload,
      idea: "  Tigre   geométrico\n en el pecho ",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.idea).toBe("Tigre geométrico en el pecho");
    }
  });
});
