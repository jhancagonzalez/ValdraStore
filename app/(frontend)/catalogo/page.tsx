import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_LABELS, type CatalogFilters, getPublishedProducts } from "@/lib/catalog";
import { formatCop } from "@/lib/format";
import { collectProductImages } from "@/lib/media";
import { ProductImage } from "../_components/product-image";
import { CatalogFiltersForm, CatalogSearchForm } from "./catalog-filters";
import { CatalogScrollMemory } from "./catalog-scroll-memory";

export const metadata: Metadata = { title: "Catálogo" };

type SearchParam = string | string[] | undefined;

/** Next delivers string[] when a query parameter is repeated; take the first value. */
const firstValue = (value: SearchParam): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

const parsePrice = (value: string): number | null => {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, SearchParam>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const filters: CatalogFilters = {
    category: firstValue(params.category),
    color: firstValue(params.color),
    maxPrice: parsePrice(firstValue(params.max)),
    minPrice: parsePrice(firstValue(params.min)),
    q: firstValue(params.q).trim(),
    size: firstValue(params.size),
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
    <main className="page page-catalog">
      <CatalogScrollMemory scope={pageHref(products.page)} />
      <div className="catalog-head">
        <div>
          <h1 className="section-title">Catálogo</h1>
          <p className="section-subtitle">Prendas disponibles para personalizar</p>
        </div>
        <span className="catalog-count">
          {products.totalDocs} {products.totalDocs === 1 ? "prenda" : "prendas"}
        </span>
      </div>

      <CatalogSearchForm filters={filters} />

      <div className="catalog-body">
        <aside className="catalog-aside" aria-labelledby="filters-title">
          <h2 className="filters-title" id="filters-title">
            Filtros
          </h2>
          <CatalogFiltersForm facets={products.facets} filters={filters} />
        </aside>

        <div className="catalog-results">
          {products.docs.length === 0 ? (
            hasFilters && products.unfilteredCount > 0 ? (
              <p className="state-message" role="status">
                {filters.q
                  ? `No encontramos prendas para “${filters.q}”.`
                  : "No encontramos prendas con los filtros aplicados."}{" "}
                <Link href="/catalogo">Limpiar filtros</Link>
              </p>
            ) : (
              <p className="state-message">No hay prendas disponibles por ahora. Vuelve pronto.</p>
            )
          ) : (
            <ul className="product-grid">
              {products.docs.map((product, index) => {
                const [image] = collectProductImages(product);
                const price = formatCop(product.priceInCOP);
                return (
                  <li key={product.id}>
                    <Link
                      href={`/catalogo/${product.id}?page=${products.page}`}
                      className="product-card"
                    >
                      <span className="product-image">
                        <ProductImage
                          src={image?.url ?? null}
                          alt=""
                          sizes="(max-width: 860px) 45vw, 280px"
                          preload={index === 0}
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
        </div>
      </div>
    </main>
  );
}
