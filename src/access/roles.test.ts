import { describe, expect, it } from "vitest";
import { isAdminOrSelf } from "./roles";

/** Calls the access function with only the request data it actually reads. */
const evaluate = (user: unknown): unknown =>
  (isAdminOrSelf as unknown as (args: { req: { user: unknown } }) => unknown)({
    req: { user },
  });

describe("isAdminOrSelf (HU-04)", () => {
  it("deniega el acceso cuando no hay sesión", () => {
    expect(evaluate(null)).toBe(false);
    expect(evaluate(undefined)).toBe(false);
  });

  it("limita a un cliente autenticado a su propio documento", () => {
    expect(evaluate({ collection: "customers", id: 7, role: "customer" })).toEqual({
      id: { equals: 7 },
    });
  });

  it("nunca concede acceso total a un cliente", () => {
    expect(evaluate({ collection: "customers", id: 7, role: "customer" })).not.toBe(true);
  });

  it("mantiene el acceso total para administradores", () => {
    expect(evaluate({ collection: "admins", id: 1, role: "admin" })).toBe(true);
  });
});
