import {
  getMockupBase,
  getMockupBaseName,
  type MockupBase,
  type MockupCategory,
} from "../mockup-bases";

/**
 * Precio fijo por prenda base (D-07 y D-20). El pedido no se vincula a un
 * producto del catálogo: usa la prenda del diseño aprobado y esta tabla.
 */
export const BASE_UNIT_PRICES: Record<MockupCategory, number> = {
  camisetas: 60_000,
  hoodies: 120_000,
};

export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 10;

export const isOrderQuantity = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= MIN_ORDER_QUANTITY &&
  value <= MAX_ORDER_QUANTITY;

export const calculateOrderTotal = (unitPrice: number, quantity: number): number =>
  unitPrice * quantity;

export type DesignPricing = {
  base: MockupBase;
  unitPrice: number;
};

/**
 * Obtiene la prenda base y su precio a partir del id guardado en el diseño
 * aprobado (por ejemplo `camisetas-black`).
 */
export const getDesignPricing = (garmentBaseId: string): DesignPricing | null => {
  const base = getMockupBase(garmentBaseId);

  if (!base) {
    return null;
  }

  const unitPrice = BASE_UNIT_PRICES[base.category];

  if (typeof unitPrice !== "number") {
    return null;
  }

  return { base, unitPrice };
};

export const getDesignBaseLabel = (garmentBaseId: string): string | null => {
  const base = getMockupBase(garmentBaseId);
  return base ? getMockupBaseName(base) : null;
};
