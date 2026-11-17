"use client";

import { useRouter } from "next/navigation";

/**
 * Returns to the catalog keeping the visitor's position: history back when the
 * catalog is in the stack, otherwise a direct link to the same page (HU-07).
 */
export const BackToCatalogButton = ({ page }: { page: number }) => {
  const router = useRouter();

  const goBack = () => {
    // CatalogScrollMemory stores the scroll before the card click, so an entry
    // proves the visitor came from the catalog inside this tab. document.referrer
    // does not update on client-side navigations.
    const cameFromCatalog = Object.keys(sessionStorage).some((key) =>
      key.startsWith("catalogo-scroll:"),
    );

    if (cameFromCatalog && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/catalogo?page=${page}`);
  };

  return (
    <button type="button" className="back-link" onClick={goBack}>
      Volver al catálogo
    </button>
  );
};
