import type { Media, Product } from "../../payload-types";

/** Shown when a garment has no usable image (HU-08, third criterion). */
export const DEFAULT_PRODUCT_IMAGE_ALT = "Imagen de prenda no disponible";

export type ProductImageKind = "image" | "design";

export type ProductImage = {
  url: string;
  alt: string;
  kind: ProductImageKind;
};

const isUsableUrl = (value: string): boolean => {
  const url = value.trim();
  if (url === "") {
    return false;
  }

  if (url.startsWith("/")) {
    return !url.startsWith("//");
  }

  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Turns a Payload upload value into a renderable image. Only relationships that
 * were populated (depth >= 1) and expose a valid URL are accepted, so the
 * catalog never renders a broken link.
 */
export const toProductImage = (
  value: Media | number | null | undefined,
  fallbackAlt: string,
  kind: ProductImageKind = "image",
): ProductImage | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const media = value as Media;
  if (typeof media.url !== "string" || !isUsableUrl(media.url)) {
    return null;
  }

  const alt = typeof media.alt === "string" && media.alt.trim() !== "" ? media.alt : fallbackAlt;

  return { alt, kind, url: media.url.trim() };
};

type ProductMediaSource = Pick<Product, "title"> &
  Partial<Pick<Product, "image" | "gallery" | "designs">>;

/** Product image followed by additional views and associated designs, without duplicates. */
export const collectProductImages = (product: ProductMediaSource): ProductImage[] => {
  const candidates: (ProductImage | null)[] = [
    toProductImage(product.image, product.title, "image"),
    ...(product.gallery ?? []).map((value) => toProductImage(value, product.title, "image")),
    ...(product.designs ?? []).map((value) => toProductImage(value, product.title, "design")),
  ];

  const seen = new Set<string>();
  const images: ProductImage[] = [];

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate.url)) {
      continue;
    }
    seen.add(candidate.url);
    images.push(candidate);
  }

  return images;
};
