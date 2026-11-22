import { describe, expect, it } from "vitest";
import { generateOrderNumber } from "../../services/orders/order-number";
import { isOrderNumber } from "./order-number";

describe("order number", () => {
  it("genera seis cifras sin ceros a la izquierda", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const value = generateOrderNumber();
      expect(value).toMatch(/^[1-9]\d{5}$/);
      expect(isOrderNumber(value)).toBe(true);
    }
  });

  it("rechaza números de pedido inválidos", () => {
    expect(isOrderNumber("012345")).toBe(false);
    expect(isOrderNumber("12345")).toBe(false);
    expect(isOrderNumber("1234567")).toBe(false);
    expect(isOrderNumber(123456)).toBe(false);
    expect(isOrderNumber(null)).toBe(false);
  });
});
