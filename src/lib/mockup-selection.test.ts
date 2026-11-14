import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVISION_SELECTION,
  isSleeveSelection,
  parseMockupSelection,
  resolveMockupSelection,
} from "./mockup-selection";

describe("parseMockupSelection", () => {
  it("acepta una selección normalizada válida", () => {
    expect(parseMockupSelection({ x: 0.2, y: 0.3, width: 0.4, height: 0.5 })).toEqual({
      x: 0.2,
      y: 0.3,
      width: 0.4,
      height: 0.5,
    });
  });

  it("rechaza valores no numéricos o demasiado pequeños", () => {
    expect(parseMockupSelection({ x: 0.2, y: 0.3, width: 0, height: 0.5 })).toBeNull();
    expect(parseMockupSelection({ x: "0.2", y: 0.3, width: 0.4, height: 0.5 })).toBeNull();
    expect(parseMockupSelection(null)).toBeNull();
  });

  it("recorta los bordes al área del mockup", () => {
    expect(parseMockupSelection({ x: 0.8, y: 0.8, width: 0.5, height: 0.5 })).toEqual({
      x: 0.8,
      y: 0.8,
      width: 0.2,
      height: 0.2,
    });
  });
});

describe("resolveMockupSelection", () => {
  it("calcula un recorte cuadrado que contiene la selección", () => {
    const resolved = resolveMockupSelection(DEFAULT_REVISION_SELECTION, 1024, 1024);

    expect(resolved.selectionRect).toEqual({ left: 184, top: 164, width: 655, height: 717 });
    expect(resolved.cropRect.size).toBe(1024);
    expect(resolved.cropRect.left).toBe(0);
    expect(resolved.cropRect.top).toBe(0);
  });

  it("mantiene el recorte dentro de los bordes en una selección lateral", () => {
    const resolved = resolveMockupSelection(
      { x: 0.02, y: 0.3, width: 0.2, height: 0.3 },
      1024,
      1024,
    );

    expect(resolved.cropRect.left).toBeGreaterThanOrEqual(0);
    expect(resolved.cropRect.top).toBeGreaterThanOrEqual(0);
    expect(resolved.cropRect.left + resolved.cropRect.size).toBeLessThanOrEqual(1024);
    expect(resolved.cropRect.top + resolved.cropRect.size).toBeLessThanOrEqual(1024);
    expect(resolved.selectionRect.left).toBeGreaterThanOrEqual(resolved.cropRect.left);
    expect(resolved.selectionRect.top).toBeGreaterThanOrEqual(resolved.cropRect.top);
  });

  it("detecta una manga en camiseta y en hoodie", () => {
    expect(isSleeveSelection({ x: 0.04, y: 0.28, width: 0.24, height: 0.32 }, "camisetas")).toBe(
      true,
    );
    expect(isSleeveSelection({ x: 0.72, y: 0.4, width: 0.24, height: 0.32 }, "hoodies")).toBe(true);
  });

  it("no bloquea pecho ni bajo", () => {
    expect(isSleeveSelection(DEFAULT_REVISION_SELECTION, "camisetas")).toBe(false);
    expect(isSleeveSelection({ x: 0.22, y: 0.62, width: 0.56, height: 0.3 }, "camisetas")).toBe(
      false,
    );
  });

  it("da contexto suficiente a una selección pequeña", () => {
    const resolved = resolveMockupSelection(
      { x: 0.4, y: 0.4, width: 0.05, height: 0.05 },
      1024,
      1024,
    );

    expect(resolved.cropRect.size).toBeGreaterThanOrEqual(154);
    expect(resolved.selectionRect.width).toBe(51);
    expect(resolved.selectionRect.height).toBe(51);
  });
});
