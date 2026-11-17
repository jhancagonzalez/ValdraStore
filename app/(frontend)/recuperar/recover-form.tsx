"use client";

import { useActionState } from "react";
import { type RecoverFormState, requestPasswordReset } from "./actions";

const INITIAL_STATE: RecoverFormState = { status: "idle" };

/** Step 1 of HU-03: ask for the reset link. */
export const RecoverForm = () => {
  const [state, formAction, pending] = useActionState(requestPasswordReset, INITIAL_STATE);

  return (
    <form className="form" action={formAction}>
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
        <label htmlFor="recover-email">Correo electrónico</label>
        <input id="recover-email" name="email" type="email" autoComplete="email" required />
      </div>

      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
};
