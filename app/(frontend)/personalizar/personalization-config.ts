import type { MockupCategory } from "@/lib/mockup-bases";

export const IDEA_MAX_LENGTH = 600;

export const CATEGORY_ORDER: MockupCategory[] = ["camisetas", "hoodies"];

export const CATEGORY_LABELS: Record<MockupCategory, string> = {
  camisetas: "Camisetas",
  hoodies: "Hoodies",
};

export const STEPS = ["Prenda", "Diseño", "Confirmación"] as const;

export const SWATCH_COLORS: Record<string, string> = {
  beige: "#d8c7b2",
  black: "#12110f",
  blue: "#3d5a8a",
  red: "#a8322a",
  white: "#f4f1ec",
};

export const MIN_SELECTION_SIZE = 0.02;

/** Si el proveedor no responde en este tiempo, se corta y se ofrece reintentar. */
export const CLIENT_GENERATION_TIMEOUT_MS = 200_000;

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Problema que el cliente debe resolver antes de generar (HU-12, HU-16). */
export type FormIssue = {
  title: string;
  message: string;
  suggestedColorKey?: string;
};

export const formIssue = (title: string, message: string): FormIssue => ({
  title,
  message,
});
