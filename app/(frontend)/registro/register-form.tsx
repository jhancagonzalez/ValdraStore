"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { PasswordStrength } from "../_components/password-strength";

type FieldErrors = Record<string, string>;

/** Walks a Payload error body and returns field issues plus every message. */
const parseErrorBody = (
  body: unknown,
): {
  issues: { field: string; message: string }[];
  messages: string[];
} => {
  const issues: { field: string; message: string }[] = [];
  const messages: string[] = [];

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }
    if (!node || typeof node !== "object") {
      return;
    }
    const record = node as Record<string, unknown>;
    const field =
      typeof record.path === "string"
        ? record.path
        : typeof record.field === "string"
          ? record.field
          : null;
    const message = typeof record.message === "string" ? record.message : null;
    if (message) {
      messages.push(message);
    }
    if (field && message) {
      issues.push({ field, message });
    }
    for (const value of Object.values(record)) {
      visit(value);
    }
  };

  visit(body);
  return { issues, messages };
};

/** Turns Payload's English validation messages into concrete Spanish copy. */
const translateIssue = (field: string, message: string): string => {
  const normalized = message.toLowerCase();

  if (field === "email") {
    if (/unique|already|registered|exist|único|unico|ya existe|registrad/.test(normalized)) {
      return "Este correo ya está registrado. Inicia sesión o usa otro correo.";
    }
    return "Escribe un correo electrónico válido.";
  }

  if (field === "password") {
    if (/short|length|caracteres|8/.test(normalized)) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    return "Revisa la contraseña: no cumple los requisitos.";
  }

  if (field === "name") {
    return "Escribe tus nombres (mínimo 2 caracteres).";
  }

  if (field === "lastName") {
    return "Escribe tus apellidos (mínimo 2 caracteres).";
  }

  return message;
};

/**
 * Public customer registration (HU-01). Empty or malformed fields are blocked
 * by the inputs and by Payload's own validation; duplicates and server errors
 * are reported with a specific message.
 */
export const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/api/customers", {
        body: JSON.stringify({
          email,
          lastName: String(form.get("lastName") ?? "").trim(),
          name: String(form.get("name") ?? "").trim(),
          password,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const { issues, messages } = parseErrorBody(body);
        const nextFieldErrors: FieldErrors = {};

        for (const issue of issues) {
          const field = issue.field.split(".").pop() ?? issue.field;
          nextFieldErrors[field] ??= translateIssue(field, issue.message);
        }

        setFieldErrors(nextFieldErrors);
        const firstFieldError = Object.values(nextFieldErrors)[0];
        if (firstFieldError) {
          setError(firstFieldError);
          return;
        }

        // The password policy throws a message without a field path.
        const combined = messages.join(" ");
        if (/contraseña|password/i.test(combined)) {
          const message = "La contraseña debe tener al menos 8 caracteres.";
          setError(message);
          setFieldErrors({ password: message });
          return;
        }

        // Payload's rate limiter explains how long to wait; keep that copy
        // instead of the generic failure (registration session bug report).
        if (response.status === 429) {
          setError(combined || "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
          return;
        }

        setError(
          response.status >= 500
            ? "No se pudo crear la cuenta. Inténtalo de nuevo en unos minutos."
            : "No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.",
        );
        return;
      }

      const login = await fetch("/api/customers/login", {
        body: JSON.stringify({ email, password }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!login.ok) {
        router.push("/login");
        return;
      }

      // The success message lives on /cuenta: keeping it on /registro made it
      // disappear almost immediately when the authenticated page redirected.
      router.push("/cuenta?bienvenida=1");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <form className="form" onSubmit={onSubmit} noValidate={false}>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-field">
          <label htmlFor="name">Nombres*</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Escribe tus nombres"
            autoComplete="given-name"
            required
            minLength={2}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p className="form-field-error" id="name-error">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="lastName">Apellidos*</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Escribe tus apellidos"
            autoComplete="family-name"
            required
            minLength={2}
            aria-invalid={Boolean(fieldErrors.lastName)}
            aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
          />
          {fieldErrors.lastName ? (
            <p className="form-field-error" id="lastName-error">
              {fieldErrors.lastName}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="email">Correo electrónico*</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Escribe tu correo electrónico"
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p className="form-field-error" id="email-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="password">Contraseña*</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : password ? undefined : "password-hint"
            }
          />
          {fieldErrors.password ? (
            <p className="form-field-error" id="password-error">
              {fieldErrors.password}
            </p>
          ) : password ? null : (
            <p className="form-hint" id="password-hint">
              Mínimo 8 caracteres.
            </p>
          )}
          <PasswordStrength value={password} />
        </div>
        <p className="form-terms">
          Al hacer clic en continuar, acepto los{" "}
          <Link href="/terminos">Términos y Condiciones</Link> de Valdra Store y autorizo el
          tratamiento de mis datos personales de acuerdo con la{" "}
          <Link href="/terminos#datos-personales">Política de Privacidad</Link>.
        </p>
        <button type="submit" className="button button-primary" disabled={pending}>
          {pending ? "Creando cuenta…" : "Continuar"}
        </button>
      </form>
      <p className="form-footer">
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </>
  );
};
