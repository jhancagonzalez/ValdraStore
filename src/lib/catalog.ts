import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import { visibleCategoryOf } from "@/lib/categories";
import { getPayloadClient } from "@/lib/payload";
import type { Product, Variant, VariantOption } from "../../payload-types";
import { hasVisibleDesigns } from "./design-visibility";

export const CATALOG_PAGE_SIZE = 12;

/** A category as the storefront lists it: `slug` goes in the URL, `name` on screen. */
export type CatalogCategory = { name: string; slug: string };

export type CatalogSort = "newest" | "price-asc" | "price-desc";

export type CatalogFilters = {
  category: string;
  color: string;
  maxPrice: number | null;
  minPrice: number | null;
  q: string;
  size: string;
  sort: CatalogSort;
};

export type CatalogFacets = {
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
  const category = visibleCategoryOf(product);
  const query = normalizeText(filters.q);
  if (query) {
    const haystack = normalizeText(
      `${product.title} ${category?.slug ?? ""} ${category?.name ?? ""}`,
    );
    if (!haystack.includes(query)) {
      return false;
    }
  }
  if (filters.category && category?.slug !== filters.category) {
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
        // Depth 2 populates the image of each associated design so the card can use
        // it (HU-23). Joins are not needed by the cards, and designs only bring the
        // fields the card reads.
        depth: 2,
        joins: false,
        overrideAccess: false,
        pagination: false,
        populate: { designs: { active: true, image: true, name: true } },
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

/**
 * Active categories for the storefront pills (HU-22). Read without
 * overrideAccess, so the collection access keeps disabled ones out.
 */
const loadCatalogCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "categories",
      depth: 0,
      overrideAccess: false,
      pagination: false,
      sort: "name",
    });
    return docs.map(({ name, slug }) => ({ name, slug }));
  },
  ["catalog-categories"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: ["catalog"] },
);

export const getCatalogCategories = () => loadCatalogCategories();

export const getPublishedProducts = async (page: number, filters: CatalogFilters) => {
  const rows = await loadCatalogRows();
  const { variants } = rows;
  // Garments with a disabled category (HU-22) or all hidden designs (HU-23) are not offered.
  const products = rows.products.filter(
    (product) => visibleCategoryOf(product) !== null && hasVisibleDesigns(product),
  );

  const attributesByProduct = groupVariantAttributes(variants);
  const attributesOf = (product: Product) =>
    attributesByProduct.get(product.id) ?? emptyAttributes();

  const facets: CatalogFacets = {
    colors: sortedUnique(products.flatMap((product) => attributesOf(product).colors)),
    sizes: sortedSizes(products.flatMap((product) => attributesOf(product).sizes)),
  };

  const matching = products.filter((product) =>
    matchesFilters(product, attributesOf(product), filters),
  );
  const sorted = [...matching];
  if (filters.sort === "price-asc" || filters.sort === "price-desc") {
    const direction = filters.sort === "price-asc" ? 1 : -1;
    const comparablePrice = (product: Product) => {
      const prices = [product.priceInCOP, ...attributesOf(product).prices].filter(
        (price): price is number => typeof price === "number",
      );
      return prices.length > 0 ? Math.min(...prices) : Number.POSITIVE_INFINITY;
    };

    sorted.sort((a, b) => {
      const priceA = comparablePrice(a);
      const priceB = comparablePrice(b);

      // Products without a price stay at the end in both directions.
      if (priceA === Number.POSITIVE_INFINITY || priceB === Number.POSITIVE_INFINITY) {
        return priceA === priceB ? 0 : priceA === Number.POSITIVE_INFINITY ? 1 : -1;
      }

      return direction * (priceA - priceB);
    });
  }
  const totalPages = Math.max(1, Math.ceil(sorted.length / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * CATALOG_PAGE_SIZE;

  return {
    docs: sorted.slice(start, start + CATALOG_PAGE_SIZE),
    facets,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    page: currentPage,
    totalDocs: sorted.length,
    totalPages,
    unfilteredCount: products.length,
  };
};

const loadProductById = unstable_cache(
  async (id: string) => {
    const payload = await getPayloadClient();
    // Depth 2 populates each associated design's image (HU-23).
    return payload.findByID({
      collection: "products",
      depth: 2,
      id,
      overrideAccess: false,
    });
  },
  ["product-by-id"],
  { revalidate: CATALOG_CACHE_SECONDS, tags: ["catalog"] },
);

export const getPublishedProductById = async (id: string) => {
  try {
    const product = await loadProductById(id);
    // Same rule as the list: disabled categories (HU-22) or hidden designs (HU-23) hide the garment.
    return visibleCategoryOf(product) && hasVisibleDesigns(product) ? product : null;
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
