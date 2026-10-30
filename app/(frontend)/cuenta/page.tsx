import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import { getCustomerProfile } from "@/services/customers/profile";
import { LogoutButton } from "../_components/logout-button";
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
    <main className="page page-narrow">
      <h1 className="section-title">Mi cuenta</h1>
      <p className="section-subtitle">Consulta y actualiza tus datos personales.</p>
      {params.bienvenida === "1" ? (
        <p className="form-success account-welcome" role="status">
          Tu cuenta se creó con éxito. Te damos la bienvenida a Valdra Store.
        </p>
      ) : null}
      <section className="account-card">
        <ProfileForm profile={profile} />
        <LogoutButton className="button button-secondary account-action" />
        <DeleteAccount />
      </section>
    </main>
  );
}
