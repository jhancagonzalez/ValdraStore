import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { getPayloadClient } from "@/lib/payload";
import { getCustomerProfile } from "@/services/customers/profile";
import { LogoutButton } from "../_components/logout-button";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const customer = await getSessionCustomer();
  if (!customer) {
    redirect("/login");
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
      <section className="account-card">
        <ProfileForm profile={profile} />
        <LogoutButton />
      </section>
    </main>
  );
}
