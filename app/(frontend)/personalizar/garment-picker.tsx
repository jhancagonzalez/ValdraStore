import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, RefObject } from "react";
import {
  getMockupBaseName,
  MOCKUP_BASES,
  MOCKUP_SIZES,
  type MockupBase,
  type MockupCategory,
  type MockupSize,
} from "@/lib/mockup-bases";
import { CATEGORY_LABELS, CATEGORY_ORDER, SWATCH_COLORS } from "./personalization-config";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ImageIcon,
  LockIcon,
  TextIcon,
} from "./personalization-icons";

type GarmentPickerProps = {
  activeCategory: MockupCategory;
  authPromptOpen: boolean;
  barNotice: string;
  barNoticeTone: "error" | "info";
  categoryBases: MockupBase[];
  customizeRef: RefObject<HTMLButtonElement | null>;
  isAuthenticated: boolean;
  nextBase: MockupBase;
  onCustomize: () => void;
  onOpenDesigner: (target: "image" | "text") => void;
  onSelectBase: (id: string) => void;
  onSelectCategory: (category: MockupCategory) => void;
  onSelectSize: (size: MockupSize) => void;
  previousBase: MockupBase;
  railRef: RefObject<HTMLUListElement | null>;
  selectedBase: MockupBase;
  selectedName: string;
  selectedSize: MockupSize | null;
  sizeMissing: boolean;
  sizeOptionsRef: RefObject<HTMLDivElement | null>;
};

/** Paso 1: elegir prenda, color y talla antes de abrir el diseñador. */
export const GarmentPicker = ({
  activeCategory,
  authPromptOpen,
  barNotice,
  barNoticeTone,
  categoryBases,
  customizeRef,
  isAuthenticated,
  nextBase,
  onCustomize,
  onOpenDesigner,
  onSelectBase,
  onSelectCategory,
  onSelectSize,
  previousBase,
  railRef,
  selectedBase,
  selectedName,
  selectedSize,
  sizeMissing,
  sizeOptionsRef,
}: GarmentPickerProps) => (
  <>
    <nav
      className="garment-tabs"
      aria-label="Tipo de prenda"
      style={{ "--tab-index": activeCategory === "camisetas" ? 0 : 1 } as CSSProperties}
    >
      <span className="garment-tab-thumb" aria-hidden="true" />
      {CATEGORY_ORDER.map((category) => {
        const count = MOCKUP_BASES.filter((base) => base.category === category).length;
        const active = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            className="garment-tab"
            aria-pressed={active}
            onClick={() => onSelectCategory(category)}
          >
            <span>{CATEGORY_LABELS[category]}</span>
            <span className="garment-tab-count">{count}</span>
          </button>
        );
      })}
    </nav>

    <div className="personalizer-picker">
      <div className="personalizer-gallery">
        <figure className="garment-main">
          <div className="garment-preview">
            <Image
              src={selectedBase.file}
              alt={selectedBase.alt}
              fill
              sizes="(max-width: 900px) 92vw, 620px"
              loading="eager"
              fetchPriority="high"
            />
            <button
              type="button"
              className="garment-arrow garment-arrow-prev"
              aria-label="Prenda anterior"
              onClick={() => onSelectBase(previousBase.id)}
            >
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              className="garment-arrow garment-arrow-next"
              aria-label="Prenda siguiente"
              onClick={() => onSelectBase(nextBase.id)}
            >
              <ArrowRightIcon />
            </button>
          </div>
          <figcaption className="garment-stage-caption">
            <span className="garment-stage-name">{selectedName}</span>
            <span className="garment-stage-meta">{selectedBase.categoryLabel} · Vista frontal</span>
          </figcaption>
        </figure>

        <div className="garment-rail-block">
          <div className="garment-rail-head">
            <h2 className="garment-rail-title">{CATEGORY_LABELS[activeCategory]}</h2>
            <span className="garment-rail-count">{categoryBases.length} disponibles</span>
          </div>
          <ul className="garment-rail" ref={railRef}>
            {categoryBases.map((base) => {
              const name = getMockupBaseName(base);
              const active = base.id === selectedBase.id;
              return (
                <li key={base.id}>
                  <button
                    type="button"
                    className="garment-thumb"
                    data-base-id={base.id}
                    aria-pressed={active}
                    aria-label={name}
                    onClick={() => onSelectBase(base.id)}
                  >
                    <span className="garment-thumb-frame">
                      <Image src={base.file} alt="" fill sizes="96px" />
                    </span>
                    <span className="garment-thumb-name" aria-hidden="true">
                      {name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="personalizer-panel">
        <p className="eyebrow">Personalizador</p>
        <h2 className="personalizer-name">{selectedName}</h2>
        <p className="personalizer-meta">{selectedBase.categoryLabel} · Vista frontal</p>

        <fieldset className="personalizer-swatches">
          <legend className="personalizer-field-label">Color</legend>
          <div className="swatch-row">
            {categoryBases.map((base) => (
              <button
                key={base.id}
                type="button"
                className="swatch"
                style={
                  {
                    "--swatch": SWATCH_COLORS[base.colorKey] ?? "#d9d6d0",
                  } as CSSProperties
                }
                aria-label={`Color ${base.colorLabel}`}
                aria-pressed={base.id === selectedBase.id}
                onClick={() => onSelectBase(base.id)}
              >
                <span className="swatch-dot" aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="personalizer-sizes">
          <legend className="personalizer-field-label">Talla</legend>
          <div
            className="personalizer-size-options"
            ref={sizeOptionsRef}
            data-missing={!selectedSize && sizeMissing ? "true" : undefined}
          >
            {MOCKUP_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className="option-chip"
                aria-pressed={selectedSize === size}
                onClick={() => onSelectSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="personalizer-options">
          <legend className="sr-only">Qué puedes personalizar</legend>
          <button
            type="button"
            className="personalizer-option"
            onClick={() => onOpenDesigner("text")}
          >
            <span className="personalizer-option-icon">
              <TextIcon />
            </span>
            <span className="personalizer-option-copy">
              <strong>Texto o idea</strong>
              <small>Describe lo que quieres crear</small>
            </span>
            <ChevronRightIcon />
          </button>
          <button
            type="button"
            className="personalizer-option"
            onClick={() => onOpenDesigner("image")}
          >
            <span className="personalizer-option-icon">
              <ImageIcon />
            </span>
            <span className="personalizer-option-copy">
              <strong>Imagen de referencia</strong>
              <small>Adjunta un archivo opcional</small>
            </span>
            <ChevronRightIcon />
          </button>
        </fieldset>

        <p id="size-hint" className="personalizer-notice" data-tone={barNoticeTone} role="status">
          {!isAuthenticated && selectedSize ? <LockIcon /> : null}
          {barNotice}
        </p>

        <button
          type="button"
          ref={customizeRef}
          className="button button-primary personalizer-cta"
          aria-describedby="size-hint"
          aria-haspopup={!isAuthenticated ? "dialog" : undefined}
          aria-controls={!isAuthenticated && authPromptOpen ? "auth-dialog" : undefined}
          onClick={onCustomize}
        >
          Continuar: Diseñar <span aria-hidden="true">→</span>
        </button>
        <Link className="personalizer-notices-link" href="/personalizar/avisos">
          Te recomendamos leer nuestros avisos y recomendaciones antes de diseñar.
        </Link>
      </div>
    </div>
  </>
);
