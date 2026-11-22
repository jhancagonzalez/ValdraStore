"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/contact";
import { cancelOrder } from "./actions";

type CancelOrderButtonProps = {
  orderNumber: string;
};

/** Cancelación del pedido por el cliente, con confirmación. */
export const CancelOrderButton = ({ orderNumber }: CancelOrderButtonProps) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{
    message: string;
    reason?: "not_cancellable";
  } | null>(null);

  const cancel = async () => {
    setPending(true);
    setError(null);

    const result = await cancelOrder(orderNumber);

    if (result.status === "success") {
      router.refresh();
      return;
    }

    setError({
      message: result.message ?? "No pudimos cancelar el pedido.",
      reason: result.reason,
    });
    setPending(false);
  };

  return (
    <div className="order-cancel">
      {confirming ? (
        <>
          <p className="form-hint">
            ¿Seguro? Se devolverá el stock y el pedido no se puede reabrir.
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
              type="button"
              className="button button-danger"
              onClick={() => {
                void cancel();
              }}
              disabled={pending}
            >
              {pending ? "Cancelando…" : "Sí, cancelar pedido"}
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
