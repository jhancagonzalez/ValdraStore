import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { LogoutButton } from "../_components/logout-button";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const customer = await getSessionCustomer();
  if (!customer) {
    redirect("/login");
  }

  return (
    <main className="page page-narrow">
      <h1 className="section-title">Mi cuenta</h1>
      <p className="section-subtitle">Tu espacio personal en Valdra Store.</p>
      <section className="account-card">
        <div>
          <span className="detail-label">Nombre</span>
          <p>{customer.name}</p>
        </div>
        <div>
          <span className="detail-label">Correo electrónico</span>
          <p>{customer.email}</p>
        </div>
        <LogoutButton />
      </section>
    </main>
  );
}
