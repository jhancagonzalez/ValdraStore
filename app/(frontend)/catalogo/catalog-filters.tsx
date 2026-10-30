import Link from "next/link";
import { CATEGORY_LABELS, type CatalogFacets, type CatalogFilters } from "@/lib/catalog";

type CatalogFiltersFormProps = {
  facets: CatalogFacets;
  filters: CatalogFilters;
};

/**
 * GET form: search (HU-09) and combinable filters (HU-10) live in the URL, so
 * results are shareable and survive pagination and returning from a product.
 */
export const CatalogFiltersForm = ({ facets, filters }: CatalogFiltersFormProps) => (
  <search>
    <form className="catalog-filters" action="/catalogo" method="get">
      <div className="form-field catalog-search">
        <label htmlFor="q">Buscar prendas</label>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Nombre o categoría"
          defaultValue={filters.q}
        />
      </div>
      <div className="form-field">
        <label htmlFor="category">Categoría</label>
        <select id="category" name="category" defaultValue={filters.category}>
          <option value="">Todas</option>
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
          {facets.colors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="min">Precio mínimo (COP)</label>
        <input
          id="min"
          name="min"
          type="number"
          min={0}
          step={1000}
          inputMode="numeric"
          defaultValue={filters.minPrice ?? ""}
        />
      </div>
      <div className="form-field">
        <label htmlFor="max">Precio máximo (COP)</label>
        <input
          id="max"
          name="max"
          type="number"
          min={0}
          step={1000}
          inputMode="numeric"
          defaultValue={filters.maxPrice ?? ""}
        />
      </div>
      <div className="catalog-filters-actions">
        <button type="submit" className="button button-primary">
          Aplicar
        </button>
        <Link className="button button-secondary" href="/catalogo">
          Limpiar filtros
        </Link>
      </div>
    </form>
  </search>
);
