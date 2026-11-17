import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "../_components/auth-layout";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPasswordPage() {
  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva."
    >
      <RecoverForm />
      <p className="form-footer">
        <Link href="/login">Volver a iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
