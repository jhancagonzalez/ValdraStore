import { randomInt } from "node:crypto";

/** Genera un número aleatorio entre 100000 y 999999. */
export const generateOrderNumber = (): string => String(randomInt(100_000, 1_000_000));
