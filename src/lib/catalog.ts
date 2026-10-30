import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload";
import type { Product, Variant, VariantOption } from "../../payload-types";

export const CATALOG_PAGE_SIZE = 12;

export const CATEGORY_LABELS: Record<string, string> = {
  camisa: "Camisa",
  camisetas: "Camisetas",
  gorras: "Gorras",
  hoodies: "Hoodies",
};

export type CatalogFilters = {
  category: string;
  color: string;
  maxPrice: number | null;
  minPrice: number | null;
  q: string;
  size: string;
};

export type CatalogFacets = {
  categories: string[];
  colors: string[];
  sizes: string[];
};

/** Lowercases and strips diacritics so searches ignore case and accents (HU-09). */
export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

type ProductAttributes = { colors: string[]; prices: number[]; sizes: string[] };

const emptyAttributes = (): ProductAttributes => ({ colors: [], prices: [], sizes: [] });

const getVariantTypeKind = (variantType: VariantOption["variantType"]) => {
  if (typeof variantType !== "object") {
    return null;
  }
  const label = normalizeText(`${variantType.label} ${variantType.name}`);
  if (label.includes("talla") || label.includes("size")) {
    return "sizes";
  }
  if (label.includes("color")) {
    return "colors";
  }
  return null;
};

/** Groups the sizes, colors and prices of every variant by product id (HU-10). */
const groupVariantAttributes = (variants: Variant[]) => {
  const byProduct = new Map<number, ProductAttributes>();
  for (const variant of variants) {
    const productId = typeof variant.product === "object" ? variant.product.id : variant.product;
    const attributes = byProduct.get(productId) ?? emptyAttributes();
    if (typeof variant.priceInCOP === "number") {
      attributes.prices.push(variant.priceInCOP);
    }
    for (const option of variant.options ?? []) {
      if (typeof option !== "object") {
        continue;
      }
      const kind = getVariantTypeKind(option.variantType);
      if (kind && !attributes[kind].includes(option.label)) {
        attributes[kind].push(option.label);
      }
    }
    byProduct.set(productId, attributes);
  }
  return byProduct;
};

const sortedUnique = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));

const matchesFilters = (product: Product, attributes: ProductAttributes, filters: CatalogFilters) => {
  const query = normalizeText(filters.q);
  if (query) {
    const haystack = normalizeText(
      `${product.title} ${product.category} ${CATEGORY_LABELS[product.category] ?? ""}`,
    );
    if (!haystack.includes(query)) {
      return false;
    }
  }
  if (filters.category && product.category !== filters.category) {
    return false;
  }
  if (filters.size && !attributes.sizes.some((size) => normalizeText(size) === normalizeText(filters.size))) {
    return false;
  }
  if (
    filters.color &&
    !attributes.colors.some((color) => normalizeText(color) === normalizeText(filters.color))
  ) {
    return false;
  }
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const prices = [product.priceInCOP, ...attributes.prices].filter(
      (price): price is number => typeof price === "number",
    );
    const inRange = prices.some(
      (price) =>
        (filters.minPrice === null || price >= filters.minPrice) &&
        (filters.maxPrice === null || price <= filters.maxPrice),
    );
    if (!inRange) {
      return false;
    }
  }
  return true;
};

/**
 * Catalog queries run without overrideAccess so the ecommerce access layer
 * limits anonymous visitors to published products (HU-06).
 *
 * Search and filters are applied in memory: Payload's `like` operator is
 * accent-sensitive and size/color live on variants, not on products. The
 * prototype catalog is small, so loading it whole is acceptable (HU-09, HU-10).
 */
export const getPublishedProducts = async (page: number, filters: CatalogFilters) => {
  const payload = await getPayloadClient();
  const [productResult, variantResult] = await Promise.all([
    payload.find({
      collection: "products",
      depth: 2,
      overrideAccess: false,
      pagination: false,
      sort: "-createdAt",
    }),
    payload.find({
      collection: "variants",
      depth: 2,
      overrideAccess: false,
      pagination: false,
    }),
  ]);

  const attributesByProduct = groupVariantAttributes(variantResult.docs);
  const attributesOf = (product: Product) => attributesByProduct.get(product.id) ?? emptyAttributes();

  const facets: CatalogFacets = {
    categories: sortedUnique(productResult.docs.map((product) => product.category)),
    colors: sortedUnique(productResult.docs.flatMap((product) => attributesOf(product).colors)),
    sizes: sortedUnique(productResult.docs.flatMap((product) => attributesOf(product).sizes)),
  };

  const matching = productResult.docs.filter((product) =>
    matchesFilters(product, attributesOf(product), filters),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * CATALOG_PAGE_SIZE;

  return {
    docs: matching.slice(start, start + CATALOG_PAGE_SIZE),
    facets,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    page: currentPage,
    totalDocs: matching.length,
    totalPages,
    unfilteredCount: productResult.docs.length,
  };
};

export const getPublishedProductById = async (id: string) => {
  const payload = await getPayloadClient();
  try {
    return await payload.findByID({
      collection: "products",
      depth: 2,
      id,
      overrideAccess: false,
    });
  } catch {
    return null;
  }
};

export const getProductVariants = async (productId: number | string) => {
  const payload = await getPayloadClient();
  const where: Where = { product: { equals: productId } };
  return payload.find({
    collection: "variants",
    depth: 2,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    where,
  });
};
