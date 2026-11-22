import type { Access, CollectionConfig } from "payload";
import { hasAdminRole, isAdmin } from "@/access/roles";
import { MAX_ORDER_QUANTITY, MIN_ORDER_QUANTITY } from "@/lib/orders/pricing";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/orders/status";
import {
  applyStockChange,
  restoreStockOnDelete,
  setOrderData,
  updateOrderStatus,
} from "@/services/orders/order-hooks";

/** Un cliente con sesión o un administrador pueden crear pedidos (D-03). */
const canCreateOrder: Access = ({ req }) => {
  if (!req.user) {
    return false;
  }

  return hasAdminRole(req.user) || (req.user as { collection?: string }).collection === "customers";
};

/** El cliente ve solo sus pedidos; el administrador ve todos. */
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

const statusOptions = ORDER_STATUSES.map((value) => ({
  label: ORDER_STATUS_LABELS[value],
  value,
}));

/**
 * Pedido de una prenda personalizada (HU-18 a HU-25). No usa el checkout ni
 * los pagos del plugin: guarda la prenda, talla, color, diseño, cantidad,
 * precio y estado, con historial de estados y control de stock.
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    create: canCreateOrder,
    delete: isAdmin,
    read: isAdminOrOwner,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["orderNumber", "customer", "status", "quantity", "total", "createdAt"],
    description:
      "Pedidos de prendas personalizadas. El cliente, el precio y las instantáneas se fijan en servidor.",
    group: "Pedidos",
  },
  fields: [
    {
      name: "orderNumber",
      type: "text",
      admin: {
        description:
          "Se genera al crear el pedido. El cliente lo usa para consultar el estado en Mi cuenta.",
        position: "sidebar",
        readOnly: true,
      },
      label: "Número de pedido",
      unique: true,
    },
    {
      name: "customer",
      type: "relationship",
      admin: {
        description:
          "El cliente se toma de la sesión. Un administrador puede seleccionarlo al crear el pedido.",
        position: "sidebar",
      },
      index: true,
      relationTo: "customers",
      required: true,
    },
    {
      name: "design",
      type: "relationship",
      admin: {
        description: "Diseño aprobado que se va a producir. Debe pertenecer al cliente.",
      },
      index: true,
      relationTo: "approved-designs",
      required: true,
    },
    {
      name: "quantity",
      type: "number",
      admin: {
        description: `Cantidad de unidades entre ${MIN_ORDER_QUANTITY} y ${MAX_ORDER_QUANTITY}. Descuenta stock.`,
      },
      defaultValue: 1,
      max: MAX_ORDER_QUANTITY,
      min: MIN_ORDER_QUANTITY,
      required: true,
    },
    // Los campos calculados se completan en `setOrderData`. No se marcan
    // `required` porque la validación del panel los bloquearía vacíos antes
    // de enviar; el hook y las columnas NOT NULL siguen garantizando el dato.
    {
      name: "garmentBase",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "garmentLabel",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "category",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "colorLabel",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "size",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "unitPrice",
      type: "number",
      admin: { readOnly: true },
      min: 0,
    },
    {
      name: "total",
      type: "number",
      admin: { readOnly: true },
      min: 0,
    },
    {
      name: "status",
      type: "select",
      admin: {
        description: "Solo el administrador puede cambiarlo.",
        position: "sidebar",
      },
      defaultValue: "pendiente",
      index: true,
      options: statusOptions,
      required: true,
    },
    {
      name: "source",
      type: "select",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      options: [
        { label: "Cliente", value: "customer" },
        { label: "Administrador", value: "admin" },
      ],
    },
    {
      name: "createdBy",
      type: "relationship",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      relationTo: "admins",
    },
    {
      name: "stockRestored",
      type: "checkbox",
      admin: { hidden: true },
      defaultValue: false,
    },
    {
      name: "statusHistory",
      type: "array",
      access: {
        read: ({ req }) => hasAdminRole(req.user),
      },
      admin: {
        initCollapsed: true,
        readOnly: true,
      },
      fields: [
        {
          name: "fromStatus",
          type: "select",
          options: statusOptions,
          required: true,
        },
        {
          name: "toStatus",
          type: "select",
          options: statusOptions,
          required: true,
        },
        {
          name: "changedAt",
          type: "date",
          admin: {
            date: { pickerAppearance: "dayAndTime" },
            readOnly: true,
          },
          required: true,
        },
        {
          name: "changedBy",
          type: "relationship",
          admin: { readOnly: true },
          relationTo: "admins",
        },
        {
          name: "note",
          type: "textarea",
          admin: { readOnly: true },
        },
      ],
      labels: {
        plural: "Cambios de estado",
        singular: "Cambio de estado",
      },
    },
  ],
  hooks: {
    afterChange: [applyStockChange],
    afterDelete: [restoreStockOnDelete],
    beforeChange: [updateOrderStatus],
    beforeValidate: [setOrderData],
  },
  labels: {
    plural: "Pedidos",
    singular: "Pedido",
  },
};
