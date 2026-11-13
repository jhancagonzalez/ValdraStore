import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

const safeNext = (value: string | undefined): string | undefined => {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return undefined;
  }
  return value;
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  const customer = await getSessionCustomer();
  if (customer) {
    redirect(next ?? "/cuenta");
  }

  return (
    <main className="page page-narrow">
      <h1 className="section-title">Crear cuenta</h1>
      <p className="section-subtitle">Regístrate para personalizar prendas y hacer pedidos.</p>
      <RegisterForm next={next} />
    </main>
  );
}
