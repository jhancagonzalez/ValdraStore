import Link from "next/link";
import { visibleCategoryOf } from "@/lib/categories";
import { formatCop } from "@/lib/format";
import { collectProductImages } from "@/lib/media";
import type { Product } from "../../../payload-types";
import { ProductImage } from "./product-image";

type ProductCardProps = {
  catalogPage?: number;
  preload?: boolean;
  product: Product;
};

/** Tarjeta de catálogo compartida por la portada y el catálogo. */
export const ProductCard = ({ catalogPage = 1, preload = false, product }: ProductCardProps) => {
  const images = collectProductImages(product);
  const [image, hoverImage] = images;
  const price = formatCop(product.priceInCOP);
  const href = `/catalogo/${product.id}?page=${catalogPage}`;

  return (
    <li className="product-card-item">
      <Link href={href} className="product-card">
        <span className="product-image">
          <ProductImage
            src={image?.url ?? null}
            alt=""
            sizes="(max-width: 640px) 44vw, (max-width: 1100px) 30vw, 260px"
            preload={preload}
          />
          {hoverImage ? (
            <span className="product-image-hover" aria-hidden="true">
              <ProductImage src={hoverImage.url} alt="" sizes="260px" />
            </span>
          ) : null}
          <span className="product-card-cta" aria-hidden="true">
            Ver prenda <span>→</span>
          </span>
        </span>
        <span className="product-info">
          <span className="product-category">{visibleCategoryOf(product)?.name}</span>
          <span className="product-name">{product.title}</span>
          {price ? <span className="product-price">{price}</span> : null}
        </span>
      </Link>
    </li>
  );
};
