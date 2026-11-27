import { describe, expect, it } from "vitest";
import { Categories, fillCategorySlug, readActiveCategories } from "./Categories";

type AccessArgs = Parameters<typeof readActiveCategories>[0];
const read = (user: unknown) => readActiveCategories({ req: { user } } as unknown as AccessArgs);

type HookArgs = Parameters<typeof fillCategorySlug>[0];
const fill = (data: Record<string, unknown>) =>
  fillCategorySlug({ data } as unknown as HookArgs) as Record<string, unknown>;

describe("categories access", () => {
  it("el administrador lee todas las categorías", () => {
    expect(read({ collection: "admins", role: "admin" })).toBe(true);
  });

  it("clientes y visitantes solo leen las activas", () => {
    const onlyActive = { active: { equals: true } };
    expect(read(null)).toEqual(onlyActive);
    expect(read({ collection: "customers", id: 4 })).toEqual(onlyActive);
  });

  it("solo el administrador crea y edita; nadie elimina", () => {
    const customer = { req: { user: { collection: "customers", id: 4 } } } as unknown as AccessArgs;
    expect(Categories.access?.create?.(customer)).toBe(false);
    expect(Categories.access?.update?.(customer)).toBe(false);
    const admin = {
      req: { user: { collection: "admins", role: "admin" } },
    } as unknown as AccessArgs;
    expect(Categories.access?.delete?.(admin)).toBe(false);
  });
});

describe("fillCategorySlug", () => {
  it("genera el identificador desde el nombre", () => {
    expect(fill({ name: "Buzos Niño" }).slug).toBe("buzos-nino");
  });

  it("normaliza el identificador escrito a mano", () => {
    expect(fill({ name: "Gorras", slug: " Gorras Planas " }).slug).toBe("gorras-planas");
  });

  it("no inventa un identificador en una edición sin nombre", () => {
    expect(fill({ active: false })).toEqual({ active: false });
  });
});
