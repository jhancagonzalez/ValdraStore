import type { PayloadRequest } from "payload";
import { describe, expect, it } from "vitest";
import type { Design, Media } from "../../payload-types";
import { collectProductImages, toDesignImage } from "../lib/media";
import { Designs } from "./Designs";
import { ACTIVE_DESIGNS_WHERE, readActiveDesigns } from "./designs-access";

const readAs = (user: unknown) =>
  readActiveDesigns({ req: { user } as unknown as PayloadRequest } as never);

const media = (id: number, url: string): Media =>
  ({ alt: `media ${id}`, createdAt: "", id, updatedAt: "", url }) as Media;

const design = (overrides: Partial<Design> = {}): Design => ({
  active: true,
  createdAt: "",
  id: 1,
  image: media(10, "https://cdn.valdra.test/flor.png"),
  name: "Flor andina",
  updatedAt: "",
  ...overrides,
});

describe("Acceso a diseños (HU-23)", () => {
  it("el administrador lee todos los diseños, incluidos los deshabilitados", () => {
    expect(readAs({ collection: "admins", id: 1, role: "admin" })).toBe(true);
  });

  it("clientes y visitantes solo leen diseños activos (criterio 3)", () => {
    expect(readAs({ collection: "customers", id: 7, role: "customer" })).toEqual(
      ACTIVE_DESIGNS_WHERE,
    );
    expect(readAs(null)).toEqual({ active: { equals: true } });
  });

  it("solo el administrador puede crear, editar y eliminar (criterio 1)", () => {
    const access = Designs.access ?? {};
    const customerReq = { req: { user: { collection: "customers", id: 7 } } } as never;
    const adminReq = { req: { user: { collection: "admins", id: 1, role: "admin" } } } as never;

    for (const operation of ["create", "update", "delete"] as const) {
      const rule = access[operation] as (args: never) => unknown;
      expect(rule(customerReq)).toBe(false);
      expect(rule(adminReq)).toBe(true);
    }
  });

  it("exige nombre e imagen y deja el diseño activo por defecto", () => {
    const fields = Object.fromEntries(
      Designs.fields.filter((field) => "name" in field).map((field) => [field.name, field]),
    ) as Record<string, { required?: boolean; defaultValue?: unknown; type: string }>;

    expect(fields.name.required).toBe(true);
    expect(fields.image).toMatchObject({ required: true, type: "upload" });
    expect(fields.active.defaultValue).toBe(true);
    expect(fields.garments.type).toBe("join");
  });

  it("muestra «Prendas con este diseño» solo cuando el diseño ya está guardado", () => {
    const garments = Designs.fields.find(
      (field) => "name" in field && field.name === "garments",
    ) as { admin: { condition: (data: unknown) => boolean } };

    expect(garments.admin.condition({})).toBe(false);
    expect(garments.admin.condition({ id: 4 })).toBe(true);
  });
});

describe("toDesignImage (HU-23, criterio 2 y 3)", () => {
  it("convierte un diseño activo en una imagen del detalle", () => {
    expect(toDesignImage(design(), "Camiseta")).toEqual({
      alt: "Diseño Flor andina",
      kind: "design",
      url: "https://cdn.valdra.test/flor.png",
    });
  });

  it("omite un diseño deshabilitado aunque llegue poblado", () => {
    expect(toDesignImage(design({ active: false }), "Camiseta")).toBeNull();
  });

  it("omite diseños sin poblar o sin imagen utilizable", () => {
    expect(toDesignImage(3, "Camiseta")).toBeNull();
    expect(toDesignImage(design({ image: 10 }), "Camiseta")).toBeNull();
    expect(
      toDesignImage(design({ image: media(10, "javascript:alert(1)") }), "Camiseta"),
    ).toBeNull();
  });

  it("el detalle muestra la imagen de la prenda y solo los diseños activos", () => {
    const images = collectProductImages({
      designs: [
        design(),
        design({ active: false, id: 2, image: media(11, "/api/media/file/oculto.png") }),
      ],
      image: media(1, "https://cdn.valdra.test/camiseta.png"),
      title: "Camiseta",
    });

    expect(images.map((image) => [image.kind, image.url])).toEqual([
      ["image", "https://cdn.valdra.test/camiseta.png"],
      ["design", "https://cdn.valdra.test/flor.png"],
    ]);
  });
});
