import { ValidationError } from "payload";
import { describe, expect, it } from "vitest";
import { missingProductFields, requireProductBasics } from "./product-rules";

const complete = {
  _status: "published",
  category: 3,
  priceInCOP: 60000,
  priceInCOPEnabled: true,
  title: "Camiseta básica",
};

type HookArgs = Parameters<typeof requireProductBasics>[0];
const run = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
  requireProductBasics({ data, originalDoc } as unknown as HookArgs);

describe("missingProductFields", () => {
  it("acepta una prenda con nombre, categoría y precio", () => {
    expect(missingProductFields(complete)).toEqual([]);
  });

  it("señala nombre, categoría y precio cuando faltan", () => {
    expect(missingProductFields({ title: "  " })).toEqual(["title", "category", "priceInCOP"]);
  });

  it("no acepta precio cero ni precio desactivado", () => {
    expect(missingProductFields({ ...complete, priceInCOP: 0 })).toEqual(["priceInCOP"]);
    expect(missingProductFields({ ...complete, priceInCOPEnabled: false })).toEqual(["priceInCOP"]);
  });
});

describe("requireProductBasics", () => {
  it("deja guardar borradores incompletos", () => {
    const data = { _status: "draft", title: "Sin terminar" };
    expect(run(data)).toBe(data);
  });

  it("bloquea publicar sin precio", () => {
    expect(() => run({ ...complete, priceInCOP: null })).toThrow(ValidationError);
  });

  it("bloquea publicar sin categoría", () => {
    expect(() => run({ ...complete, category: null })).toThrow(ValidationError);
  });

  it("valida contra el documento guardado en una edición parcial", () => {
    expect(run({ title: "Nuevo nombre" }, complete)).toEqual({ title: "Nuevo nombre" });
    expect(() => run({ priceInCOPEnabled: false }, complete)).toThrow(ValidationError);
  });
});
