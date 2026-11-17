export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

export type PasswordValidation = { ok: true } | { message: string; ok: false };

/**
 * Password rules for a new password (HU-03). The minimum matches the
 * registration form so both entry points stay consistent.
 */
export const validateNewPassword = (
  password: unknown,
  confirmation?: unknown,
): PasswordValidation => {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return {
      message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      ok: false,
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      message: `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`,
      ok: false,
    };
  }

  if (confirmation !== undefined && password !== confirmation) {
    return { message: "Las contraseñas no coinciden.", ok: false };
  }

  return { ok: true };
};
