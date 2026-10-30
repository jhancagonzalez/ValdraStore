import { unstable_cache } from "next/cache";
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
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

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

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Única"];

/** Clothing sizes read S, M, L, XL before any other label; "Única" goes last. */
const sortedSizes = (values: string[]) =>
  [...new Set(values)].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a);
    const indexB = SIZE_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) {
      return -1;
    }
    if (indexB !== -1) {
      return 1;
    }
    return a.localeCompare(b, "es", { numeric: true });
  });

const matchesFilters = (
  product: Product,
  attributes: ProductAttributes,
  filters: CatalogFilters,
) => {
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
  if (
    filters.size &&
    !attributes.sizes.some((size) => normalizeText(size) === normalizeText(filters.size))
  ) {
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
const CATALOG_CACHE_SECONDS = 30;

/**
 * Raw catalog rows, cached briefly so each render does not pay a database round
 * trip. Thirty seconds keeps admin edits visible quickly while removing the
 * per-request latency from the storefront.
 */
const loadCatalogRows = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    const [productResult, variantResult] = await Promise.all([
      payload.find({
        collection: "products",
        depth: 1,
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
    return { products: productResult.docs, variants: variantResult.docs };
  },
  ["catalog-rows"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: ["catalog"] },
);

export const getPublishedProducts = async (page: number, filters: CatalogFilters) => {
  const { products, variants } = await loadCatalogRows();

  const attributesByProduct = groupVariantAttributes(variants);
  const attributesOf = (product: Product) =>
    attributesByProduct.get(product.id) ?? emptyAttributes();

  const facets: CatalogFacets = {
    categories: sortedUnique(products.map((product) => product.category)),
    colors: sortedUnique(products.flatMap((product) => attributesOf(product).colors)),
    sizes: sortedSizes(products.flatMap((product) => attributesOf(product).sizes)),
  };

  const matching = products.filter((product) =>
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
    unfilteredCount: products.length,
  };
};

const loadProductById = unstable_cache(
  async (id: string) => {
    const payload = await getPayloadClient();
    return payload.findByID({
      collection: "products",
      depth: 1,
      id,
      overrideAccess: false,
    });
  },
  ["product-by-id"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: ["catalog"] },
);

export const getPublishedProductById = async (id: string) => {
  try {
    return await loadProductById(id);
  } catch {
    return null;
  }
};

const loadProductVariants = unstable_cache(
  async (productId: string) => {
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
  },
  ["product-variants"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: ["catalog"] },
);

export const getProductVariants = (productId: number | string) =>
  loadProductVariants(String(productId));
