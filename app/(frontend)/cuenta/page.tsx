import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { formatCop } from "@/lib/format";
import { isOrderNumber } from "@/lib/orders/order-number";
import { isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { getPayloadClient } from "@/lib/payload";
import { getCustomerProfile } from "@/services/customers/profile";
import type { Order } from "../../../payload-types";
import { LogoutButton } from "../_components/logout-button";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccount } from "./delete-account";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta" };

type AccountPageProps = {
  searchParams: Promise<{ bienvenida?: string; pedido?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const customer = await getSessionCustomer();
  if (!customer) {
    redirect("/login?next=/cuenta");
  }

  const payload = await getPayloadClient();
  const profile = await getCustomerProfile(payload, customer);

  if (!profile) {
    redirect("/login");
  }

  const requestedOrderNumber = typeof params.pedido === "string" ? params.pedido.trim() : "";
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

  const lookedUpStatusLabel =
    lookedUpOrder && isOrderStatus(lookedUpOrder.status)
      ? ORDER_STATUS_LABELS[lookedUpOrder.status]
      : lookedUpOrder?.status;

  return (
    <main className="page account-page">
      <div className="page-intro">
        <p className="eyebrow">Cuenta</p>
        <h1>Mi cuenta</h1>
        <p className="section-subtitle">
          Hola, {profile.name}. Consulta y actualiza tus datos personales.
        </p>
      </div>

      {params.bienvenida === "1" ? (
        <p className="form-success account-welcome" role="status">
          Tu cuenta se creó con éxito. Te damos la bienvenida a Valdra Store.
        </p>
      ) : null}

      <div className="account-layout">
        <div className="account-main">
          <section className="account-card" aria-labelledby="account-data-title">
            <h2 id="account-data-title">Datos personales</h2>
            <ProfileForm profile={profile} />
          </section>

          <section className="account-card" aria-labelledby="account-orders-title">
            <h2 id="account-orders-title">Consultar pedido</h2>
            <p className="form-hint">
              Escribe el número de seis cifras que viste al crear el pedido para conocer su estado.
            </p>
            <form className="form" method="get" action="/cuenta">
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
                <p className="order-lookup-status">Estado: {lookedUpStatusLabel}</p>
                <p>
                  {lookedUpOrder.garmentLabel} · Talla {lookedUpOrder.size} · Color{" "}
                  {lookedUpOrder.colorLabel}
                </p>
                <p>
                  Cantidad: {lookedUpOrder.quantity} · Total: {formatCop(lookedUpOrder.total)}
                </p>
              </div>
            ) : null}
          </section>

          <section className="account-card" aria-labelledby="account-password-title">
            <h2 id="account-password-title">Cambiar contraseña</h2>
            <p className="form-hint">
              Usa una contraseña distinta de la actual. Tu sesión en este navegador seguirá abierta.
            </p>
            <ChangePasswordForm />
          </section>
        </div>

        <aside className="account-side" aria-label="Resumen de la cuenta">
          <div className="account-side-block">
            <p className="eyebrow">Sesión</p>
            <h2>Sesión activa</h2>
            <p>
              Usas esta cuenta en este navegador. Si cierras sesión, tus diseños aprobados siguen
              guardados.
            </p>
            <LogoutButton className="button button-secondary account-action" />
          </div>
          <div className="account-side-block">
            <p className="eyebrow">Privacidad</p>
            <h2>Tus datos</h2>
            <p>
              Puedes consultar cómo tratamos tus datos personales en los términos y condiciones.
            </p>
            <Link
              className="button button-secondary account-action"
              href="/terminos#datos-personales"
            >
              Leer términos
            </Link>
          </div>
        </aside>
      </div>

      <DeleteAccount />
    </main>
  );
}
