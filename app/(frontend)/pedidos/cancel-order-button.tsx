"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/contact";
import { cancelOrder } from "./actions";

type CancelOrderButtonProps = {
  orderNumber: string;
};

/** Cancelación del pedido por el cliente, con confirmación y foco controlado. */
export const CancelOrderButton = ({ orderNumber }: CancelOrderButtonProps) => {
  const router = useRouter();
  const warningId = useId();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<{
    message: string;
    reason?: "not_cancellable";
  } | null>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousConfirming = useRef(confirming);
  const submitting = useRef(false);

  // Mantiene el foco en el botón que revela cada paso de la confirmación.
  useEffect(() => {
    if (previousConfirming.current === confirming) {
      return;
    }
    previousConfirming.current = confirming;
    (confirming ? confirmButtonRef : startButtonRef).current?.focus();
  }, [confirming]);

  const cancel = async () => {
    if (submitting.current) {
      return;
    }

    submitting.current = true;
    setPending(true);
    setError(null);

    try {
      const result = await cancelOrder(orderNumber);

      if (result.status === "success") {
        setDone(result.message ?? "Pedido cancelado.");
        router.refresh();
        return;
      }

      setError({
        message: result.message ?? "No pudimos cancelar el pedido. Inténtalo de nuevo.",
        reason: result.reason,
      });
    } catch {
      setError({
        message: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  if (done) {
    return (
      <p className="form-success" role="status">
        {done}
      </p>
    );
  }

  return (
    <div className="order-cancel">
      {confirming ? (
        <>
          <p className="form-hint" id={warningId}>
            ¿Cancelar el pedido #{orderNumber}? Se devolverá el stock y no se podrá reabrir.
          </p>
          {error ? (
            <>
              <p className="form-error" role="alert">
                {error.message}
              </p>
              {error.reason === "not_cancellable" ? (
                <p className="form-hint">
                  Escríbenos a <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a> para revisar el
                  caso.
                </p>
              ) : null}
            </>
          ) : null}
          <div className="account-danger-actions">
            <button
              ref={confirmButtonRef}
              type="button"
              className="button button-danger"
              onClick={() => {
                void cancel();
              }}
              disabled={pending}
              aria-busy={pending}
              aria-describedby={warningId}
            >
              {pending ? "Cancelando pedido…" : "Sí, cancelar pedido"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={pending}
            >
              No, conservar
            </button>
          </div>
        </>
      ) : (
        <button
          ref={startButtonRef}
          type="button"
          className="button button-secondary"
          onClick={() => setConfirming(true)}
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
};
