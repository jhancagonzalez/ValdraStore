"use client";

import { useActionState } from "react";
import type { ProfileFieldValues, ProfileFormState } from "@/services/customers/profile";
import { saveProfile } from "./actions";

const INITIAL_STATE: ProfileFormState = { status: "idle" };

type ProfileFormProps = {
  profile: {
    email: string;
    lastName: string;
    name: string;
    phone: string | null;
  };
};

/** Editable personal data (HU-04); the browser never sends the customer id. */
export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const [state, formAction, pending] = useActionState(saveProfile, INITIAL_STATE);
  const fieldErrors = state.fieldErrors ?? {};
  const values: ProfileFieldValues = state.values ?? {
    email: profile.email,
    lastName: profile.lastName,
    name: profile.name,
    phone: profile.phone ?? "",
  };

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
        <label htmlFor="profile-name">Nombres</label>
        <input
          id="profile-name"
          name="name"
          type="text"
          autoComplete="given-name"
          defaultValue={values.name}
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
        <label htmlFor="profile-last-name">Apellidos</label>
        <input
          id="profile-last-name"
          name="lastName"
          type="text"
          autoComplete="family-name"
          defaultValue={values.lastName}
          required
          minLength={2}
          maxLength={80}
          aria-invalid={Boolean(fieldErrors.lastName)}
          aria-describedby={fieldErrors.lastName ? "profile-last-name-error" : undefined}
        />
        {fieldErrors.lastName ? (
          <p className="form-field-error" id="profile-last-name-error">
            {fieldErrors.lastName}
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
          defaultValue={values.email}
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "profile-email-error" : "profile-email-hint"}
        />
        {fieldErrors.email ? (
          <p className="form-field-error" id="profile-email-error">
            {fieldErrors.email}
          </p>
        ) : (
          <p className="form-hint" id="profile-email-hint">
            Si cambias el correo, te pediremos tu contraseña actual.
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="profile-current-password">Contraseña actual</label>
        <input
          id="profile-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.currentPassword)}
          aria-describedby={
            fieldErrors.currentPassword
              ? "profile-current-password-error"
              : "profile-current-password-hint"
          }
        />
        {fieldErrors.currentPassword ? (
          <p className="form-field-error" id="profile-current-password-error">
            {fieldErrors.currentPassword}
          </p>
        ) : (
          <p className="form-hint" id="profile-current-password-hint">
            Solo es necesaria para cambiar el correo electrónico.
          </p>
        )}
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
          defaultValue={values.phone}
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
