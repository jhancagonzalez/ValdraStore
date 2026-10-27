"use client";

import { useActionState } from "react";
import type { ProfileFormState } from "@/services/customers/profile";
import { saveProfile } from "./actions";

const INITIAL_STATE: ProfileFormState = { status: "idle" };

type ProfileFormProps = {
  profile: {
    email: string;
    name: string;
    phone: string | null;
  };
};

/** Editable personal data (HU-04); the browser never sends the customer id. */
export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const [state, formAction, pending] = useActionState(saveProfile, INITIAL_STATE);
  const fieldErrors = state.fieldErrors ?? {};

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
        <label htmlFor="profile-name">Nombre</label>
        <input
          id="profile-name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={profile.name}
          required
          minLength={2}
          maxLength={80}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "profile-name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p className="form-field-error" id="profile-name-error">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="profile-email">Correo electrónico</label>
        <input
          id="profile-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={profile.email}
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "profile-email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p className="form-field-error" id="profile-email-error">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="profile-phone">Teléfono</label>
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          defaultValue={profile.phone ?? ""}
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? "profile-phone-error" : undefined}
        />
        {fieldErrors.phone ? (
          <p className="form-field-error" id="profile-phone-error">
            {fieldErrors.phone}
          </p>
        ) : null}
      </div>

      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
};
