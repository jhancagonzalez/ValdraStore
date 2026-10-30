"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { PasswordStrength } from "../_components/password-strength";
import type { ResetPasswordState } from "./actions";
import { submitNewPassword } from "./actions";

const INITIAL_STATE: ResetPasswordState = { status: "idle" };

type ResetPasswordFormProps = {
  token: string;
};

/** Step 2 of HU-03: choose a new password for the token from the email link. */
export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [state, formAction, pending] = useActionState(submitNewPassword, INITIAL_STATE);
  const [password, setPassword] = useState("");

  if (state.status === "success") {
    return (
      <div className="account-card">
        <p className="form-success" role="status">
          {state.message}
        </p>
        <Link className="button button-primary" href="/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form className="form" action={formAction}>
      <input type="hidden" name="token" value={token} />

      {state.status === "error" && state.message ? (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="new-password">Nueva contraseña</label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={100}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordStrength value={password} />
      </div>

      <div className="form-field">
        <label htmlFor="new-password-confirmation">Confirma la contraseña</label>
        <input
          id="new-password-confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={100}
        />
      </div>

      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
};
