import Link from "next/link";
import { CATEGORY_LABELS, type CatalogFacets, type CatalogFilters } from "@/lib/catalog";

type CatalogFiltersFormProps = {
  facets: CatalogFacets;
  filters: CatalogFilters;
};

const priceValue = (value: number | null) => (value === null ? "" : String(value));

/**
 * GET search: the term lives in the URL so results are shareable and survive
 * pagination (HU-09). Active filters travel as hidden fields so searching does
 * not drop them.
 */
export const CatalogSearchForm = ({ filters }: { filters: CatalogFilters }) => (
  <search>
    <form className="catalog-search-bar" action="/catalogo" method="get">
      <label className="sr-only" htmlFor="q">
        Buscar prendas
      </label>
      <input
        id="q"
        name="q"
        type="search"
        placeholder="Buscar prendas"
        defaultValue={filters.q}
      />
      {filters.category ? (
        <input type="hidden" name="category" value={filters.category} />
      ) : null}
      {filters.size ? <input type="hidden" name="size" value={filters.size} /> : null}
      {filters.color ? <input type="hidden" name="color" value={filters.color} /> : null}
      {filters.minPrice !== null ? (
        <input type="hidden" name="min" value={String(filters.minPrice)} />
      ) : null}
      {filters.maxPrice !== null ? (
        <input type="hidden" name="max" value={String(filters.maxPrice)} />
      ) : null}
      <button type="submit" className="button button-primary">
        Buscar
      </button>
    </form>
  </search>
);

/**
 * GET filters: combinable facets (HU-10) also live in the URL. The current
 * search term is preserved as a hidden field.
 */
export const CatalogFiltersForm = ({ facets, filters }: CatalogFiltersFormProps) => (
  <form className="catalog-filters" action="/catalogo" method="get">
    {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
    <div className="form-field filter-field-category">
      <label htmlFor="category">Categoría</label>
      <select id="category" name="category" defaultValue={filters.category}>
        <option value="">Todas</option>
        {filters.category && !facets.categories.includes(filters.category) ? (
          <option value={filters.category}>
            {CATEGORY_LABELS[filters.category] ?? filters.category}
          </option>
        ) : null}
        {facets.categories.map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category] ?? category}
          </option>
        ))}
      </select>
    </div>
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
