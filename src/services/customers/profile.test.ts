import { describe, expect, it } from "vitest";
import { type ProfileInput, parseProfileInput } from "./profile";

describe("parseProfileInput (HU-04)", () => {
  it("normaliza nombre, correo y teléfono", () => {
    expect(
      parseProfileInput({
        email: "  CLIENTE@Ejemplo.COM ",
        name: "  Ana  ",
        phone: " +57 300 123 4567 ",
      }),
    ).toEqual({
      data: { email: "cliente@ejemplo.com", name: "Ana", phone: "+57 300 123 4567" },
      ok: true,
    });
  });

  it("trata el teléfono vacío como nulo", () => {
    expect(parseProfileInput({ email: "ana@ejemplo.com", name: "Ana", phone: "   " })).toEqual({
      data: { email: "ana@ejemplo.com", name: "Ana", phone: null },
      ok: true,
    });
  });

  it("rechaza un nombre vacío o demasiado corto", () => {
    const result = parseProfileInput({ email: "ana@ejemplo.com", name: " A " });
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("fieldErrors.name");
  });

  it("rechaza un correo sin formato válido", () => {
    const result = parseProfileInput({ email: "ana-arroba-ejemplo", name: "Ana" });
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("fieldErrors.email");
  });

  it("rechaza un teléfono con caracteres no permitidos", () => {
    const result = parseProfileInput({
      email: "ana@ejemplo.com",
      name: "Ana",
      phone: "abc1234567",
    });
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("fieldErrors.phone");
  });

  it("acumula todos los errores de campo", () => {
    const result = parseProfileInput({ email: "no-es-correo", name: "", phone: "!!" });
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("fieldErrors.name");
    expect(result).toHaveProperty("fieldErrors.email");
    expect(result).toHaveProperty("fieldErrors.phone");
  });

  it("descarta campos fuera de la lista blanca", () => {
    const input = {
      email: "ana@ejemplo.com",
      id: 99,
      name: "Ana",
      password: "secreto",
      role: "admin",
    } as unknown as ProfileInput;

    expect(parseProfileInput(input)).toEqual({
      data: { email: "ana@ejemplo.com", name: "Ana", phone: null },
      ok: true,
    });
  });
});
