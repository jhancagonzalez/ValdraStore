import type { CollectionConfig } from "payload";
import { isAdmin } from "@/access/roles";
import { prepareStockRow } from "@/services/orders/order-hooks";

/**
 * Inventario por prenda base y talla (D-19). El pedido usa la prenda del
 * diseño aprobado, no un producto del catálogo, así que el stock se guarda por
 * la clave estable `baseId|talla` (por ejemplo `camisetas-black|M`).
 */
export const GarmentStock: CollectionConfig = {
  slug: "garment-stock",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["baseId", "size", "quantity", "active"],
    description:
      "Stock disponible por prenda base y talla. Se descuenta al crear un pedido y se devuelve al cancelarlo.",
    group: "Pedidos",
    useAsTitle: "key",
  },
  fields: [
    {
      name: "key",
      type: "text",
      admin: { readOnly: true },
      required: true,
      unique: true,
    },
    {
      name: "baseId",
      type: "text",
      admin: {
        description: "ID de la prenda base, por ejemplo `camisetas-black` o `hoodies-blue`.",
      },
      required: true,
    },
    {
      name: "label",
      type: "text",
      admin: { readOnly: true },
      required: true,
    },
    {
      name: "size",
      type: "text",
      admin: { description: "S, M, L o XL." },
      required: true,
    },
    {
      name: "quantity",
      type: "number",
      defaultValue: 0,
      min: 0,
      required: true,
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  hooks: {
    beforeValidate: [prepareStockRow],
  },
  labels: {
    plural: "Inventario",
    singular: "Registro de inventario",
  },
};
