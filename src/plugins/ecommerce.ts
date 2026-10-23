import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import type { EcommercePluginConfig } from "@payloadcms/plugin-ecommerce/types";
import type { Access, Plugin } from "payload";
import { hasAdminRole, isAdmin, isAdminField, isCustomer } from "@/access/roles";

const isAuthenticated: Access = ({ req }) => Boolean(req.user);

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
  products: true,
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
  const configured = await configureEcommerce(incomingConfig);

  return {
    ...configured,
    collections: configured.collections?.filter(
      ({ slug }) => slug !== "addresses" || existingSlugs.has(slug),
    ),
  };
};
