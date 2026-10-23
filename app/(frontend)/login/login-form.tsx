"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const GENERIC_ERROR = "Correo o contraseña incorrectos. Inténtalo de nuevo.";

/** Signs in via Payload REST; never reveals which credential failed (HU-02). */
export const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/customers/login", {
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setError(GENERIC_ERROR);
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
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="form-field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
};
