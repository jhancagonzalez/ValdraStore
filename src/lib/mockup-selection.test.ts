import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVISION_SELECTION,
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
  it("calcula el rectángulo de composición de la selección", () => {
    const resolved = resolveMockupSelection(DEFAULT_REVISION_SELECTION, 1024, 1024);

    expect(resolved.selectionRect).toEqual({ left: 184, top: 164, width: 655, height: 717 });
  });

  it("mantiene el rectángulo de composición dentro de los bordes", () => {
    const resolved = resolveMockupSelection(
      { x: 0.02, y: 0.3, width: 0.2, height: 0.3 },
      1024,
      1024,
    );

    expect(resolved.selectionRect.left).toBeGreaterThanOrEqual(0);
    expect(resolved.selectionRect.top).toBeGreaterThanOrEqual(0);
    expect(resolved.selectionRect.left + resolved.selectionRect.width).toBeLessThanOrEqual(1024);
    expect(resolved.selectionRect.top + resolved.selectionRect.height).toBeLessThanOrEqual(1024);
  });

  it("conserva el tamaño de una selección pequeña", () => {
    const resolved = resolveMockupSelection(
      { x: 0.4, y: 0.4, width: 0.05, height: 0.05 },
      1024,
      1024,
    );

    expect(resolved.selectionRect.width).toBe(51);
    expect(resolved.selectionRect.height).toBe(51);
  });
});
