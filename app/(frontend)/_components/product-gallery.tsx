"use client";

import { useState } from "react";
import type { ProductImage as ProductImageData } from "@/lib/media";
import { ProductImage } from "./product-image";

type ProductGalleryProps = {
  images: ProductImageData[];
  fallbackAlt: string;
};

/**
 * Garment gallery with thumbnails for additional images and associated designs
 * (HU-08). Falls back to the default image when no media is available.
 */
export const ProductGallery = ({ images, fallbackAlt }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <section className="product-gallery" aria-label="Imágenes y diseños de la prenda">
      <div className="product-gallery-main">
        <ProductImage
          key={activeImage?.url ?? "default"}
          src={activeImage?.url ?? null}
          alt={activeImage?.alt ?? fallbackAlt}
          sizes="(max-width: 760px) 100vw, 520px"
          preload
        />
        {activeImage?.kind === "design" ? (
          <span className="product-gallery-badge">Diseño</span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="product-gallery-thumbs" aria-label="Vistas y diseños disponibles">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                className="product-gallery-thumb"
                aria-pressed={index === activeIndex}
                aria-label={`Ver ${image.kind === "design" ? "diseño" : "imagen"}: ${image.alt}`}
                onClick={() => setActiveIndex(index)}
              >
                <ProductImage src={image.url} alt="" sizes="96px" />
                {image.kind === "design" ? (
                  <span className="product-gallery-thumb-badge">Diseño</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="product-gallery-caption">
        {activeImage ? (
          <>
            {activeImage.kind === "design" ? "Diseño asociado" : "Vista de la prenda"}
            <span> · {activeImage.alt}</span>
          </>
        ) : (
          "Esta prenda aún no tiene imágenes registradas."
        )}
      </p>
    </section>
  );
};
