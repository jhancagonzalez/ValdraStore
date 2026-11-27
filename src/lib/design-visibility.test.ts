import { describe, expect, it } from "vitest";
import type { Design } from "../../payload-types";
import { designAvailabilityLabel, hasVisibleDesigns, isVisibleDesign } from "./design-visibility";

const design = (overrides: Partial<Design> = {}): Design => ({
  active: true,
  createdAt: "",
  id: 1,
  image: 10,
  name: "Flor andina",
  updatedAt: "",
  ...overrides,
});

describe("isVisibleDesign (HU-23)", () => {
  it("solo acepta diseños poblados y activos", () => {
    expect(isVisibleDesign(design())).toBe(true);
    expect(isVisibleDesign(design({ active: false }))).toBe(false);
    expect(isVisibleDesign(3)).toBe(false);
    expect(isVisibleDesign(null)).toBe(false);
  });
});

describe("hasVisibleDesigns — criterio 3: diseños ocultos", () => {
  it("una prenda sin diseños asociados se sigue mostrando", () => {
    expect(hasVisibleDesigns({ designs: [] })).toBe(true);
    expect(hasVisibleDesigns({ designs: null })).toBe(true);
    expect(hasVisibleDesigns({})).toBe(true);
  });

  it("una prenda con al menos un diseño activo se muestra", () => {
    expect(hasVisibleDesigns({ designs: [design({ active: false }), design({ id: 2 })] })).toBe(
      true,
    );
  });

  it("una prenda cuyos diseños están todos ocultos deja de mostrarse", () => {
    expect(hasVisibleDesigns({ designs: [design({ active: false })] })).toBe(false);
    // Con acceso de cliente, el diseño oculto llega sin poblar (solo su id).
    expect(hasVisibleDesigns({ designs: [4] })).toBe(false);
  });
});

describe("designAvailabilityLabel", () => {
  it("muestra un texto en vez de true/false en el panel", () => {
    expect(designAvailabilityLabel(true)).toBe("Disponible");
    expect(designAvailabilityLabel(null)).toBe("Disponible");
    expect(designAvailabilityLabel(false)).toBe("Oculto");
  });
});
