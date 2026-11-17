import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  subtitle: string;
  title: string;
};

/**
 * Marco compartido por el acceso y la recuperación de cuenta. Sin tarjeta
 * lateral: el formulario es el único protagonista de la página.
 */
export const AuthLayout = ({ children, subtitle, title }: AuthLayoutProps) => (
  <main className="page auth-page">
    <section className="auth-panel" aria-labelledby="auth-title">
      <h1 id="auth-title">{title}</h1>
      <p className="section-subtitle">{subtitle}</p>
      {children}
    </section>
  </main>
);
