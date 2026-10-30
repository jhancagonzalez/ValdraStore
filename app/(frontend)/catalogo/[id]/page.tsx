import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductVariants, getPublishedProductById } from "@/lib/catalog";
import { formatCop } from "@/lib/format";
import { collectProductImages } from "@/lib/media";
import type { Variant, VariantOption, VariantType } from "../../../../payload-types";
import { ProductGallery } from "../../_components/product-gallery";
import { BackToCatalogButton } from "./back-to-catalog-button";
import { VariantSelector } from "./variant-selector";

export const metadata: Metadata = { title: "Prenda" };

const CATEGORY_LABELS: Record<string, string> = {
  camisa: "Camisa",
  camisetas: "Camisetas",
  gorras: "Gorras",
  hoodies: "Hoodies",
};

type SelectedVariant = {
  id: number;
  options: { type: string; option: string }[];
  price: string | null;
};

const toSelectedVariant = (variant: Variant): SelectedVariant => ({
  id: variant.id,
  options: (variant.options ?? []).flatMap((option: VariantOption | number) => {
    if (typeof option !== "object") {
      return [];
    }
    const variantOption = option as VariantOption;
    const variantType =
      typeof variantOption.variantType === "object"
        ? (variantOption.variantType as VariantType)
        : null;
    return [{ option: variantOption.label, type: variantType?.label ?? "" }];
  }),
  price: formatCop(variant.priceInCOP),
});

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [{ id }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const product = await getPublishedProductById(id);

  if (!product) {
    notFound();
  }

  const { docs: variantDocs } = await getProductVariants(product.id);
  const variants = variantDocs.map(toSelectedVariant);

  const optionTypes: string[] = [];
  for (const variant of variants) {
    for (const option of variant.options) {
      if (option.type && !optionTypes.includes(option.type)) {
        optionTypes.push(option.type);
      }
    }
  }

  const images = collectProductImages(product);
  const basePrice = formatCop(product.priceInCOP);
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const catalogPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <main className="page">
      <article className="product-detail">
        <ProductGallery images={images} fallbackAlt={product.title} />
        <div className="product-meta">
          <div className="detail-row">
            <span className="detail-label">
              {CATEGORY_LABELS[product.category] ?? product.category}
            </span>
            <h1>{product.title}</h1>
          </div>
          <div className="detail-row">
            <span className="detail-label">Material</span>
            <span>{product.material}</span>
          </div>
          {variants.length > 0 ? (
            <VariantSelector basePrice={basePrice} optionTypes={optionTypes} variants={variants} />
          ) : basePrice ? (
            <span className="detail-price">{basePrice}</span>
          ) : null}
          <BackToCatalogButton page={catalogPage} />
        </div>
      </article>
    </main>
  );
}
