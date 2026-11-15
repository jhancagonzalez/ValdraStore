import type { Access, CollectionConfig } from "payload";
import { hasAdminRole, isAdmin } from "@/access/roles";

/** Solo un cliente con sesión puede registrar una aprobación (HU-17). */
const isCustomerSession: Access = ({ req }) => req.user?.collection === "customers";

/**
 * Administradores ven todos los diseños; cada cliente ve solo los suyos. Payload
 * combina este filtro con el id solicitado, así que un cliente no puede leer el
 * diseño de otro cambiando el id desde el navegador.
 */
const isAdminOrOwner: Access = ({ req }) => {
  if (hasAdminRole(req.user)) {
    return true;
  }

  const userId = req.user?.id;

  if (userId === undefined || userId === null) {
    return false;
  }

  return { customer: { equals: userId } };
};

/**
 * Diseño final aprobado por el cliente (HU-17). Es la única pieza del flujo de
 * personalización que se persiste: la propuesta y su historial siguen viviendo
 * en el navegador.
 *
 * El criterio «asociado al pedido» queda como punto de extensión: los pedidos
 * están desactivados y no hay historia que los solicite, así que la referencia
 * se guarda en texto y la relación real se agregará en el Sprint 3.
 */
export const ApprovedDesigns: CollectionConfig = {
  slug: "approved-designs",
  access: {
    create: isCustomerSession,
    delete: isAdmin,
    read: isAdminOrOwner,
    // Un diseño aprobado no se modifica (criterio 3); solo un administrador
    // puede intervenir, y el cambio queda registrado por la auditoría de Payload.
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["garmentLabel", "colorLabel", "size", "customer", "approvedAt"],
    group: "Personalización",
    useAsTitle: "garmentLabel",
  },
  fields: [
    {
      name: "customer",
      type: "relationship",
      index: true,
      label: "Cliente",
      relationTo: "customers",
      required: true,
    },
    {
      name: "garment",
      type: "text",
      index: true,
      label: "Prenda base",
      required: true,
    },
    {
      name: "garmentLabel",
      type: "text",
      label: "Prenda",
      required: true,
    },
    {
      name: "colorLabel",
      type: "text",
      label: "Color",
      required: true,
    },
    {
      name: "size",
      type: "text",
      label: "Talla",
      required: true,
    },
    {
      name: "idea",
      type: "textarea",
      label: "Idea aprobada",
      required: true,
    },
    {
      name: "image",
      type: "textarea",
      admin: {
        description:
          "Imagen final en data URL. Solo la ven el cliente propietario y los administradores.",
      },
      label: "Diseño aprobado",
      maxLength: 3_000_000,
      required: true,
    },
    {
      name: "approvedAt",
      type: "date",
      label: "Fecha de aprobación",
      required: true,
    },
    {
      name: "orderReference",
      type: "text",
      admin: {
        description:
          "Punto de extensión para el pedido del Sprint 3. Sin historias de pedidos no se completa.",
      },
      label: "Referencia de pedido",
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== "create" || !data) {
          return data;
        }

        // La propiedad se fija en el servidor: el cliente no puede aprobar en
        // nombre de otra cuenta enviando otro id.
        if (req.user?.collection === "customers") {
          return { ...data, customer: req.user.id };
        }

        return data;
      },
    ],
  },
  labels: {
    plural: "Diseños aprobados",
    singular: "Diseño aprobado",
  },
};
