import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import type { EcommercePluginConfig } from "@payloadcms/plugin-ecommerce/types";
import type { Access, Plugin, Where } from "payload";
import { hasAdminRole, isAdmin, isAdminField, isCustomer } from "@/access/roles";
import { revalidateCatalog } from "@/hooks/revalidate-catalog";

const isAuthenticated: Access = ({ req }) => Boolean(req.user);

/**
 * Variants of a draft product must not be readable by the public API, even when
 * the variant itself is published (database audit 2.1).
 */
const readPublishedVariants: Access = ({ req }) => {
  if (hasAdminRole(req.user)) {
    return true;
  }

  const where: Where = {
    and: [
      { _status: { equals: "published" } },
      { "product._status": { equals: "published" } },
    ],
  };

  return where;
};

const ecommerceConfig: EcommercePluginConfig = {
  access: {
    adminOnlyFieldAccess: isAdminField,
    adminOrPublishedStatus: ({ req }) =>
      hasAdminRole(req.user) ? true : { _status: { equals: "published" } },
    isAdmin,
    isAuthenticated,
    isCustomer,
    // Fail closed. This predicate is unused while customer-owned commerce
    // collections remain disabled and must be revisited before enabling them.
    isDocumentOwner: ({ req }) => hasAdminRole(req.user),
  },
  addresses: false,
  carts: false,
  customers: { slug: "customers" },
  currencies: {
    defaultCurrency: "COP",
    supportedCurrencies: [
      {
        code: "COP",
        decimals: 0,
        label: "Peso colombiano",
        symbol: "$",
        symbolDisplay: "code",
      },
    ],
  },
  inventory: false,
  orders: false,
  payments: { paymentMethods: [] },
  products: {
    productsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      access: {
        ...defaultCollection.access,
        readVersions: isAdmin,
      },
      admin: {
        ...defaultCollection.admin,
        group: "Catálogo",
        defaultColumns: ["title", "category", "priceInCOP", "_status"],
        useAsTitle: "title",
      },
      labels: {
        plural: "Prendas",
        singular: "Prenda",
      },
      fields: [
        {
          name: "title",
          type: "text",
          label: "Nombre",
          required: true,
        },
        {
          name: "image",
          type: "upload",
          label: "Imagen principal",
          relationTo: "media",
          admin: {
            description:
              "Imagen que representa la prenda en el catálogo. Si falta, se muestra la imagen por defecto.",
          },
        },
        {
          name: "gallery",
          type: "upload",
          hasMany: true,
          label: "Imágenes adicionales",
          relationTo: "media",
          admin: {
            description: "Otras vistas de la prenda que se muestran en el detalle (HU-08).",
          },
        },
        {
          name: "designs",
          type: "upload",
          hasMany: true,
          label: "Diseños asociados",
          relationTo: "media",
          admin: {
            description:
              "Diseños disponibles para esta prenda. Se muestran en el detalle del catálogo (HU-08).",
          },
        },
        {
          name: "category",
          type: "select",
          label: "Categoría",
          options: [
            { label: "Camisetas", value: "camisetas" },
            { label: "Hoodies", value: "hoodies" },
            { label: "Camisa", value: "camisa" },
            { label: "Gorras", value: "gorras" },
          ],
          required: true,
        },
        {
          name: "material",
          type: "text",
          label: "Material",
          required: true,
        },
        ...(defaultCollection.fields ?? []),
      ],
    }),
    variants: true,
  },
  transactions: false,
};

/** Catalog foundation only; deliberately excludes checkout and payment flows. */
const configureEcommerce = ecommercePlugin(ecommerceConfig);

/**
 * Payload 3.91.0's config sanitizer turns `addresses: false` into a truthy object.
 * Filter only plugin-added collections so address data and checkout remain outside
 * the approved catalog foundation until a product story explicitly needs them.
 */
export const ecommercePluginForCatalog: Plugin = async (incomingConfig) => {
  const existingSlugs = new Set(incomingConfig.collections?.map(({ slug }) => slug) ?? []);
  const existingSchemaFns = incomingConfig.typescript?.schema ?? [];
  const configured = await configureEcommerce(incomingConfig);

  // The plugin registers a typescript.schema mapper that emits a $ref per
  // collection in its slug map, including disabled commerce collections.
  // Wrap the mappers it added so dangling refs never reach generate:types.
  const collectionLabels: Record<string, { plural: string; singular: string }> = {
    variants: { plural: "Variantes", singular: "Variante" },
    variantTypes: { plural: "Tipos de variante", singular: "Tipo de variante" },
    variantOptions: { plural: "Opciones de variante", singular: "Opción de variante" },
  };

  const catalogSlugs = new Set(["products", "variants", "variantTypes", "variantOptions"]);

  const collections = configured.collections
    ?.filter(({ slug }) => slug !== "addresses" || existingSlugs.has(slug))
    .map((collection) => {
      const labels = collectionLabels[collection.slug];
      const base = {
        ...collection,
        ...(labels ? { labels } : {}),
      };
      const next = catalogSlugs.has(collection.slug)
        ? { ...base, admin: { ...collection.admin, group: "Catálogo" } }
        : base;

      // Variant types and options also feed the cached catalog filters.
      const cacheSlugs = new Set(["products", "variants", "variantTypes", "variantOptions"]);

      if (!cacheSlugs.has(collection.slug)) {
        return next;
      }

      const withCacheHooks = {
        ...next,
        hooks: {
          ...collection.hooks,
          afterChange: [...(collection.hooks?.afterChange ?? []), () => revalidateCatalog()],
          afterDelete: [...(collection.hooks?.afterDelete ?? []), () => revalidateCatalog()],
        },
      };

      return collection.slug === "variants"
        ? {
            ...withCacheHooks,
            access: { ...collection.access, read: readPublishedVariants, readVersions: isAdmin },
          }
        : withCacheHooks;
    });
  const collectionSlugs = new Set(collections?.map(({ slug }) => slug));
  const schema = configured.typescript?.schema?.map((fn, index) => {
    if (index < existingSchemaFns.length) {
      return fn;
    }
    return ((args) => {
      const jsonSchema = fn(args);
      const collectionsSchema = jsonSchema?.properties?.ecommerce?.properties?.collections;
      if (collectionsSchema?.properties) {
        for (const key of Object.keys(collectionsSchema.properties)) {
          if (!collectionSlugs.has(key)) {
            delete collectionsSchema.properties[key];
          }
        }
        if (Array.isArray(collectionsSchema.required)) {
          collectionsSchema.required = collectionsSchema.required.filter((slug) =>
            collectionSlugs.has(slug),
          );
        }
      }
      return jsonSchema;
    }) as typeof fn;
  });

  return {
    ...configured,
    collections,
    typescript: configured.typescript
      ? { ...configured.typescript, schema }
      : configured.typescript,
  };
};
