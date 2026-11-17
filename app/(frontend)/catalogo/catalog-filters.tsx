import Link from "next/link";
import type { CatalogFacets, CatalogFilters } from "@/lib/catalog";

type CatalogFiltersFormProps = {
  facets: CatalogFacets;
  filters: CatalogFilters;
};

const priceValue = (value: number | null) => (value === null ? "" : String(value));

/**
 * GET filters: combinable facets (HU-10) also live in the URL. The current
 * search term is preserved as a hidden field.
 */
export const CatalogFiltersForm = ({ facets, filters }: CatalogFiltersFormProps) => (
  <form className="catalog-filters" action="/catalogo" method="get">
    {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
    {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
    {filters.sort !== "newest" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
    <div className="form-field">
      <label htmlFor="size">Talla</label>
      <select id="size" name="size" defaultValue={filters.size}>
        <option value="">Todas</option>
        {filters.size && !facets.sizes.includes(filters.size) ? (
          <option value={filters.size}>{filters.size}</option>
        ) : null}
        {facets.sizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
    <div className="form-field">
      <label htmlFor="color">Color</label>
      <select id="color" name="color" defaultValue={filters.color}>
        <option value="">Todos</option>
        {filters.color && !facets.colors.includes(filters.color) ? (
          <option value={filters.color}>{filters.color}</option>
        ) : null}
        {facets.colors.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
    </div>
    <div className="catalog-price-fields">
      <div className="form-field">
        <label htmlFor="min">Precio mínimo (COP)</label>
        <input
          id="min"
          name="min"
          type="number"
          min={0}
          step="any"
          inputMode="numeric"
          defaultValue={priceValue(filters.minPrice)}
        />
      </div>
      <div className="form-field">
        <label htmlFor="max">Precio máximo (COP)</label>
        <input
          id="max"
          name="max"
          type="number"
          min={0}
          step="any"
          inputMode="numeric"
          defaultValue={priceValue(filters.maxPrice)}
        />
      </div>
    </div>
    <div className="catalog-filters-actions">
      <button type="submit" className="button button-primary">
        Aplicar filtros
      </button>
      <Link className="button button-secondary" href="/catalogo">
        Limpiar
      </Link>
    </div>
  </form>
);
