"use client";

import { useId, useRef, useState } from "react";

export type Approval = {
  approvedAt: string;
  id: number;
};

type ApproveDesignProps = {
  baseId: string;
  disabled?: boolean;
  idea: string;
  image: string;
  onApproved: (approval: Approval) => void;
  size: string;
};

/**
 * Aprobación del diseño final (HU-17). Pide confirmación explícita antes de
 * registrar el diseño y muestra el error del servidor sin cerrar el diálogo.
 */
export const ApproveDesign = ({
  baseId,
  disabled = false,
  idea,
  image,
  onApproved,
  size,
}: ApproveDesignProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDialog = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    if (!sending) {
      dialogRef.current?.close();
    }
  };

  const confirm = async () => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/personalization/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseId, idea, image, size }),
      });
      const data = (await response.json().catch(() => null)) as {
        approvedAt?: unknown;
        error?: unknown;
        id?: unknown;
      } | null;

      if (!response.ok || typeof data?.id !== "number") {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "No pudimos registrar la aprobación. Inténtalo de nuevo.";
        throw new Error(message);
      }

      onApproved({
        approvedAt: typeof data.approvedAt === "string" ? data.approvedAt : "",
        id: data.id,
      });
      dialogRef.current?.close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No pudimos registrar la aprobación. Inténtalo de nuevo.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="button button-primary"
        disabled={disabled}
        onClick={openDialog}
      >
        Aprobar diseño
      </button>

      <dialog
        ref={dialogRef}
        className="approval-dialog"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (sending) {
            event.preventDefault();
          }
        }}
      >
        <div className="approval-dialog-body">
          <h3 id={titleId}>¿Confirmas este diseño?</h3>
          <p id={descriptionId}>
            Al aprobarlo queda registrado en tu cuenta y ya no se puede modificar. Para hacer
            cambios tendrás que iniciar una nueva personalización.
          </p>

          {error ? (
            <p className="form-field-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="approval-dialog-actions">
            <button
              type="button"
              className="button button-primary"
              aria-busy={sending}
              disabled={sending}
              onClick={() => {
                void confirm();
              }}
            >
              {sending ? "Guardando…" : "Sí, aprobar"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={sending}
              onClick={closeDialog}
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};
