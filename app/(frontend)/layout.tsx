import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import logoValdra from "@/assets/logo_valdra.png";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "./_components/logout-button";
import { RouteProgress } from "./_components/route-progress";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Valdra Store",
    template: "%s — Valdra Store",
  },
  description: "Personaliza y gestiona prendas con inteligencia artificial.",
};

const FrontendLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getSessionUser();
  const isCustomer = user?.collection === "customers";

  return (
    <html lang="es" className={spaceGrotesk.variable}>
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Valdra Store, inicio">
            <Image src={logoValdra} alt="" height={40} />
            <span className="brand-name">Valdra Store</span>
          </Link>
          <nav className="site-nav" aria-label="Principal">
            <Link href="/catalogo">Catálogo</Link>
            {user?.collection === "admins" ? (
              <>
                <Link href="/admin">Panel</Link>
                <LogoutButton endpoint="/api/admins/logout" />
              </>
            ) : null}
            {isCustomer ? (
              <>
                <Link href="/cuenta">Mi cuenta</Link>
                <LogoutButton />
              </>
            ) : user?.collection === "admins" ? null : (
              <>
                <Link href="/login">Iniciar sesión</Link>
                <Link href="/registro" className="nav-cta">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </header>
        <div id="contenido" tabIndex={-1}>
          {children}
        </div>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="footer-brand">
              <span className="footer-wordmark">Valdra Store</span>
              <p className="footer-note">Prendas personalizables, hechas a tu medida.</p>
            </div>
            <nav className="footer-nav" aria-label="Enlaces del pie de página">
              <Link href="/catalogo">Catálogo</Link>
              <Link href="/cuenta">Mi cuenta</Link>
              <Link href="/terminos">Términos y condiciones</Link>
            </nav>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/valdra.store"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </div>
          </div>
          <div className="footer-legal">
            <span>© {new Date().getFullYear()} Valdra Store</span>
            <span>Prototipo académico</span>
          </div>
        </footer>
      </body>
    </html>
  );
};

export default FrontendLayout;
