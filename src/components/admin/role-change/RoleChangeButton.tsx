"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RoleChangeButtonProps = {
  adminRoute: string;
  apiRoute: string;
  blocker: string | null;
  collection: string;
  currentRole: string;
  id: string;
  targetRole: string;
};

type ChangeRoleResponse = {
  collection?: string;
  id?: number | string;
  message?: string;
};

type PanelButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  size: "large" | "small";
  variant: "primary" | "secondary";
};

/** Same markup and classes as Payload's Button, so the admin stylesheet applies. */
const PanelButton = ({ children, disabled, onClick, size, variant }: PanelButtonProps) => (
  <button
    className={[
      "btn",
      "btn--icon-style-without-border",
      `btn--size-${size}`,
      "btn--withoutPopup",
      `btn--style-${variant}`,
      disabled ? "btn--disabled" : "",
    ]
      .filter(Boolean)
      .join(" ")}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    <span className="btn__content">
      <span className="btn__label">{children}</span>
    </span>
  </button>
);

/**
 * Calls the HU-05 endpoint and opens the account in its new collection. The
 * confirmation reuses the classes of Payload's ConfirmationModal.
 */
export const RoleChangeButton = ({
  adminRoute,
  apiRoute,
  blocker,
  collection,
  currentRole,
  id,
  targetRole,
}: RoleChangeButtonProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending]);

  const openDialog = () => {
    setError(null);
    setOpen(true);
  };

  const changeRole = async () => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`${apiRoute}/${collection}/${id}/change-role`, {
        credentials: "include",
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as ChangeRoleResponse;

      if (!response.ok || !body.collection || body.id === undefined) {
        setError(body.message ?? "No se pudo cambiar el rol.");
        setPending(false);
        return;
      }

      window.location.assign(`${adminRoute}/collections/${body.collection}/${body.id}`);
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      setPending(false);
    }
  };

  // Not `payload__modal-item`: Payload's modal library hides that class unless it
  // opened the modal itself. The confirmation-modal classes carry the look.
  const dialog = (
    <div style={{ inset: 0, position: "fixed", zIndex: "var(--z-modal)" }}>
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className="confirmation-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="confirmation-modal__wrapper">
          <div className="confirmation-modal__content">
            <h1 id={headingId}>Cambiar rol a {targetRole}</h1>
            <p>
              La cuenta dejará de ser <strong>{currentRole}</strong> y pasará a{" "}
              <strong>{targetRole}</strong> con el mismo correo y contraseña. Se cerrarán sus
              sesiones abiertas y el nuevo rol se aplicará en su siguiente inicio de sesión.
            </p>
            {error ? (
              <p role="alert" style={{ color: "var(--theme-error-500)" }}>
                {error}
              </p>
            ) : null}
          </div>
          <div className="confirmation-modal__controls">
            <PanelButton
              disabled={pending}
              onClick={() => setOpen(false)}
              size="large"
              variant="secondary"
            >
              Cancelar
            </PanelButton>
            <PanelButton disabled={pending} onClick={changeRole} size="large" variant="primary">
              {pending ? "Cambiando rol…" : "Confirmar"}
            </PanelButton>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="field-type" style={{ marginBottom: "calc(var(--base) * 1.5)" }}>
      <p className="field-label">Rol de la cuenta</p>
      <p>
        Rol actual: <strong>{currentRole}</strong>
      </p>
      {blocker ? (
        <p>{blocker}</p>
      ) : (
        <PanelButton onClick={openDialog} size="small" variant="secondary">
          Cambiar a {targetRole}
        </PanelButton>
      )}
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.85em" }}>
        El cambio cierra las sesiones de la cuenta y se aplica en su siguiente inicio de sesión.
      </p>
      {open ? createPortal(dialog, document.body) : null}
    </div>
  );
};
