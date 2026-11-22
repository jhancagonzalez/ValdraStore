import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/contact";
import { formatCop } from "@/lib/format";
import { isOrderNumber } from "@/lib/orders/order-number";
import { canTransitionOrderStatus, isOrderStatus, type OrderStatus } from "@/lib/orders/status";
import { getPayloadClient } from "@/lib/payload";
import type { Order } from "../../../payload-types";
import { CancelOrderButton } from "./cancel-order-button";
import { OrderProgress, OrderStatusBadge } from "./order-status";

export const metadata: Metadata = { title: "Pedidos" };

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

const formatOrderDate = (value: string): string => dateFormatter.format(new Date(value));

const formatQuantity = (quantity: number): string =>
  `${quantity} ${quantity === 1 ? "unidad" : "unidades"}`;

const formatTotal = (total: Order["total"]): string => formatCop(total) ?? "—";

const garmentSummary = (order: Order): string => {
  const parts = [order.garmentLabel ?? "Prenda personalizada"];

  if (order.size) {
    parts.push(`Talla ${order.size}`);
  }

  if (order.colorLabel) {
    parts.push(order.colorLabel);
  }

  return parts.join(" · ");
};

/** Cierre del pedido cuando ya no admite cancelación desde la cuenta. */
const closedOrderMessage = (status: OrderStatus) => {
  if (status === "lista") {
    return (
      <>
        Este pedido ya está listo y no se puede cancelar desde la cuenta. Escríbenos a{" "}
        <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>.
      </>
    );
  }

  if (status === "cancelada") {
    return (
      <>
        Este pedido está cancelado. Si necesitas ayuda, escríbenos a{" "}
        <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>.
      </>
    );
  }

  return (
    <>
      Este pedido ya fue entregado. Si necesitas ayuda, escríbenos a{" "}
      <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>.
    </>
  );
};

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
      lookupError =
        "Escribe el número completo de 6 dígitos, sin espacios ni ceros al inicio. Lo viste al confirmar tu pedido.";
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
        lookupError =
          "No encontramos ese número en tu cuenta. Revisa el número de tu confirmación o consulta la lista de abajo.";
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
  const lookedUpNumber = lookedUpOrder?.orderNumber ?? requestedOrderNumber;
  const canCancel =
    lookedUpOrder !== null &&
    isOrderStatus(lookedUpOrder.status) &&
    canTransitionOrderStatus(lookedUpOrder.status, "cancelada");

  return (
    <main className="page orders-page">
      <div className="page-intro">
        <p className="eyebrow">Pedidos</p>
        <h1>Mis pedidos</h1>
        <p className="section-subtitle">
          Consulta el estado de tus pedidos y revisa los detalles de cada uno.
        </p>
      </div>

      <section className="orders-card orders-lookup" aria-labelledby="orders-lookup-title">
        <div className="orders-card-heading">
          <h2 id="orders-lookup-title">Consultar por número</h2>
          <p className="form-hint">Solo aparecen los pedidos de tu cuenta.</p>
        </div>
        <form className="orders-lookup-form" method="get" action="/pedidos#pedido">
          <div className="form-field">
            <label htmlFor="order-number">Número de pedido</label>
            <div className="orders-lookup-row">
              <input
                id="order-number"
                name="pedido"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="123456"
                defaultValue={requestedOrderNumber}
                aria-invalid={Boolean(lookupError)}
                aria-describedby={
                  lookupError ? "order-number-hint order-number-error" : "order-number-hint"
                }
              />
              <button type="submit" className="button button-primary">
                Consultar pedido
              </button>
            </div>
          </div>
        </form>
        <p className="form-hint" id="order-number-hint">
          Son los 6 dígitos que viste al confirmar el pedido, por ejemplo 123456.
        </p>
        {lookupError ? (
          <p className="form-error" id="order-number-error" role="alert">
            {lookupError}
          </p>
        ) : null}
      </section>

      {lookedUpOrder ? (
        <section
          className="orders-card order-detail"
          id="pedido"
          aria-labelledby="order-detail-title"
        >
          <div className="order-detail-head">
            <div className="order-detail-id">
              <p className="eyebrow">Pedido</p>
              <h2 className="order-detail-number" id="order-detail-title">
                <span className="sr-only">Pedido </span>#{lookedUpNumber}
              </h2>
              <p className="order-detail-date">
                Creado el {formatOrderDate(lookedUpOrder.createdAt)}
              </p>
            </div>
            <OrderStatusBadge status={lookedUpOrder.status} />
          </div>

          <OrderProgress status={lookedUpOrder.status} />

          {lookedUpOrder.status === "en_produccion" ? (
            <div className="order-callout" role="note">
              <h3 className="order-callout-title">Estamos trabajando en tu prenda</h3>
              <p>
                El equipo se conectará contigo por tu correo electrónico y te enviará la información
                de cuándo tu prenda esté lista.
              </p>
            </div>
          ) : null}

          <dl className="order-detail-grid">
            <div>
              <dt>Prenda</dt>
              <dd>{lookedUpOrder.garmentLabel ?? "Prenda personalizada"}</dd>
            </div>
            <div>
              <dt>Talla</dt>
              <dd>{lookedUpOrder.size ?? "—"}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{lookedUpOrder.colorLabel ?? "—"}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{formatQuantity(lookedUpOrder.quantity)}</dd>
            </div>
            <div className="order-detail-total">
              <dt>Total</dt>
              <dd>{formatTotal(lookedUpOrder.total)}</dd>
            </div>
          </dl>

          <div className="order-detail-actions">
            {canCancel ? (
              <CancelOrderButton orderNumber={lookedUpNumber} />
            ) : (
              <p className="order-detail-note">{closedOrderMessage(lookedUpOrder.status)}</p>
            )}
            <Link className="button button-secondary" href="/pedidos">
              Ver todos mis pedidos
            </Link>
          </div>
        </section>
      ) : (
        <section className="orders-card" aria-labelledby="orders-list-title">
          <div className="orders-card-heading">
            <h2 id="orders-list-title">Todos tus pedidos</h2>
            {listedOrders.length ? (
              <p className="orders-count">
                {listedOrders.length} {listedOrders.length === 1 ? "pedido" : "pedidos"}
              </p>
            ) : null}
          </div>
          {listedOrders.length ? (
            <ul className="orders-list">
              {listedOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    className="order-card"
                    href={`/pedidos?pedido=${encodeURIComponent(order.orderNumber ?? "")}#pedido`}
                  >
                    <span className="order-card-head">
                      <span className="order-card-number">Pedido #{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </span>
                    <span className="order-card-product">{garmentSummary(order)}</span>
                    <span className="order-card-footer">
                      <span className="order-card-meta">
                        {formatOrderDate(order.createdAt)} · {formatQuantity(order.quantity)}
                      </span>
                      <span className="order-card-sum">
                        <span className="order-card-total">{formatTotal(order.total)}</span>
                        <span className="order-card-arrow" aria-hidden="true">
                          →
                        </span>
                      </span>
                    </span>
                    <span className="sr-only">Ver detalle del pedido</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="orders-empty">
              <p className="orders-empty-title">Todavía no tienes pedidos</p>
              <p className="form-hint">
                Cuando personalices una prenda y confirmes el pedido, aparecerá aquí con su número y
                estado.
              </p>
              <Link className="button button-primary" href="/personalizar">
                Crear mi primera prenda
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
