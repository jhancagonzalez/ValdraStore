import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { BottomNav } from "./_components/bottom-nav";
import { RouteProgress } from "./_components/route-progress";
import { SiteHeader } from "./_components/site-header";
import { ToastProvider } from "./_components/toast";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  display: "swap",
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
  const isAdmin = user?.collection === "admins";

  return (
    <html lang="es" className={spaceGrotesk.variable}>
      <body>
        <ToastProvider>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <a className="skip-link" href="#contenido">
            Saltar al contenido
          </a>
          <SiteHeader isAdmin={isAdmin} isCustomer={isCustomer} />
          <div id="contenido" tabIndex={-1}>
            {children}
          </div>
          <footer className="site-footer">
            <div className="site-footer-inner">
              <div className="footer-brand">
                <p className="footer-eyebrow">Estudio de prendas personalizables</p>
                <p className="footer-wordmark">Valdra Store</p>
                <p className="footer-note">
                  Catálogo, personalización con IA y diseños aprobados en un mismo lugar.
                </p>
              </div>
              <nav className="footer-nav" aria-label="Explorar">
                <span className="footer-nav-title">Explorar</span>
                <Link href="/catalogo">Catálogo</Link>
                <Link href="/personalizar">Personalizador</Link>
                <Link href="/catalogo?category=camisetas">Camisetas</Link>
                <Link href="/catalogo?category=hoodies">Hoodies</Link>
              </nav>
              <nav className="footer-nav" aria-label="Cuenta">
                <span className="footer-nav-title">Cuenta</span>
                {isAdmin ? (
                  <Link href="/admin">Panel</Link>
                ) : isCustomer ? (
                  <Link href="/cuenta">Mi cuenta</Link>
                ) : (
                  <>
                    <Link href="/login">Iniciar sesión</Link>
                    <Link href="/registro">Crear cuenta</Link>
                  </>
                )}
                <Link href="/terminos">Términos y condiciones</Link>
              </nav>
              <div className="footer-social">
                <span className="footer-nav-title">Contacto</span>
                <a
                  href="https://www.instagram.com/valdra.store"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <div className="footer-legal">
              <span>© {new Date().getFullYear()} Valdra Store</span>
              <span>Prototipo académico</span>
            </div>
          </footer>
          <BottomNav isAdmin={isAdmin} isCustomer={isCustomer} />
        </ToastProvider>
      </body>
    </html>
  );
};

export default FrontendLayout;
