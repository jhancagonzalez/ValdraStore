import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { AuthLayout } from "../_components/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const safeNext = (value: string | undefined): string | undefined => {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return undefined;
  }
  return value;
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  const customer = await getSessionCustomer();
  if (customer) {
    redirect(next ?? "/cuenta");
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Ingresa con el correo y la contraseña de tu cuenta."
    >
      <LoginForm next={next} />
      <p className="form-footer">
        <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="form-footer">
        ¿No tienes cuenta?{" "}
        <Link href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}>
          Crea una aquí
        </Link>
      </p>
    </AuthLayout>
  );
}
