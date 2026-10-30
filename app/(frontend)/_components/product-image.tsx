"use client";

import Image from "next/image";
import { useState } from "react";
import productPlaceholder from "@/assets/product-placeholder.png";
import { DEFAULT_PRODUCT_IMAGE_ALT } from "@/lib/media";

type ProductImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  preload?: boolean;
};

/**
 * Renders a garment image inside a positioned container. If the garment has no
 * image or the remote file cannot be loaded, the default asset is shown instead
 * (HU-08: no broken links and a fallback image).
 */
export const ProductImage = ({ src, alt, sizes, preload = false }: ProductImageProps) => {
  const [failed, setFailed] = useState(false);
  const usingFallback = !src || failed;
  const imageAlt = usingFallback ? (alt.trim() === "" ? DEFAULT_PRODUCT_IMAGE_ALT : alt) : alt;

  return (
    <Image
      src={usingFallback ? productPlaceholder : src}
      alt={imageAlt}
      fill
      preload={preload}
      sizes={sizes}
      style={{ objectFit: "cover" }}
      data-fallback={usingFallback ? "true" : undefined}
      onError={usingFallback ? undefined : () => setFailed(true)}
    />
  );
};
