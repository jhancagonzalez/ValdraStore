import { describe, expect, it } from "vitest";
import { stripControlCharacters } from "./sanitize";

describe("stripControlCharacters", () => {
  it("elimina controles no imprimibles y conserva saltos de línea", () => {
    expect(stripControlCharacters("\u0000HOLA\u001F\nMUNDO\u007F")).toBe("HOLA\nMUNDO");
  });
});
