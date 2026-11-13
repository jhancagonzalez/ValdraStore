import manifest from "../../public/mockups/manifest.json";

/** Tallas disponibles para las prendas base (HU-11). */
export const MOCKUP_SIZES = ["S", "M", "L", "XL"] as const;

export type MockupSize = (typeof MOCKUP_SIZES)[number];

export type MockupCategory = keyof typeof manifest.categories;

export type MockupBase = {
  id: string;
  category: MockupCategory;
  categoryLabel: string;
  colorKey: string;
  colorLabel: string;
  file: string;
  alt: string;
};

const FEMININE_COLOR_LABELS: Record<string, string> = {
  beige: "beige",
  black: "negra",
  blue: "azul",
  red: "roja",
  white: "blanca",
};

const colorName = (category: MockupCategory, colorKey: string, colorLabel: string) =>
  category === "camisetas"
    ? (FEMININE_COLOR_LABELS[colorKey] ?? colorLabel.toLowerCase())
    : colorLabel.toLowerCase();

const baseName = (
  category: MockupCategory,
  categoryLabel: string,
  colorKey: string,
  colorLabel: string,
) => `${categoryLabel} ${colorName(category, colorKey, colorLabel)}`;

/**
 * Lista plana de las diez prendas base en el orden del manifiesto: cinco
 * camisetas y cinco hoodies. El id es estable y se deriva de categoría + color,
 * por ejemplo `camisetas-black` o `hoodies-blue`.
 */
export const MOCKUP_BASES: MockupBase[] = Object.entries(manifest.categories).flatMap(
  ([category, group]) => {
    const baseCategory = category as MockupCategory;
    return Object.entries(group.colors).map(([colorKey, color]) => ({
      id: `${baseCategory}-${colorKey}`,
      category: baseCategory,
      categoryLabel: group.label,
      colorKey,
      colorLabel: color.label,
      file: color.file,
      alt: `${baseName(baseCategory, group.label, colorKey, color.label)}, vista frontal sin estampado`,
    }));
  },
);

/** Nombre visible compartido por el carrusel, el rail y la barra inferior. */
export const getMockupBaseName = (base: MockupBase) =>
  baseName(base.category, base.categoryLabel, base.colorKey, base.colorLabel);

export const getMockupBase = (id: string | null | undefined): MockupBase | null =>
  MOCKUP_BASES.find((base) => base.id === id) ?? null;

export const isMockupSize = (value: string | null | undefined): value is MockupSize =>
  value !== null && value !== undefined && (MOCKUP_SIZES as readonly string[]).includes(value);
