import type { CollectionConfig } from "payload";
import { hasAdminRole, isAdmin } from "../access/roles";
import { revalidateCatalog } from "../hooks/revalidate-catalog";
import { readActiveDesigns } from "./designs-access";

/**
 * Diseños disponibles del catálogo (HU-23, decisión D-10).
 *
 * El administrador los crea, edita, deshabilita y elimina desde el panel. Cada
 * diseño tiene su imagen y se asocia a las prendas desde el campo «Diseños
 * asociados» de la prenda (`products.designs`); aquí se ve la lista de prendas
 * que lo usan. Los clientes solo pueden leer los diseños activos.
 */
export const Designs: CollectionConfig = {
  slug: "designs",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: readActiveDesigns,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["name", "image", "active", "updatedAt"],
    description:
      "Diseños que se ofrecen a los clientes. Asócialos a una prenda desde «Diseños asociados» en la prenda. Un diseño oculto deja de mostrarse en el catálogo, y una prenda cuyos diseños estén todos ocultos también.",
    group: "Catálogo",
    useAsTitle: "name",
  },
  defaultSort: "name",
  fields: [
    {
      name: "name",
      type: "text",
      label: "Nombre",
      maxLength: 80,
      required: true,
      unique: true,
    },
    {
      name: "image",
      type: "upload",
      label: "Imagen del diseño",
      relationTo: "media",
      required: true,
      admin: {
        description: "Imagen JPEG, PNG o WebP que verán los clientes en el detalle de la prenda.",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Descripción",
      maxLength: 300,
      admin: {
        description: "Opcional. Uso interno del equipo.",
      },
      access: {
        read: ({ req }) => hasAdminRole(req.user),
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Disponible para clientes",
      defaultValue: true,
      index: true,
      admin: {
        components: {
          Cell: "@/components/admin/designs/DesignAvailabilityCell#DesignAvailabilityCell",
        },
        description:
          "Desmárcalo para ocultar el diseño del catálogo sin eliminarlo. Si es el único diseño activo de una prenda, la prenda también deja de mostrarse.",
        position: "sidebar",
      },
    },
    {
      name: "garments",
      type: "join",
      label: "Prendas con este diseño",
      collection: "products",
      on: "designs",
      admin: {
        allowCreate: false,
        // Un diseño nuevo aún no tiene prendas: la lista aparece después de guardarlo.
        condition: (data) => Boolean(data?.id),
        defaultColumns: ["title", "category", "_status"],
        description:
          "Para asociar o quitar este diseño, edita la prenda y cambia «Diseños asociados».",
      },
    },
  ],
  hooks: {
    afterChange: [() => revalidateCatalog()],
    afterDelete: [() => revalidateCatalog()],
  },
  labels: {
    plural: "Diseños",
    singular: "Diseño",
  },
};
