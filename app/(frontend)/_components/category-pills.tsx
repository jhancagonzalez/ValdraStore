import Link from "next/link";
import type { CatalogCategory } from "@/lib/catalog";
import { CategoryIcon } from "./category-icon";

type CategoryPillsProps = {
  active?: string;
  /** Categorías activas, tal como las administra el panel (HU-22). */
  categories: CatalogCategory[];
  hrefFor?: (category: string) => string;
};

/** Pills de categorías con iconos, enlazadas a los filtros reales del catálogo. */
export const CategoryPills = ({
  active = "",
  categories,
  hrefFor = (category) => (category ? `/catalogo?category=${category}` : "/catalogo"),
}: CategoryPillsProps) => (
  <ul className="category-pills" aria-label="Categorías del catálogo">
    <li>
      <Link
        href={hrefFor("")}
        className={active === "" ? "category-pill is-active" : "category-pill"}
        aria-current={active === "" ? "page" : undefined}
      >
        Todos
      </Link>
    </li>
    {categories.map(({ name, slug }) => {
      const isActive = active === slug;
      return (
        <li key={slug}>
          <Link
            href={hrefFor(slug)}
            className={isActive ? "category-pill is-active" : "category-pill"}
            aria-current={isActive ? "page" : undefined}
          >
            <CategoryIcon category={slug} />
            {name}
          </Link>
        </li>
      );
    })}
  </ul>
);
