import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "../_components/auth-layout";
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
      <AuthLayout title="Nueva contraseña" subtitle="Este enlace ya no está disponible.">
        <p className="state-message" role="status">
          Este enlace no es válido. Solicita uno nuevo desde{" "}
          <Link href="/recuperar">recuperar contraseña</Link>.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña de al menos 8 caracteres. El enlace solo puede usarse una vez."
    >
      <ResetPasswordForm token={cleanToken} />
    </AuthLayout>
  );
}
