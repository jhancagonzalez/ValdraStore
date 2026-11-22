import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { formatCop } from "@/lib/format";
import { isOrderNumber } from "@/lib/orders/order-number";
import { isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { getPayloadClient } from "@/lib/payload";
import type { Order } from "../../../payload-types";

export const metadata: Metadata = { title: "Pedidos" };

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

const formatOrderDate = (value: string): string => dateFormatter.format(new Date(value));

const statusLabel = (status: string): string =>
  isOrderStatus(status) ? ORDER_STATUS_LABELS[status] : status;

type OrdersPageProps = {
  searchParams: Promise<{ pedido?: string }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const requestedOrderNumber = typeof params.pedido === "string" ? params.pedido.trim() : "";
  const customer = await getSessionCustomer();

  if (!customer) {
    const nextPath = requestedOrderNumber
      ? `/pedidos?pedido=${encodeURIComponent(requestedOrderNumber)}`
      : "/pedidos";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const payload = await getPayloadClient();
  let lookupError: string | null = null;
  let lookedUpOrder: Order | null = null;

  if (requestedOrderNumber) {
    if (!isOrderNumber(requestedOrderNumber)) {
      lookupError = "Escribe un número de pedido de seis cifras.";
    } else {
      const result = await payload.find({
        collection: "orders",
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        user: customer,
        where: {
          customer: { equals: customer.id },
          orderNumber: { equals: requestedOrderNumber },
        },
      });

      lookedUpOrder = result.docs[0] ?? null;

      if (!lookedUpOrder) {
        lookupError = "No encontramos un pedido con ese número en tu cuenta.";
      }
    }
  }

  const orders = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: "-createdAt",
    user: customer,
    where: { customer: { equals: customer.id } },
  });
  const listedOrders = orders.docs.filter((order) => isOrderNumber(order.orderNumber));

  return (
    <main className="page orders-page">
      <div className="page-intro">
        <p className="eyebrow">Pedidos</p>
        <h1>Mis pedidos</h1>
        <p className="section-subtitle">
          Consulta el estado de tus pedidos y revisa los detalles de cada uno.
        </p>
      </div>

      <section className="orders-card" aria-labelledby="orders-lookup-title">
        <h2 id="orders-lookup-title">Consultar por número</h2>
        <p className="form-hint">Escribe el número de seis cifras que viste al crear el pedido.</p>
        <form className="form" method="get" action="/pedidos">
          <div className="form-field">
            <label htmlFor="order-number">Número de pedido</label>
            <input
              id="order-number"
              name="pedido"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="123456"
              defaultValue={requestedOrderNumber}
              aria-invalid={Boolean(lookupError)}
              aria-describedby={
                lookupError ? "order-number-hint order-number-error" : "order-number-hint"
              }
            />
            <p className="form-hint" id="order-number-hint">
              Solo puedes consultar los pedidos de tu cuenta.
            </p>
          </div>
          <button type="submit" className="button button-secondary">
            Consultar
          </button>
        </form>

        {lookupError ? (
          <p className="form-error" id="order-number-error" role="alert">
            {lookupError}
          </p>
        ) : null}

        {lookedUpOrder ? (
          <div className="order-lookup-result" role="status">
            <p className="order-lookup-number">
              Pedido #{lookedUpOrder.orderNumber ?? requestedOrderNumber}
            </p>
            <p className="order-lookup-status">Estado: {statusLabel(lookedUpOrder.status)}</p>
            <p>
              {lookedUpOrder.garmentLabel} · Talla {lookedUpOrder.size} · Color{" "}
              {lookedUpOrder.colorLabel}
            </p>
            <p>
              Cantidad: {lookedUpOrder.quantity} · Total: {formatCop(lookedUpOrder.total)}
            </p>
            <p>Fecha: {formatOrderDate(lookedUpOrder.createdAt)}</p>
            <Link href="/pedidos">Ver todos mis pedidos</Link>
          </div>
        ) : null}
      </section>

      {lookedUpOrder ? null : (
        <section className="orders-card" aria-labelledby="orders-list-title">
          <h2 id="orders-list-title">Todos tus pedidos</h2>
          {listedOrders.length ? (
            <ul className="orders-list">
              {listedOrders.map((order) => (
                <li key={order.id}>
                  <Link className="order-card" href={`/pedidos?pedido=${order.orderNumber ?? ""}`}>
                    <span className="order-card-number">Pedido #{order.orderNumber}</span>
                    <span className="order-card-meta">
                      {order.garmentLabel} · Talla {order.size}
                    </span>
                    <span className="order-card-meta">
                      {formatOrderDate(order.createdAt)} · {statusLabel(order.status)}
                    </span>
                    <span className="order-card-total">{formatCop(order.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="form-hint">
              Aún no tienes pedidos.{" "}
              <Link href="/personalizar">Crea tu primera prenda personalizada.</Link>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
