import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProducts } from "@/lib/catalog";
import { formatCop } from "@/lib/format";
import { collectProductImages } from "@/lib/media";
import { ProductImage } from "../_components/product-image";
import { CatalogScrollMemory } from "./catalog-scroll-memory";

export const metadata: Metadata = { title: "Catálogo" };

const CATEGORY_LABELS: Record<string, string> = {
  camisa: "Camisa",
  camisetas: "Camisetas",
  gorras: "Gorras",
  hoodies: "Hoodies",
};

type CatalogPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const products = await getPublishedProducts(page);

  return (
    <main className="page">
      <CatalogScrollMemory page={page} />
      <h1 className="section-title">Catálogo</h1>
      <p className="section-subtitle">Prendas disponibles para personalizar</p>

      {products.docs.length === 0 ? (
        <p className="state-message">No hay prendas disponibles por ahora. Vuelve pronto.</p>
      ) : (
        <ul className="product-grid">
          {products.docs.map((product) => {
            const [image] = collectProductImages(product);
            const price = formatCop(product.priceInCOP);
            return (
              <li key={product.id}>
                <Link
                  href={`/catalogo/${product.id}?page=${page}`}
                  className="product-card"
                  aria-label={`Ver ${product.title}`}
                >
                  <span className="product-image">
                    <ProductImage
                      src={image?.url ?? null}
                      alt={image?.alt ?? product.title}
                      sizes="(max-width: 520px) 100vw, (max-width: 800px) 45vw, 230px"
                    />
                  </span>
                  <span className="product-info">
                    <span className="product-name">{product.title}</span>
                    <span className="product-category">
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </span>
                    {price ? <span className="product-price">{price}</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {products.totalPages > 1 ? (
        <nav className="pagination" aria-label="Paginación del catálogo">
          {products.hasPrevPage ? (
            <Link className="button button-secondary" href={`/catalogo?page=${page - 1}`}>
              Anterior
            </Link>
          ) : null}
          <span className="page-status">
            Página {products.page} de {products.totalPages} · {products.totalDocs} prendas
          </span>
          {products.hasNextPage ? (
            <Link className="button button-secondary" href={`/catalogo?page=${page + 1}`}>
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
