"use client";

import { useEffect } from "react";

/**
 * Remembers the catalog scroll position per page so returning from a product
 * detail restores the visitor's place (HU-07, third criterion). The position is
 * captured on the card click, before Next.js scrolls the detail page to top.
 */
export const CatalogScrollMemory = ({ page }: { page: number }) => {
  useEffect(() => {
    const key = `catalogo-scroll:${page}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
      });
    }

    const remember = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("a[href^='/catalogo/']")) {
        return;
      }
      sessionStorage.setItem(key, String(window.scrollY));
    };

    document.addEventListener("click", remember, true);
    return () => document.removeEventListener("click", remember, true);
  }, [page]);

  return null;
};
