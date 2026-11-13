import { describe, expect, it } from "vitest";
import { buildProposalPrompt, IDEA_MAX_LENGTH, normalizeIdea } from "./proposal-prompt";

describe("normalizeIdea (HU-14/HU-12)", () => {
  it("recorta y colapsa espacios y saltos de línea", () => {
    expect(normalizeIdea("  un   tigre\n\tgeométrico  ")).toBe("un tigre geométrico");
  });

  it("elimina caracteres de control", () => {
    expect(normalizeIdea("tigre\u0000\u0007verde")).toBe("tigre verde");
  });

  it("mantiene las tildes y los símbolos del cliente", () => {
    expect(normalizeIdea("dragón azul «edición limitada»")).toBe("dragón azul «edición limitada»");
  });
});

describe("buildProposalPrompt (HU-14)", () => {
  const prompt = buildProposalPrompt("Camiseta negra", "un tigre geométrico verde");

  it("incluye la prenda y la idea del cliente", () => {
    expect(prompt).toContain("Camiseta negra");
    expect(prompt).toContain("un tigre geométrico verde");
  });

  it("pide conservar silueta, color y encuadre de la prenda base", () => {
    expect(prompt).toContain("silueta");
    expect(prompt).toContain("color de la prenda");
    expect(prompt).toContain("encuadre");
  });

  it("prohíbe personas y logos no solicitados", () => {
    expect(prompt).toContain("No incluyas personas");
    expect(prompt).toContain("No añadas logos");
  });

  it("entrecomilla la idea como texto literal del cliente", () => {
    expect(prompt).toContain("«un tigre geométrico verde»");
  });

  it("mantiene un límite técnico documentado", () => {
    expect(IDEA_MAX_LENGTH).toBeGreaterThan(0);
  });
});
