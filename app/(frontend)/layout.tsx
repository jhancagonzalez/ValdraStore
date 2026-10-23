import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import logoValdra from "@/assets/logo_valdra.png";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "./_components/logout-button";
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
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Valdra Store, inicio">
            <Image src={logoValdra} alt="" height={40} priority />
            <span className="brand-name">Valdra Store</span>
          </Link>
          <nav className="site-nav" aria-label="Principal">
            <Link href="/catalogo">Catálogo</Link>
            {user?.collection === "admins" ? <Link href="/admin">Panel</Link> : null}
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
        {children}
        <footer className="site-footer">Valdra Store — prototipo académico</footer>
      </body>
    </html>
  );
};

export default FrontendLayout;
