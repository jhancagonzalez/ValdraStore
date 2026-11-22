import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safe next path", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/pedidos?pedido=123456")).toBe("/pedidos?pedido=123456");
    expect(safeNextPath("/cuenta")).toBe("/cuenta");
  });

  it("rechaza destinos externos y rutas ambiguas", () => {
    expect(safeNextPath("https://evil.example")).toBeUndefined();
    expect(safeNextPath("//evil.example")).toBeUndefined();
    expect(safeNextPath("/\\evil.example")).toBeUndefined();
    expect(safeNextPath("/\t//evil.example")).toBeUndefined();
    expect(safeNextPath("/\u0000cuenta")).toBeUndefined();
  });

  it("devuelve el fallback cuando la ruta no es válida", () => {
    expect(safeNextPath("https://evil.example", "/catalogo")).toBe("/catalogo");
    expect(safeNextPath(undefined, "/catalogo")).toBe("/catalogo");
  });
});
