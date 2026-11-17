"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState } from "react";

type HeroSlide = {
  alt: string;
  name: string;
  src: StaticImageData;
};

type HeroCarouselProps = {
  slides: HeroSlide[];
};

/**
 * Hero editorial monocromo: el banner se muestra completo y el texto se
 * superpone sobre su zona libre. Los dots cambian de banner sin autoplay.
 */
export const HeroCarousel = ({ slides }: HeroCarouselProps) => {
  const [active, setActive] = useState(0);

  return (
    <section className="hero-card" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Nueva colección</p>
        <h1 id="hero-title" className="hero-title">
          Valdra Store
        </h1>
        <p className="hero-lead">
          Prendas limpias, hechas para llevar tu diseño. Elige una base y hazla tuya.
        </p>
        <div className="hero-actions">
          <Link href="/catalogo" className="button button-primary">
            Explorar colección <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-dots-label">
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </p>
        </div>
        <fieldset className="hero-dots">
          <legend className="sr-only">Seleccionar prenda destacada</legend>
          {slides.map((slide, index) => (
            <button
              key={slide.src.src}
              type="button"
              className="hero-dot"
              aria-label={`Ver ${slide.name}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </fieldset>
      </div>

      <div className="hero-media">
        {slides.map((slide, index) =>
          index === active ? (
            <div key={slide.src.src} className="hero-slide">
              <Image
                src={slide.src}
                alt={slide.alt}
                placeholder="blur"
                loading="eager"
                preload={index === 0}
                sizes="(max-width: 900px) 100vw, 1280px"
              />
            </div>
          ) : null,
        )}
        <p className="hero-media-caption">{slides[active]?.name}</p>
      </div>
    </section>
  );
};
