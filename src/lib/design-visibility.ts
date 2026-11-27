import type { Design, Product } from "../../payload-types";

/**
 * Reglas de visibilidad de los diseños para los clientes (HU-23, criterio 3).
 *
 * Un diseño se muestra solo si llegó poblado y está activo. Con acceso de
 * cliente o visitante, Payload no puebla los diseños deshabilitados (llegan como
 * id o no llegan), así que un id suelto también cuenta como no visible.
 */
export const isVisibleDesign = (value: Design | number | null | undefined): value is Design =>
  Boolean(value) && typeof value === "object" && value?.active !== false;

/**
 * Una prenda sin diseños asociados siempre se muestra. Si tiene diseños, se
 * muestra solo mientras al menos uno esté activo: al ocultar el único diseño de
 * una prenda, la prenda deja de verse en el catálogo y en su detalle.
 */
export const hasVisibleDesigns = (product: Pick<Product, "designs">): boolean => {
  const designs = product.designs ?? [];
  return designs.length === 0 || designs.some(isVisibleDesign);
};

/** Texto que ve el administrador en la lista de diseños, en vez de true/false. */
export const designAvailabilityLabel = (active: boolean | null | undefined): string =>
  active === false ? "Oculto" : "Disponible";
