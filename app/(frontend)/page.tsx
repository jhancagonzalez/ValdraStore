import Image from "next/image";
import Link from "next/link";
import logoValdra from "@/assets/logo_valdra.png";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-logo-wrap">
          <span className="hero-orbit" aria-hidden="true" />
          <Image src={logoValdra} alt="Valdra Store" height={220} priority />
        </div>
        <h1>Prendas que cuentan tu historia</h1>
        <p>
          Explora el catálogo, elige tu prenda y personalízala con propuestas de diseño hechas a tu
          medida.
        </p>
        <Link href="/catalogo" className="button button-primary">
          Explorar catálogo
        </Link>
      </section>
    </main>
  );
}
