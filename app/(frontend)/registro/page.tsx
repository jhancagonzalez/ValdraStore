import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  const customer = await getSessionCustomer();
  if (customer) {
    redirect("/cuenta");
  }

  return (
    <main className="page page-narrow">
      <h1 className="section-title">Crear cuenta</h1>
      <p className="section-subtitle">Regístrate para personalizar prendas y hacer pedidos.</p>
      <RegisterForm />
    </main>
  );
}
