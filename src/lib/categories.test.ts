import { describe, expect, it } from "vitest";
import type { Category } from "../../payload-types";
import { slugifyCategory, visibleCategoryOf } from "./categories";

const category = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  active: true,
  createdAt: "2026-11-27T00:00:00.000Z",
  name: "Camisetas",
  slug: "camisetas",
  updatedAt: "2026-11-27T00:00:00.000Z",
  ...overrides,
});

describe("slugifyCategory", () => {
  it("quita tildes, mayúsculas y espacios", () => {
    expect(slugifyCategory("  Buzos Niño  ")).toBe("buzos-nino");
  });

  it("colapsa símbolos y no deja guiones en los extremos", () => {
    expect(slugifyCategory("¡Gorras & Sombreros!")).toBe("gorras-sombreros");
  });

  it("devuelve vacío cuando no queda ningún carácter válido", () => {
    expect(slugifyCategory("¿?")).toBe("");
  });
});

describe("visibleCategoryOf", () => {
  it("devuelve la categoría activa", () => {
    expect(visibleCategoryOf({ category: category() })?.slug).toBe("camisetas");
  });

  it("oculta una categoría deshabilitada", () => {
    expect(visibleCategoryOf({ category: category({ active: false }) })).toBeNull();
  });

  it("oculta una categoría que llegó sin poblar (lectura pública denegada)", () => {
    expect(visibleCategoryOf({ category: 7 })).toBeNull();
  });
});
