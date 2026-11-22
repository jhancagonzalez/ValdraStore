"use client";

import { useId, useState } from "react";
import { formatCop } from "@/lib/format";
import { isOrderNumber } from "@/lib/orders/order-number";
import { calculateOrderTotal, getDesignPricing } from "@/lib/orders/pricing";
import { isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/orders/status";

type OrderPanelProps = {
  approvedDesignId: number;
  baseId: string;
};

type Confirmation = {
  orderNumber: string;
  quantity: number;
  status: string;
  total: number;
};

/** Crea el pedido a partir del diseño aprobado (HU-18). */
export const OrderPanel = ({ approvedDesignId, baseId }: OrderPanelProps) => {
  const quantityId = useId();
  const pricing = getDesignPricing(baseId);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  if (!pricing) {
    return (
      <p className="form-error" role="alert">
        No pudimos calcular el precio de esta prenda.
      </p>
    );
  }

  const unitPrice = pricing.unitPrice;
  const total = calculateOrderTotal(unitPrice, Number.isFinite(quantity) ? quantity : 0);
  const canSubmit = !pending && quantity >= 1 && quantity <= 10;

  const submit = async () => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: approvedDesignId, quantity }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: unknown;
        orderNumber?: unknown;
        quantity?: unknown;
        status?: unknown;
        total?: unknown;
      } | null;

      if (!response.ok || !isOrderNumber(data?.orderNumber)) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "No pudimos crear el pedido. Inténtalo de nuevo.",
        );
      }

      setConfirmation({
        orderNumber: data.orderNumber,
        quantity: typeof data.quantity === "number" ? data.quantity : quantity,
        status: typeof data.status === "string" ? data.status : "pendiente",
        total: typeof data.total === "number" ? data.total : total,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No pudimos crear el pedido. Inténtalo de nuevo.",
      );
    } finally {
      setPending(false);
    }
  };

  if (confirmation) {
    const statusLabel = isOrderStatus(confirmation.status)
      ? ORDER_STATUS_LABELS[confirmation.status]
      : confirmation.status;

    return (
      <div className="design-approval-note" role="status">
        <p className="design-approval-title">Pedido #{confirmation.orderNumber} creado</p>
        <p>
          Estado: {statusLabel}. Cantidad: {confirmation.quantity}. Total:{" "}
          {formatCop(confirmation.total)}. Guarda este número y consulta el estado en{" "}
          <a href={`/pedidos?pedido=${confirmation.orderNumber}`}>Mis pedidos</a>.
        </p>
      </div>
    );
  }

  return (
    <section className="order-panel" aria-labelledby={`${quantityId}-title`}>
      <h3 id={`${quantityId}-title`}>Crear pedido</h3>
      <p>
        Precio de la prenda: {formatCop(unitPrice)}. Elige la cantidad; el stock se descuenta al
        crear el pedido.
      </p>
      <div className="order-panel-row">
        <div className="order-panel-field">
          <label htmlFor={quantityId}>Cantidad</label>
          <input
            id={quantityId}
            type="number"
            min={1}
            max={10}
            step={1}
            value={quantity}
            disabled={pending}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </div>
        <p className="order-panel-total">Total: {formatCop(total)}</p>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="button button-primary"
        disabled={!canSubmit}
        aria-busy={pending}
        onClick={() => {
          void submit();
        }}
      >
        {pending ? "Creando pedido…" : "Crear pedido"}
      </button>
    </section>
  );
};
