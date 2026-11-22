/** Estados posibles de un pedido (D-05). */
export const ORDER_STATUSES = [
  "pendiente",
  "en_produccion",
  "lista",
  "entregada",
  "cancelada",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_produccion: "En producción",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

/** Transiciones permitidas; el administrador solo puede avanzar o cancelar. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pendiente: ["en_produccion", "cancelada"],
  en_produccion: ["lista", "cancelada"],
  lista: ["entregada"],
  entregada: [],
  cancelada: [],
};

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);

export const canTransitionOrderStatus = (from: OrderStatus, to: OrderStatus): boolean =>
  ORDER_STATUS_TRANSITIONS[from].includes(to);
