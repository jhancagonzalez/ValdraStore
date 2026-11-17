import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./(frontend)/globals.css";

const spaceGrotesk = Space_Grotesk({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = { title: "Página no encontrada" };

/**
 * 404 for URLs that match no route at all. Next bypasses the layouts here, so
 * this page imports the storefront tokens and fonts on its own.
 */
export default function GlobalNotFound() {
  return (
    <html lang="es" className={spaceGrotesk.variable}>
      <body className="global-404">
        <header className="global-bar">
          <Link href="/" className="global-brand">
            Valdra Store
          </Link>
          <Link href="/catalogo" className="button button-secondary">
            Catálogo
          </Link>
        </header>
        <main className="page not-found-page">
          <p className="not-found-code" aria-hidden="true">
            404
          </p>
          <div className="not-found-copy">
            <p className="eyebrow">Página no encontrada</p>
            <h1>Esta página no existe.</h1>
            <p className="section-subtitle">
              Puede que el enlace esté mal escrito o que la página ya no esté disponible. Vuelve al
              catálogo o empieza una personalización desde cero.
            </p>
            <div className="hero-actions">
              <Link href="/catalogo" className="button button-primary">
                Ver catálogo
              </Link>
              <Link href="/" className="button button-secondary">
                Ir al inicio
              </Link>
            </div>
          </div>
        </main>
        <footer className="global-legal">
          <span>© {new Date().getFullYear()} Valdra Store</span>
          <span>Prototipo académico</span>
        </footer>
      </body>
    </html>
  );
}
