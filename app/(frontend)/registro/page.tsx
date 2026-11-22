import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next";
import { AuthLayout } from "../_components/auth-layout";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const customer = await getSessionCustomer();
  if (customer) {
    redirect(next ?? "/cuenta");
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate para personalizar prendas y guardar los diseños que apruebes."
    >
      <RegisterForm next={next} />
    </AuthLayout>
  );
}
