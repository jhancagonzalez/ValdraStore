import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCustomer } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const customer = await getSessionCustomer();
  if (customer) {
    redirect("/cuenta");
  }

  return (
    <main className="page page-narrow">
      <h1 className="section-title">Iniciar sesión</h1>
      <p className="section-subtitle">Ingresa con el correo y la contraseña de tu cuenta.</p>
      <LoginForm />
      <p className="form-footer">
        ¿No tienes cuenta? <Link href="/registro">Crea una aquí</Link>
      </p>
    </main>
  );
}
