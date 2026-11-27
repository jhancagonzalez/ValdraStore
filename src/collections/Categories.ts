import type { Access, CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { hasAdminRole, isAdmin } from "../access/roles";
import { revalidateCatalog } from "../hooks/revalidate-catalog";
import { slugifyCategory } from "../lib/categories";

/** Administrators read every category; everyone else only the active ones. */
export const readActiveCategories: Access = ({ req }) =>
  hasAdminRole(req.user) ? true : { active: { equals: true } };

/** Fills the URL identifier from the name the first time, and keeps it normalized. */
export const fillCategorySlug: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data;
  }
  const source =
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug
      : typeof data.name === "string"
        ? data.name
        : "";
  return source ? { ...data, slug: slugifyCategory(source) } : data;
};

/**
 * Categorías del catálogo (HU-22, decisión D-09).
 *
 * El administrador las crea, edita y deshabilita desde el panel. No se eliminan:
 * una categoría deshabilitada deja de mostrarse a los clientes junto con sus
 * prendas, y se puede volver a habilitar sin perder la relación.
 */
export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    create: isAdmin,
    delete: () => false,
    read: readActiveCategories,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["name", "slug", "active", "updatedAt"],
    description:
      "Categorías de las prendas. Una categoría deshabilitada deja de mostrarse en el catálogo, junto con sus prendas.",
    group: "Catálogo",
    useAsTitle: "name",
  },
  defaultSort: "name",
  fields: [
    {
      name: "name",
      type: "text",
      label: "Nombre",
      maxLength: 60,
      required: true,
      unique: true,
    },
    {
      name: "slug",
      type: "text",
      label: "Identificador en la URL",
      index: true,
      maxLength: 60,
      required: true,
      unique: true,
      admin: {
        description:
          "Se usa en el enlace del catálogo (`/catalogo?category=…`). Si lo dejas vacío se genera a partir del nombre.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Visible para clientes",
      defaultValue: true,
      index: true,
      admin: {
        description:
          "Desmárcalo para deshabilitar la categoría sin borrarla. Sus prendas dejan de mostrarse en el catálogo.",
        position: "sidebar",
      },
    },
  ],
  hooks: {
    afterChange: [() => revalidateCatalog()],
    beforeValidate: [fillCategorySlug],
  },
  labels: {
    plural: "Categorías",
    singular: "Categoría",
  },
};
