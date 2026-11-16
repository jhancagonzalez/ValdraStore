"use client";

import { useRouter } from "next/navigation";
import type { CatalogSort as CatalogSortValue } from "@/lib/catalog";

type CatalogSortProps = {
  query: string;
  value: CatalogSortValue;
};

const OPTIONS: { label: string; value: CatalogSortValue }[] = [
  { label: "Más recientes", value: "newest" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
];

/** Selector real de orden: actualiza la URL y conserva los filtros activos. */
export const CatalogSort = ({ query, value }: CatalogSortProps) => {
  const router = useRouter();

  const change = (nextValue: CatalogSortValue) => {
    const params = new URLSearchParams(query);

    if (nextValue === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", nextValue);
    }

    params.delete("page");
    const search = params.toString();
    router.push(search ? `/catalogo?${search}` : "/catalogo");
  };

  return (
    <label className="catalog-sort">
      <span>Ordenar por</span>
      <select value={value} onChange={(event) => change(event.target.value as CatalogSortValue)}>
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};
