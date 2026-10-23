import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload";

export const CATALOG_PAGE_SIZE = 12;

/**
 * Catalog queries run without overrideAccess so the ecommerce access layer
 * limits anonymous visitors to published products (HU-06).
 */
export const getPublishedProducts = async (page: number) => {
  const payload = await getPayloadClient();
  return payload.find({
    collection: "products",
    depth: 2,
    limit: CATALOG_PAGE_SIZE,
    overrideAccess: false,
    page,
    sort: "-createdAt",
  });
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
