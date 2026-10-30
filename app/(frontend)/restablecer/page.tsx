import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const cleanToken = typeof token === "string" ? token.trim() : "";

  if (!cleanToken) {
    return (
      <main className="page page-narrow">
        <h1 className="section-title">Nueva contraseña</h1>
        <p className="state-message">
          Este enlace no es válido. Solicita uno nuevo desde{" "}
          <Link href="/recuperar">recuperar contraseña</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="page page-narrow">
      <h1 className="section-title">Nueva contraseña</h1>
      <p className="section-subtitle">
        Elige una contraseña de al menos 8 caracteres. El enlace solo puede usarse una vez.
      </p>
      <ResetPasswordForm token={cleanToken} />
    </main>
  );
}
