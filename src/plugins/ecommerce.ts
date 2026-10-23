import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import type { EcommercePluginConfig } from "@payloadcms/plugin-ecommerce/types";
import type { Access } from "payload";
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
export const ecommercePluginForCatalog = ecommercePlugin(ecommerceConfig);
