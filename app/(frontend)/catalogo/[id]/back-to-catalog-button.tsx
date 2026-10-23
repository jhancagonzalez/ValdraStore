"use client";

import { useRouter } from "next/navigation";

/**
 * Returns to the catalog keeping the visitor's position: history back when the
 * catalog is in the stack, otherwise a direct link to the same page (HU-07).
 */
export const BackToCatalogButton = ({ page }: { page: number }) => {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/catalogo?page=${page}`);
  };

  return (
    <button type="button" className="button button-secondary" onClick={goBack}>
      Volver al catálogo
    </button>
  );
};
