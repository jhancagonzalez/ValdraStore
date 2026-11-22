import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from "payload";
import { APIError } from "payload";
import { hasAdminRole } from "@/access/roles";
import { getMockupBase, getMockupBaseName, isMockupSize } from "@/lib/mockup-bases";
import { calculateOrderTotal, getDesignPricing, isOrderQuantity } from "@/lib/orders/pricing";
import { canTransitionOrderStatus, isOrderStatus } from "@/lib/orders/status";
import { getStockKey, hasEnoughStock } from "@/lib/orders/stock";
import { generateOrderNumber } from "@/services/orders/order-number";

type Row = Record<string, unknown>;

const relationID = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "number" ? id : null;
  }

  return null;
};

const IMMUTABLE_FIELDS = [
  "orderNumber",
  "customer",
  "design",
  "quantity",
  "garmentBase",
  "garmentLabel",
  "category",
  "colorLabel",
  "size",
  "unitPrice",
  "total",
  "source",
  "createdBy",
] as const;

const RELATION_FIELDS = new Set(["customer", "design", "createdBy"]);

const changedValue = (key: string, next: unknown, previous: unknown): boolean => {
  if (next === undefined) {
    return false;
  }

  if (RELATION_FIELDS.has(key)) {
    return relationID(next) !== relationID(previous);
  }

  if (typeof next === "number" || typeof previous === "number") {
    return Number(next) !== Number(previous);
  }

  return next !== previous;
};

const stockKeyFromDoc = (doc: Row): string => {
  const garmentBase = doc.garmentBase;
  const size = typeof doc.size === "string" ? doc.size : null;

  if (typeof garmentBase !== "string" || !isMockupSize(size)) {
    throw new APIError("El pedido no tiene una prenda o talla válida.", 500);
  }

  return getStockKey(garmentBase, size);
};

const findStock = async (req: PayloadRequest, key: string) => {
  const result = await req.payload.find({
    collection: "garment-stock",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { key: { equals: key } },
  });

  return result.docs[0] ?? null;
};

/**
 * Genera un número de seis cifras libre. `ponytail:` la comprobación y la
 * inserción no son atómicas; el índice único es la garantía final y, si dos
 * pedidos simultáneos chocan, el cliente puede reintentar.
 */
const generateUniqueOrderNumber = async (req: PayloadRequest): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderNumber();
    const { totalDocs } = await req.payload.count({
      collection: "orders",
      overrideAccess: true,
      req,
      where: { orderNumber: { equals: candidate } },
    });

    if (totalDocs === 0) {
      return candidate;
    }
  }

  throw new APIError("No pudimos asignar un número de pedido. Inténtalo de nuevo.", 500);
};

const adjustStock = async (req: PayloadRequest, key: string, delta: number): Promise<void> => {
  const stock = await findStock(req, key);

  if (!stock) {
    throw new APIError(`No existe inventario para ${key}.`, 409);
  }

  const current = Number(stock.quantity ?? 0);
  const next = current + delta;

  if (!Number.isFinite(next) || next < 0) {
    throw new APIError("No hay stock suficiente para completar el pedido.", 409);
  }

  await req.payload.update({
    collection: "garment-stock",
    id: stock.id,
    data: { quantity: next },
    overrideAccess: true,
    req,
  });
};

/**
 * Completa el pedido en servidor: cliente, diseño, instantáneas, precio y
 * estado inicial. Un cliente no puede fijar el cliente ni el precio; un
 * administrador sí elige el cliente, pero el diseño debe ser suyo.
 */
export const setOrderData: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== "create" || !data) {
    return data;
  }

  const input = data as Row;
  const isAdminUser = hasAdminRole(req.user);
  const isCustomerUser = req.user?.collection === "customers";

  if (!isAdminUser && !isCustomerUser) {
    throw new APIError("Inicia sesión para crear un pedido.", 401);
  }

  const designId = relationID(input.design);

  if (!designId) {
    throw new APIError("Selecciona un diseño aprobado.", 400);
  }

  const design = await req.payload.findByID({
    collection: "approved-designs",
    id: designId,
    depth: 0,
    overrideAccess: true,
    req,
  });

  const customerId = isAdminUser ? relationID(input.customer) : relationID(req.user);

  if (!customerId) {
    throw new APIError("Selecciona el cliente del pedido.", 400);
  }

  if (relationID(design.customer) !== customerId) {
    throw new APIError("El diseño seleccionado no pertenece al cliente.", 400);
  }

  const size = design.size;

  if (!isMockupSize(size)) {
    throw new APIError("El diseño no tiene una talla válida.", 400);
  }

  const pricing = getDesignPricing(design.garment);

  if (!pricing) {
    throw new APIError("La prenda del diseño no tiene un precio configurado.", 400);
  }

  const quantity = Number(input.quantity ?? 1);

  if (!isOrderQuantity(quantity)) {
    throw new APIError("La cantidad debe ser un entero entre 1 y 10.", 400);
  }

  const stockKey = getStockKey(pricing.base.id, size);
  const stock = await findStock(req, stockKey);

  if (stock?.active !== true || !hasEnoughStock(stock?.quantity, quantity)) {
    throw new APIError("No hay stock suficiente para esa prenda y talla.", 409);
  }

  const orderNumber = await generateUniqueOrderNumber(req);

  return {
    ...input,
    category: pricing.base.categoryLabel,
    colorLabel: pricing.base.colorLabel,
    createdBy: isAdminUser ? relationID(req.user) : null,
    customer: customerId,
    design: designId,
    garmentBase: pricing.base.id,
    garmentLabel: getMockupBaseName(pricing.base),
    orderNumber,
    quantity,
    size,
    source: isAdminUser ? "admin" : "customer",
    status: "pendiente",
    statusHistory: [],
    stockRestored: false,
    total: calculateOrderTotal(pricing.unitPrice, quantity),
    unitPrice: pricing.unitPrice,
  };
};

/**
 * Un pedido creado solo puede cambiar de estado. Cada transición se valida y
 * se agrega al historial con el administrador que la hizo.
 */
export const updateOrderStatus: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== "update" || !originalDoc || !data) {
    return data;
  }

  const input = data as Row;
  const previous = originalDoc as Row;

  for (const key of IMMUTABLE_FIELDS) {
    if (changedValue(key, input[key], previous[key])) {
      throw new APIError("Solo se puede cambiar el estado del pedido.", 400);
    }
  }

  if (input.status === undefined || input.status === previous.status) {
    return input;
  }

  if (!isOrderStatus(input.status) || !isOrderStatus(previous.status)) {
    throw new APIError("El estado del pedido no es válido.", 400);
  }

  if (!canTransitionOrderStatus(previous.status, input.status)) {
    throw new APIError(`No se puede pasar de ${previous.status} a ${input.status}.`, 400);
  }

  const history = Array.isArray(previous.statusHistory) ? previous.statusHistory : [];

  return {
    ...input,
    statusHistory: [
      ...history,
      {
        changedAt: new Date().toISOString(),
        changedBy: relationID(req.user),
        fromStatus: previous.status,
        toStatus: input.status,
      },
    ],
    stockRestored: input.status === "cancelada" ? true : Boolean(previous.stockRestored),
  };
};

/**
 * Descuenta stock al crear y lo devuelve al cancelar. `ponytail:` la
 * comprobación y el descuento no son atómicos; en el prototipo dos pedidos
 * simultáneos podrían competir por la última unidad. Se resuelve con una
 * transacción/row lock cuando el volumen lo justifique.
 */
export const applyStockChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const order = doc as Row;

  if (operation === "create") {
    await adjustStock(req, stockKeyFromDoc(order), -Number(order.quantity ?? 0));
    return doc;
  }

  const previousStatus = (previousDoc as Row | undefined)?.status;

  if (
    operation === "update" &&
    previousStatus !== "cancelada" &&
    order.status === "cancelada" &&
    order.stockRestored === true
  ) {
    await adjustStock(req, stockKeyFromDoc(order), Number(order.quantity ?? 0));
  }

  return doc;
};

/** Si se elimina un pedido no cancelado, devuelve sus unidades al stock. */
export const restoreStockOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const order = doc as Row;

  if (order.stockRestored !== true) {
    await adjustStock(req, stockKeyFromDoc(order), Number(order.quantity ?? 0));
  }

  return doc;
};

/** Normaliza la fila de inventario: clave, etiqueta, prenda y talla válidas. */
export const prepareStockRow: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const merged = { ...(originalDoc ?? {}), ...(data ?? {}) } as Row;
  const baseId = typeof merged.baseId === "string" ? merged.baseId.trim() : "";
  const base = getMockupBase(baseId);

  if (!base) {
    throw new APIError("La prenda base no existe.", 400);
  }

  const size = typeof merged.size === "string" ? merged.size : null;

  if (!isMockupSize(size)) {
    throw new APIError("La talla debe ser S, M, L o XL.", 400);
  }

  return {
    ...merged,
    baseId: base.id,
    key: getStockKey(base.id, size),
    label: getMockupBaseName(base),
    size,
  };
};
