import { describe, expect, it } from "vitest";
import { getStockKey, hasEnoughStock, parseStockKey, shouldRestoreStockOnDelete } from "./stock";

describe("order stock", () => {
  it("genera una clave estable por prenda y talla", () => {
    expect(getStockKey("camisetas-black", "M")).toBe("camisetas-black|M");
    expect(getStockKey("hoodies-blue", "XL")).toBe("hoodies-blue|XL");
  });

  it("lee una clave válida", () => {
    expect(parseStockKey("camisetas-black|M")).toEqual({
      baseId: "camisetas-black",
      size: "M",
    });
  });

  it("rechaza claves inválidas", () => {
    expect(parseStockKey("camisetas-black")).toBeNull();
    expect(parseStockKey("|M")).toBeNull();
    expect(parseStockKey("camisetas-black|XXL")).toBeNull();
  });

  it("compara disponibilidad", () => {
    expect(hasEnoughStock(3, 2)).toBe(true);
    expect(hasEnoughStock(1, 2)).toBe(false);
    expect(hasEnoughStock(undefined, 1)).toBe(false);
    expect(hasEnoughStock(Number.NaN, 1)).toBe(false);
  });

  it("solo devuelve stock de pedidos no entregados ni ya devueltos", () => {
    expect(shouldRestoreStockOnDelete("pendiente", false)).toBe(true);
    expect(shouldRestoreStockOnDelete("en_produccion", false)).toBe(true);
    expect(shouldRestoreStockOnDelete("lista", false)).toBe(true);
    expect(shouldRestoreStockOnDelete("entregada", false)).toBe(false);
    expect(shouldRestoreStockOnDelete("cancelada", true)).toBe(false);
    expect(shouldRestoreStockOnDelete("cancelada", false)).toBe(true);
  });
});
