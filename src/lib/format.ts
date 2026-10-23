const copFormatter = new Intl.NumberFormat("es-CO", {
  currency: "COP",
  maximumFractionDigits: 0,
  style: "currency",
});

/** Formats a COP amount for display; null when the product has no price set. */
export const formatCop = (amount: null | number | undefined): string | null =>
  typeof amount === "number" ? copFormatter.format(amount) : null;
