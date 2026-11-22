import { describe, expect, it } from "vitest";
import { MOCKUP_BASES } from "../mockup-bases";
import {
  BASE_UNIT_PRICES,
  calculateOrderTotal,
  getDesignPricing,
  isOrderQuantity,
} from "./pricing";

describe("order pricing", () => {
  it("tiene precio para todas las prendas base", () => {
    for (const base of MOCKUP_BASES) {
      expect(BASE_UNIT_PRICES[base.category]).toBeGreaterThan(0);
    }
  });

  it("calcula el precio de camiseta y hoodie", () => {
    expect(getDesignPricing("camisetas-black")?.unitPrice).toBe(60_000);
    expect(getDesignPricing("hoodies-blue")?.unitPrice).toBe(120_000);
    expect(getDesignPricing("camisetas-black")?.base.id).toBe("camisetas-black");
  });

  it("rechaza una prenda desconocida", () => {
    expect(getDesignPricing("pantalones-black")).toBeNull();
  });

  it("acepta cantidades enteras entre 1 y 10", () => {
    expect(isOrderQuantity(1)).toBe(true);
    expect(isOrderQuantity(10)).toBe(true);
    expect(isOrderQuantity(0)).toBe(false);
    expect(isOrderQuantity(11)).toBe(false);
    expect(isOrderQuantity(1.5)).toBe(false);
    expect(isOrderQuantity("2")).toBe(false);
  });

  it("multiplica precio por cantidad", () => {
    expect(calculateOrderTotal(60_000, 3)).toBe(180_000);
    expect(calculateOrderTotal(120_000, 1)).toBe(120_000);
  });
});
