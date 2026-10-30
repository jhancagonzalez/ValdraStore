"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteAccount } from "./actions";

/** Two-step confirmation for the destructive account deletion (HU-04). */
export const DeleteAccount = () => {
  const router = useRouter();
  const [step, setStep] = useState<"confirm" | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousStep = useRef(step);

  // Moves focus to the button each step reveals, so keyboard users stay oriented.
  useEffect(() => {
    if (previousStep.current === step) {
      return;
    }
    previousStep.current = step;
    (step === "confirm" ? confirmButtonRef : startButtonRef).current?.focus();
  }, [step]);

  const remove = async () => {
    setPending(true);
    setError(null);

    const result = await deleteAccount();

    if (result.status !== "success") {
      setError(result.message ?? "No se pudo eliminar la cuenta. Inténtalo de nuevo.");
      setPending(false);
      return;
    }

    await fetch("/api/customers/logout", { credentials: "include", method: "POST" }).catch(
      () => null,
    );
    router.push("/");
    router.refresh();
  };

  return (
    <div className="account-danger">
      <h2 className="detail-label">Eliminar cuenta</h2>

      {step === "idle" ? (
        <>
          <p className="form-hint">
            Borra tu cuenta y tus datos personales. Esta acción no se puede deshacer.
          </p>
          <button
            type="button"
            className="button button-danger"
            onClick={() => setStep("confirm")}
            ref={startButtonRef}
          >
            Eliminar mi cuenta
          </button>
        </>
      ) : (
        <>
          <p className="form-hint">¿Seguro? Tu cuenta se eliminará de forma permanente.</p>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="account-danger-actions">
            <button
              type="button"
              className="button button-danger"
              onClick={remove}
              disabled={pending}
              ref={confirmButtonRef}
            >
              {pending ? "Eliminando…" : "Sí, eliminar mi cuenta"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setStep("idle");
                setError(null);
              }}
              disabled={pending}
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
};
