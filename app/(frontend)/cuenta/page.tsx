import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import { getCustomerProfile } from "@/services/customers/profile";
import { LogoutButton } from "../_components/logout-button";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccount } from "./delete-account";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta" };

type AccountPageProps = {
  searchParams: Promise<{ bienvenida?: string }>;
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
