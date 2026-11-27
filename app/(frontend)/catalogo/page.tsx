import type { Metadata } from "next";
import Link from "next/link";
import {
  type CatalogFilters,
  type CatalogSort,
  getCatalogCategories,
  getPublishedProducts,
} from "@/lib/catalog";
import { CategoryPills } from "../_components/category-pills";
import { ProductCard } from "../_components/product-card";
import { CatalogFiltersForm } from "./catalog-filters";
import { CatalogScrollMemory } from "./catalog-scroll-memory";
import { CatalogSort as CatalogSortSelect } from "./catalog-sort";

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
  const sortParam = firstValue(params.sort);
  const sort: CatalogSort =
    sortParam === "price-asc" || sortParam === "price-desc" ? sortParam : "newest";

  const filters: CatalogFilters = {
    category: firstValue(params.category),
    color: firstValue(params.color),
    maxPrice: parsePrice(firstValue(params.max)),
    minPrice: parsePrice(firstValue(params.min)),
    q: firstValue(params.q).trim(),
    size: firstValue(params.size),
    sort,
  };
  const hasFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.size ||
      filters.color ||
      filters.minPrice !== null ||
      filters.maxPrice !== null,
  );

  const [products, categories] = await Promise.all([
    getPublishedProducts(page, filters),
    getCatalogCategories(),
  ]);

  // Keeps search and filters in pagination links; the page number is added per link.
  const baseQuery = new URLSearchParams();
  const activeFilters: [string, string][] = [
    ["q", filters.q],
    ["category", filters.category],
    ["size", filters.size],
    ["color", filters.color],
    ["min", filters.minPrice?.toString() ?? ""],
    ["max", filters.maxPrice?.toString() ?? ""],
    ["sort", filters.sort === "newest" ? "" : filters.sort],
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
  const categoryHref = (category: string) => {
    const query = new URLSearchParams(baseQuery);
    if (category) {
      query.set("category", category);
    } else {
      query.delete("category");
    }
    query.delete("page");
    const search = query.toString();
    return search ? `/catalogo?${search}` : "/catalogo";
  };
  const clearSearchHref = () => {
    const query = new URLSearchParams(baseQuery);
    query.delete("q");
    query.delete("page");
    const search = query.toString();
    return search ? `/catalogo?${search}` : "/catalogo";
  };

  return (
    <main className="page page-catalog">
      <CatalogScrollMemory scope={pageHref(products.page)} />
      <div className="catalog-head">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="section-title">Prendas para ti.</h1>
          <p className="section-subtitle">
            Explora la colección y elige una base para personalizar.
          </p>
        </div>
      </div>

      <div className="catalog-toolbar">
        <CategoryPills active={filters.category} categories={categories} hrefFor={categoryHref} />
        <CatalogSortSelect value={filters.sort} query={baseQuery.toString()} />
      </div>

      {filters.q ? (
        <p className="catalog-query" role="status">
          Resultados para “{filters.q}”. <Link href={clearSearchHref()}>Limpiar búsqueda</Link>
        </p>
      ) : null}

      <details className="catalog-advanced">
        <summary>Filtros</summary>
        <CatalogFiltersForm
          key={`${filters.category}|${filters.q}|${filters.size}|${filters.color}|${filters.minPrice}|${filters.maxPrice}|${filters.sort}`}
          facets={products.facets}
          filters={filters}
        />
      </details>

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
            <p className="state-message">
              No hay prendas disponibles por ahora. Vuelve pronto para descubrir la colección.
            </p>
          )
        ) : (
          <ul className="product-grid">
            {products.docs.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                catalogPage={products.page}
                preload={index === 0}
              />
            ))}
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
              Página {products.page} de {products.totalPages}
            </span>
            {products.hasNextPage ? (
              <Link className="button button-secondary" href={pageHref(products.page + 1)}>
                Siguiente
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
