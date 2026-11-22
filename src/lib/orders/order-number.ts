/** Número de pedido visible: seis cifras, sin ceros a la izquierda. */
export const ORDER_NUMBER_PATTERN = /^[1-9]\d{5}$/;

export const isOrderNumber = (value: unknown): value is string =>
  typeof value === "string" && ORDER_NUMBER_PATTERN.test(value);
