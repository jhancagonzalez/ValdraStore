import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findGarmentBase, GARMENT_BASES, isMockupSize, MOCKUP_SIZES } from "./garment-bases";

describe("prendas base (HU-14/HU-15)", () => {
  it("expone las diez prendas del manifiesto", () => {
    expect(GARMENT_BASES).toHaveLength(10);
    expect(GARMENT_BASES.filter((base) => base.category === "camisetas")).toHaveLength(5);
    expect(GARMENT_BASES.filter((base) => base.category === "hoodies")).toHaveLength(5);
  });

  it("usa ids únicos y estables", () => {
    const ids = GARMENT_BASES.map((base) => base.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("camisetas-black");
    expect(ids).toContain("hoodies-blue");
  });

  it("encuentra una prenda por id y devuelve null si no existe", () => {
    expect(findGarmentBase("camisetas-red")?.name).toBe("Camiseta roja");
    expect(findGarmentBase("camisetas-verde")).toBeNull();
    expect(findGarmentBase(null)).toBeNull();
  });

  it("apunta a archivos que existen en public/mockups", () => {
    for (const base of GARMENT_BASES) {
      const filePath = path.join(process.cwd(), "public", base.file.replace(/^\/+/, ""));
      expect(fs.existsSync(filePath), `Falta ${base.file}`).toBe(true);
    }
  });

  it("valida las tallas disponibles", () => {
    expect(MOCKUP_SIZES).toEqual(["S", "M", "L", "XL"]);
    expect(isMockupSize("M")).toBe(true);
    expect(isMockupSize("XXL")).toBe(false);
    expect(isMockupSize(null)).toBe(false);
  });
});
