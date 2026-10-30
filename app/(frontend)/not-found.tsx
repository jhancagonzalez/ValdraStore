import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page page-narrow">
      <h1 className="section-title">No encontramos esta página</h1>
      <p className="section-subtitle">
        Puede que el enlace esté mal escrito o que la prenda ya no esté disponible.
      </p>
      <div className="hero-actions">
        <Link href="/catalogo" className="button button-primary">
          Ver catálogo
        </Link>
        <Link href="/" className="button button-secondary">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
