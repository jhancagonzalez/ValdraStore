import manifest from "../../../public/mockups/manifest.json";

/** Tallas que ofrece el selector de prenda (HU-11). */
export const MOCKUP_SIZES = ["S", "M", "L", "XL"] as const;

export type MockupSize = (typeof MOCKUP_SIZES)[number];

export type MockupCategory = keyof typeof manifest.categories;

export type GarmentBase = {
  category: MockupCategory;
  categoryLabel: string;
  colorKey: string;
  colorLabel: string;
  /** Ruta pública de la prenda base, por ejemplo `/mockups/tshirt-black.jpg`. */
  file: string;
  /** Id estable derivado de categoría + color, por ejemplo `camisetas-black`. */
  id: string;
  /** Nombre visible, por ejemplo `Camiseta negra`. */
  name: string;
};

const FEMININE_COLORS: Record<string, string> = {
  beige: "beige",
  black: "negra",
  blue: "azul",
  red: "roja",
  white: "blanca",
};

const colorName = (category: MockupCategory, colorKey: string, colorLabel: string): string =>
  category === "camisetas"
    ? (FEMININE_COLORS[colorKey] ?? colorLabel.toLowerCase())
    : colorLabel.toLowerCase();

const baseName = (
  category: MockupCategory,
  categoryLabel: string,
  colorKey: string,
  colorLabel: string,
) => `${categoryLabel} ${colorName(category, colorKey, colorLabel)}`;

/** Las diez prendas base del manifiesto: cinco camisetas y cinco hoodies. */
export const GARMENT_BASES: readonly GarmentBase[] = Object.entries(manifest.categories).flatMap(
  ([category, group]) => {
    const baseCategory = category as MockupCategory;

    return Object.entries(group.colors).map(([colorKey, color]) => ({
      category: baseCategory,
      categoryLabel: group.label,
      colorKey,
      colorLabel: color.label,
      file: color.file,
      id: `${baseCategory}-${colorKey}`,
      name: baseName(baseCategory, group.label, colorKey, color.label),
    }));
  },
);

export const findGarmentBase = (id: string | null | undefined): GarmentBase | null => {
  if (!id) {
    return null;
  }

  return GARMENT_BASES.find((base) => base.id === id) ?? null;
};

export const isMockupSize = (value: string | null | undefined): value is MockupSize =>
  value !== null && value !== undefined && (MOCKUP_SIZES as readonly string[]).includes(value);
