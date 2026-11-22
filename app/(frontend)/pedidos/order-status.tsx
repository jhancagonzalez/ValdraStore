import { isOrderStatus, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";

const STATUS_GLYPHS: Record<OrderStatus, string> = {
  pendiente: "○",
  en_produccion: "◐",
  lista: "✓",
  entregada: "✓",
  cancelada: "✕",
};

type OrderStatusBadgeProps = {
  status: string;
};

/**
 * Estado del pedido como etiqueta legible: siempre muestra el texto, de modo
 * que el color y el glifo son refuerzos y no el único indicador.
 */
export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const known = isOrderStatus(status);

  return (
    <span className="order-status-badge" data-status={known ? status : "desconocido"}>
      <span className="order-status-badge-glyph" aria-hidden="true">
        {known ? STATUS_GLYPHS[status] : "•"}
      </span>
      {known ? ORDER_STATUS_LABELS[status] : status}
    </span>
  );
};

const ORDER_FLOW: readonly OrderStatus[] = ["pendiente", "en_produccion", "lista", "entregada"];

const STEP_STATE_LABELS = {
  complete: "Completado: ",
  current: "Paso actual: ",
  upcoming: "Pendiente: ",
} as const;

type StepState = keyof typeof STEP_STATE_LABELS;

const stepState = (index: number, currentIndex: number): StepState => {
  if (index < currentIndex) {
    return "complete";
  }

  return index === currentIndex ? "current" : "upcoming";
};

type OrderProgressProps = {
  status: OrderStatus;
};

/**
 * Avance estático del pedido según su estado actual. No expone el historial ni
 * muestra la hora del último cambio, así que no promete seguimiento en vivo.
 */
export const OrderProgress = ({ status }: OrderProgressProps) => {
  if (status === "cancelada") {
    return (
      <div className="order-progress is-cancelled">
        <p className="order-progress-title">
          <span aria-hidden="true">✕ </span>
          Pedido cancelado
        </p>
        <p className="order-progress-note">Este pedido se canceló y no continúa en producción.</p>
      </div>
    );
  }

  const currentIndex = ORDER_FLOW.indexOf(status);

  return (
    <div className="order-progress">
      <p className="order-progress-title">Avance del pedido</p>
      <ol className="order-progress-steps">
        {ORDER_FLOW.map((step, index) => {
          const state = stepState(index, currentIndex);

          return (
            <li
              key={step}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="order-progress-marker" aria-hidden="true">
                {state === "complete" ? "✓" : index + 1}
              </span>
              <span className="order-progress-label">
                <span className="sr-only">{STEP_STATE_LABELS[state]}</span>
                {ORDER_STATUS_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="order-progress-note">
        Este avance refleja el último estado registrado por el equipo.
      </p>
    </div>
  );
};
