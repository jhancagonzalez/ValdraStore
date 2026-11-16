import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/catalog";
import { CategoryIcon } from "./category-icon";

type CategoryPillsProps = {
  active?: string;
  hrefFor?: (category: string) => string;
};

/** Pills de categorías con iconos, enlazadas a los filtros reales del catálogo. */
export const CategoryPills = ({
  active = "",
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
    {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
      const isActive = active === category;
      return (
        <li key={category}>
          <Link
            href={hrefFor(category)}
            className={isActive ? "category-pill is-active" : "category-pill"}
            aria-current={isActive ? "page" : undefined}
          >
            <CategoryIcon category={category} />
            {label}
          </Link>
        </li>
      );
    })}
  </ul>
);
