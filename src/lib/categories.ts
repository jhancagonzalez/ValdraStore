import type { Category, Product } from "../../payload-types";

/** Lowercases, strips diacritics and joins words with hyphens: "Buzos Niño" → "buzos-nino". */
export const slugifyCategory = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * The category of a garment as the storefront may show it (HU-22).
 *
 * Anonymous reads only populate active categories: a disabled one arrives as a
 * bare id, so it resolves to `null` here and the garment is not offered.
 */
export const visibleCategoryOf = (product: Pick<Product, "category">): Category | null => {
  const { category } = product;
  if (!category || typeof category !== "object") {
    return null;
  }
  return category.active === false ? null : category;
};
