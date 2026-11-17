import Link from "next/link";
import { getPublishedProducts } from "@/lib/catalog";
import bannerEditorial from "../../imagen_banner1.png";
import bannerDuo from "../../imagen_banner2.png";
import { CategoryPills } from "./_components/category-pills";
import { HeroCarousel } from "./_components/hero-carousel";
import { ProductCard } from "./_components/product-card";
import { Reveal } from "./_components/reveal";

export const dynamic = "force-dynamic";

const slides = [
  {
    alt: "Modelo con camiseta negra de Valdra frente a una pared de concreto",
    name: "Editorial Valdra",
    src: bannerEditorial,
  },
  {
    alt: "Camisetas negra y blanca de Valdra colgadas junto a una gorra",
    name: "Dúo esencial",
    src: bannerDuo,
  },
];

const steps = [
  {
    title: "Elige tu prenda",
    text: "Explora el catálogo o abre el personalizador y selecciona tu base.",
  },
  {
    title: "Cuéntanos tu idea",
    text: "Describe el diseño, usa una referencia y ajústalo a tu manera.",
  },
  {
    title: "Revisa y aprueba",
    text: "Compara propuestas, aprueba la que más te guste y descárgala.",
  },
];

const emptyFilters = {
  category: "",
  color: "",
  maxPrice: null,
  minPrice: null,
  q: "",
  size: "",
  sort: "newest" as const,
};

export default async function HomePage() {
  const products = await getPublishedProducts(1, emptyFilters);
  const preview = products.docs.slice(0, 4);

  return (
    <main>
      <div className="page page-home">
        <HeroCarousel slides={slides} />
      </div>

      <section className="home-section home-section-catalog" aria-labelledby="home-catalog-title">
        <Reveal className="home-section-inner">
          <div className="home-catalog-head">
            <div>
              <p className="eyebrow">Catálogo</p>
              <h2 id="home-catalog-title">Prendas para empezar.</h2>
              <p>Explora la colección completa con precio, color y talla.</p>
            </div>
          </div>

          <CategoryPills />

          {preview.length > 0 ? (
            <ul className="product-grid product-grid-home">
              {preview.map((product, index) => (
                <ProductCard key={product.id} product={product} preload={index === 0} />
              ))}
            </ul>
          ) : (
            <p className="state-message">
              El catálogo está tomando forma. Vuelve pronto para descubrir las prendas.
            </p>
          )}

          <div className="home-catalog-footer">
            <Link href="/catalogo" className="text-link">
              Ver todo el catálogo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="home-section" aria-labelledby="home-how-title">
        <Reveal className="home-section-inner">
          <div className="home-catalog-head">
            <div>
              <p className="eyebrow">Cómo funciona</p>
              <h2 id="home-how-title">De la idea a la prenda.</h2>
            </div>
          </div>
          <ol className="home-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="home-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="home-section home-section-cta" aria-labelledby="home-cta-title">
        <Reveal className="home-section-inner">
          <div className="home-cta-card">
            <div>
              <p className="home-cta-eyebrow">Personalizador</p>
              <h2 id="home-cta-title">Tu prenda. Tu diseño.</h2>
              <p>Elige color y talla, describe tu idea y revisa la propuesta antes de aprobarla.</p>
            </div>
            <div className="home-cta-actions">
              <Link href="/personalizar" className="button button-light">
                Empezar a diseñar <span aria-hidden="true">→</span>
              </Link>
              <Link href="/catalogo" className="button button-ghost-light">
                Ver catálogo
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
