import { isMockupSize, type MockupSize } from "../mockup-bases";

/** Stock inicial de cada combinación prenda base + talla. */
export const DEFAULT_STOCK_QUANTITY = 20;

/** Clave estable para la colección `garment-stock` (p. ej. `camisetas-black|M`). */
export const getStockKey = (baseId: string, size: MockupSize): string => `${baseId}|${size}`;

export type ParsedStockKey = {
  baseId: string;
  size: MockupSize;
};

export const parseStockKey = (key: string): ParsedStockKey | null => {
  const separator = key.indexOf("|");

  if (separator <= 0) {
    return null;
  }

  const baseId = key.slice(0, separator);
  const size = key.slice(separator + 1);

  if (!baseId || !isMockupSize(size)) {
    return null;
  }

  return { baseId, size };
};

export const hasEnoughStock = (available: unknown, requested: number): boolean =>
  typeof available === "number" && Number.isFinite(available) && available >= requested;
