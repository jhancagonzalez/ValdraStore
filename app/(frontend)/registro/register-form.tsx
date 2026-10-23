"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

/** Looks for a field-level validation message anywhere in a Payload error body. */
const findFieldMessage = (body: unknown, field: string): string | null => {
  if (!body || typeof body !== "object") {
    return null;
  }
  const queue: unknown[] = [body];
  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (current && typeof current === "object") {
      const record = current as Record<string, unknown>;
      if (record.field === field || record.path === field) {
        if (typeof record.message === "string") {
          return record.message;
        }
      }
      queue.push(...Object.values(record));
    }
  }
  return null;
};

/**
 * Public customer registration (HU-01). Empty or malformed fields are blocked
 * by the inputs and by Payload's own validation; duplicates are reported.
 */
export const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/api/customers", {
        body: JSON.stringify({
          email,
          name: String(form.get("name") ?? "").trim(),
          password,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const emailMessage = findFieldMessage(body, "email");
        if (emailMessage?.toLowerCase().match(/unique|already registered/)) {
          setError("Este correo ya está registrado. Inicia sesión o usa otro correo.");
        } else if (emailMessage) {
          setError("Revisa el correo: no tiene un formato válido.");
        } else {
          setError("Revisa los datos: no se pudo crear la cuenta.");
        }
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

      router.push("/cuenta");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-field">
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" type="text" autoComplete="name" required minLength={2} />
      </div>
      <div className="form-field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="form-field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
};
