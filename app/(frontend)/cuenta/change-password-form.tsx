"use client";

import { useActionState, useEffect, useRef } from "react";
import { type ChangePasswordState, changePassword } from "./change-password";

const INITIAL_STATE: ChangePasswordState = { status: "idle" };

/** Cambio de contraseña desde Mi cuenta, con verificación de la actual. */
export const ChangePasswordForm = () => {
  const [state, formAction, pending] = useActionState(changePassword, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form className="form" ref={formRef} action={formAction}>
      {state.status === "error" && state.message ? (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="form-success" role="status">
          {state.message}
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="password-current">Contraseña actual</label>
        <input
          id="password-current"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fieldErrors.currentPassword)}
          aria-describedby={fieldErrors.currentPassword ? "password-current-error" : undefined}
        />
        {fieldErrors.currentPassword ? (
          <p className="form-field-error" id="password-current-error">
            {fieldErrors.currentPassword}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="password-new">Nueva contraseña</label>
        <input
          id="password-new"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={100}
          required
          aria-invalid={Boolean(fieldErrors.newPassword)}
          aria-describedby={
            fieldErrors.newPassword ? "password-new-hint password-new-error" : "password-new-hint"
          }
        />
        <p className="form-hint" id="password-new-hint">
          Mínimo 8 caracteres.
        </p>
        {fieldErrors.newPassword ? (
          <p className="form-field-error" id="password-new-error">
            {fieldErrors.newPassword}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="password-confirm">Confirmar nueva contraseña</label>
        <input
          id="password-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={fieldErrors.confirmPassword ? "password-confirm-error" : undefined}
        />
        {fieldErrors.confirmPassword ? (
          <p className="form-field-error" id="password-confirm-error">
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Cambiando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
};
