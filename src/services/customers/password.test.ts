import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validateNewPassword } from "./password";

describe("validateNewPassword (HU-03)", () => {
  it("acepta una contraseña con la longitud mínima", () => {
    expect(
      validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH), "a".repeat(PASSWORD_MIN_LENGTH)),
    ).toEqual({
      ok: true,
    });
  });

  it("rechaza una contraseña demasiado corta", () => {
    const result = validateNewPassword("corta", "corta");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("message", "La contraseña debe tener al menos 8 caracteres.");
  });

  it("rechaza una contraseña que no es texto", () => {
    expect(validateNewPassword(undefined).ok).toBe(false);
  });

  it("rechaza una contraseña demasiado larga", () => {
    const longPassword = "a".repeat(PASSWORD_MAX_LENGTH + 1);
    expect(validateNewPassword(longPassword).ok).toBe(false);
  });

  it("rechaza una confirmación distinta", () => {
    const result = validateNewPassword("contrasena1", "contrasena2");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("message", "Las contraseñas no coinciden.");
  });

  it("no exige confirmación cuando no se envía", () => {
    expect(validateNewPassword("contrasena1")).toEqual({ ok: true });
  });
});
