import { describe, expect, it } from "vitest";
import {
  canTransitionOrderStatus,
  isOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "./status";

describe("order status", () => {
  it("reconoce los cinco estados", () => {
    expect(ORDER_STATUSES).toHaveLength(5);

    for (const status of ORDER_STATUSES) {
      expect(isOrderStatus(status)).toBe(true);
    }

    expect(isOrderStatus("entregado")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
  });

  it("permite avanzar en la producción", () => {
    expect(canTransitionOrderStatus("pendiente", "en_produccion")).toBe(true);
    expect(canTransitionOrderStatus("en_produccion", "lista")).toBe(true);
    expect(canTransitionOrderStatus("lista", "entregada")).toBe(true);
  });

  it("no permite retroceder ni reabrir un pedido", () => {
    expect(canTransitionOrderStatus("lista", "en_produccion")).toBe(false);
    expect(canTransitionOrderStatus("entregada", "lista")).toBe(false);
    expect(canTransitionOrderStatus("cancelada", "pendiente")).toBe(false);
  });

  it("permite cancelar antes de entregar", () => {
    expect(canTransitionOrderStatus("pendiente", "cancelada")).toBe(true);
    expect(canTransitionOrderStatus("en_produccion", "cancelada")).toBe(true);
    expect(canTransitionOrderStatus("lista", "cancelada")).toBe(false);
  });

  it("tiene etiquetas para la interfaz", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });
});
