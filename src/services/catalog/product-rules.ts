import { type CollectionBeforeChangeHook, ValidationError } from "payload";

type ProductDraft = {
  _status?: unknown;
  category?: unknown;
  priceInCOP?: unknown;
  priceInCOPEnabled?: unknown;
  title?: unknown;
};

const LABELS = {
  category: "Categoría",
  priceInCOP: "Precio en COP",
  title: "Nombre",
} as const;

export type RequiredProductField = keyof typeof LABELS;

/**
 * Fields a garment needs before it reaches the catalog (HU-22): name, category
 * and price. The price must be enabled and greater than zero.
 */
export const missingProductFields = (product: ProductDraft): RequiredProductField[] => {
  const missing: RequiredProductField[] = [];
  if (typeof product.title !== "string" || !product.title.trim()) {
    missing.push("title");
  }
  if (product.category === undefined || product.category === null || product.category === "") {
    missing.push("category");
  }
  const hasPrice =
    product.priceInCOPEnabled === true &&
    typeof product.priceInCOP === "number" &&
    product.priceInCOP > 0;
  if (!hasPrice) {
    missing.push("priceInCOP");
  }
  return missing;
};

/**
 * Blocks publishing a garment without name, category or price. Drafts are left
 * alone: the panel autosaves them while the administrator is still typing.
 */
export const requireProductBasics: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const product: ProductDraft = { ...(originalDoc ?? {}), ...data };
  if (product._status !== "published") {
    return data;
  }

  const missing = missingProductFields(product);
  if (missing.length > 0) {
    throw new ValidationError({
      collection: "products",
      errors: missing.map((path) => ({
        label: LABELS[path],
        message:
          path === "priceInCOP"
            ? "Activa el precio en COP y escribe un valor mayor que cero."
            : "Este campo es obligatorio para publicar la prenda.",
        path,
      })),
    });
  }

  return data;
};
