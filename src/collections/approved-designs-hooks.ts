import { APIError, type CollectionBeforeValidateHook } from "payload";

/** Tope por cuenta para que un cliente no pueda llenar el almacenamiento. */
export const MAX_APPROVED_DESIGNS_PER_CUSTOMER = 20;

/**
 * Fija la propiedad en el servidor y aplica el tope por cliente. Se ejecuta en
 * la colección, así que cubre tanto la ruta de aprobación como el REST de Payload.
 *
 * `ponytail:` el conteo y el create no son atómicos; un create concurrente puede
 * dejar el total en 21. El tope es una cuota de almacenamiento, no una garantía
 * exacta, y el coste de un lock no se justifica en el prototipo.
 */
export const enforceApprovedDesignLimit: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create" || !data) {
    return data;
  }

  // La propiedad se fija en el servidor: el cliente no puede aprobar en nombre
  // de otra cuenta enviando otro id.
  if (req.user?.collection !== "customers") {
    return data;
  }

  const { totalDocs } = await req.payload.count({
    collection: "approved-designs",
    overrideAccess: true,
    req,
    where: { customer: { equals: req.user.id } },
  });

  if (totalDocs >= MAX_APPROVED_DESIGNS_PER_CUSTOMER) {
    throw new APIError(
      "Alcanzaste el límite de diseños aprobados guardados. Descarga los que quieras conservar o contacta al administrador.",
      429,
    );
  }

  return { ...data, customer: req.user.id };
};
