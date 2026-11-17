import { revalidateTag } from "next/cache";

/**
 * The storefront caches catalog rows for a short TTL. Invalidate that cache when
 * an admin publishes or edits a product, variant or image so changes appear at
 * once instead of waiting for the TTL (code review finding).
 */
export const revalidateCatalog = (): void => {
  try {
    revalidateTag("catalog", { expire: 0 });
  } catch {
    // Called outside a Next request (migrations, scripts): nothing to revalidate.
  }
};
