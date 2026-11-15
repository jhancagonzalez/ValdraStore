import { describe, expect, it } from "vitest";
import { getMockupBase, type MockupBase } from "./mockup-bases";
import { getMockupAlt, getMockupDownloadName, getMockupSummary } from "./mockup-summary";

const requireBase = (id: string): MockupBase => {
  const base = getMockupBase(id);
  if (!base) {
    throw new Error(`No existe la prenda base ${id}`);
  }
  return base;
};

const camiseta = requireBase("camisetas-black");
const hoodie = requireBase("hoodies-blue");

describe("getMockupSummary", () => {
  it("resume prenda, color y talla de una camiseta negra en M", () => {
    expect(getMockupSummary(camiseta, "M")).toEqual([
      { label: "Prenda", value: "Camiseta" },
      { label: "Color", value: "Negro" },
      { label: "Talla", value: "M" },
    ]);
  });

  it("muestra «Sin elegir» cuando no hay talla", () => {
    expect(getMockupSummary(camiseta, null)).toContainEqual({
      label: "Talla",
      value: "Sin elegir",
    });
  });
});

describe("getMockupAlt", () => {
  it("describe la camiseta negra con su talla", () => {
    expect(getMockupAlt(camiseta, "M")).toBe(
      "Mockup de Camiseta negra, talla M, con la propuesta de diseño aplicada",
    );
  });

  it("describe el hoodie azul sin talla", () => {
    expect(getMockupAlt(hoodie, null)).toBe(
      "Mockup de Hoodie azul, con la propuesta de diseño aplicada",
    );
  });
});

describe("getMockupDownloadName", () => {
  it("usa la extensión png para imágenes png", () => {
    expect(getMockupDownloadName(camiseta, "M", "data:image/png;base64,AAA")).toBe(
      "valdra-camisetas-black-M.png",
    );
  });

  it("usa la extensión webp para imágenes webp", () => {
    expect(getMockupDownloadName(camiseta, "M", "data:image/webp;base64,AAA")).toBe(
      "valdra-camisetas-black-M.webp",
    );
  });

  it("usa la extensión jpg para cualquier otro tipo", () => {
    expect(getMockupDownloadName(camiseta, "M", "data:image/jpeg;base64,AAA")).toBe(
      "valdra-camisetas-black-M.jpg",
    );
  });

  it("usa «sin-talla» cuando no hay talla", () => {
    expect(getMockupDownloadName(hoodie, null, "data:image/jpeg;base64,AAA")).toBe(
      "valdra-hoodies-blue-sin-talla.jpg",
    );
  });
});
