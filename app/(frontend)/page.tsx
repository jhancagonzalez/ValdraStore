import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/catalog";

const marqueeItems = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  href: `/catalogo?category=${value}`,
  label,
}));

const MarqueeGroup = ({ hidden = false }: { hidden?: boolean }) => (
  <ul className="marquee-group" aria-hidden={hidden || undefined}>
    {marqueeItems.map((item) => (
      <li key={item.href}>
        <Link href={item.href} tabIndex={hidden ? -1 : undefined}>
          {item.label}
        </Link>
      </li>
    ))}
    <li>
      <span>Diseño personalizado</span>
    </li>
    <li>
      <span>Hecho a tu medida</span>
    </li>
  </ul>
);

export default function HomePage() {
  return (
    <main>
      <div className="page page-home">
        <section className="hero">
          <h1>Prendas que cuentan tu historia</h1>
          <p>
            Explora el catálogo, elige tu prenda y personalízala con propuestas de diseño hechas a
            tu medida.
          </p>
          <div className="hero-actions">
            <Link href="/catalogo" className="button button-primary">
              Explorar catálogo
            </Link>
            <Link href="/registro" className="button button-secondary">
              Crear cuenta
            </Link>
          </div>
        </section>
      </div>

      <section className="marquee" aria-label="Categorías del catálogo">
        <div className="marquee-track">
          {[0, 1, 2, 3, 4, 5].map((copy) => (
            <MarqueeGroup key={copy} hidden={copy > 0} />
          ))}
        </div>
      </section>
    </main>
  );
}
