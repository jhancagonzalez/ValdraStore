import type { Metadata } from "next";
import Link from "next/link";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPasswordPage() {
  return (
    <main className="page page-narrow">
      <h1 className="section-title">Recuperar contraseña</h1>
      <p className="section-subtitle">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
      </p>
      <RecoverForm />
      <p className="form-footer">
        <Link href="/login">Volver a iniciar sesión</Link>
      </p>
    </main>
  );
}
