import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page not-found-page">
      <p className="not-found-code" aria-hidden="true">
        404
      </p>
      <div className="not-found-copy">
        <p className="eyebrow">Página no encontrada</p>
        <h1>Esta página no existe.</h1>
        <p className="section-subtitle">
          Puede que el enlace esté mal escrito o que la prenda ya no esté disponible. Vuelve al
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
  );
}
