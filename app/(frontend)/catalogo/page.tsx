import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS, type CatalogFilters, getPublishedProducts } from "@/lib/catalog";
import { formatCop } from "@/lib/format";
import type { Media } from "../../../payload-types";
import { CatalogFiltersForm } from "./catalog-filters";
import { CatalogScrollMemory } from "./catalog-scroll-memory";

export const metadata: Metadata = { title: "Catálogo" };

const parsePrice = (value: string | undefined): number | null => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
    color?: string;
    max?: string;
    min?: string;
    page?: string;
    q?: string;
    size?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const filters: CatalogFilters = {
    category: params.category ?? "",
    color: params.color ?? "",
    maxPrice: parsePrice(params.max),
    minPrice: parsePrice(params.min),
    q: (params.q ?? "").trim(),
    size: params.size ?? "",
  };
  const hasFilters = Object.values(filters).some((value) => value !== "" && value !== null);

  const products = await getPublishedProducts(page, filters);

  // Keeps search and filters in pagination links; the page number is added per link.
  const baseQuery = new URLSearchParams();
  const activeFilters: [string, string][] = [
    ["q", filters.q],
    ["category", filters.category],
    ["size", filters.size],
    ["color", filters.color],
    ["min", filters.minPrice?.toString() ?? ""],
    ["max", filters.maxPrice?.toString() ?? ""],
  ];
  for (const [key, value] of activeFilters) {
    if (value) {
      baseQuery.set(key, value);
    }
  }
  const pageHref = (target: number) => {
    const query = new URLSearchParams(baseQuery);
    query.set("page", String(target));
    return `/catalogo?${query.toString()}`;
  };

  return (
    <main className="page">
      <CatalogScrollMemory scope={pageHref(products.page)} />
      <h1 className="section-title">Catálogo</h1>
      <p className="section-subtitle">Prendas disponibles para personalizar</p>

      <CatalogFiltersForm facets={products.facets} filters={filters} />

      {products.docs.length === 0 ? (
        hasFilters && products.unfilteredCount > 0 ? (
          <p className="state-message" role="status">
            {filters.q
              ? `No encontramos prendas para “${filters.q}” con los filtros aplicados.`
              : "No encontramos prendas con los filtros aplicados."}{" "}
            <Link href="/catalogo">Limpiar filtros</Link>
          </p>
        ) : (
          <p className="state-message">No hay prendas disponibles por ahora. Vuelve pronto.</p>
        )
      ) : (
        <ul className="product-grid">
          {products.docs.map((product) => {
            const image = typeof product.image === "object" ? (product.image as Media) : null;
            const price = formatCop(product.priceInCOP);
            return (
              <li key={product.id}>
                <Link
                  href={`/catalogo/${product.id}?page=${products.page}`}
                  className="product-card"
                  aria-label={`Ver ${product.title}`}
                >
                  <span className="product-image">
                    {image?.url ? (
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 760px) 100vw, 230px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : null}
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
            <Link className="button button-secondary" href={pageHref(products.page - 1)}>
              Anterior
            </Link>
          ) : null}
          <span className="page-status">
            Página {products.page} de {products.totalPages} · {products.totalDocs} prendas
          </span>
          {products.hasNextPage ? (
            <Link className="button button-secondary" href={pageHref(products.page + 1)}>
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
