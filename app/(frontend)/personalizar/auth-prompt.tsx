"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { MockupSize } from "@/lib/mockup-bases";

type AuthPromptProps = {
  nextPath: string;
  onClose: () => void;
  open: boolean;
  selectedName: string;
  selectedSize: MockupSize | null;
};

/** Diálogo que conserva la selección y lleva a iniciar sesión o crear cuenta. */
export const AuthPrompt = ({
  nextPath,
  onClose,
  open,
  selectedName,
  selectedSize,
}: AuthPromptProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="auth-dialog-backdrop">
      <div
        id="auth-dialog"
        ref={dialogRef}
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        aria-describedby="auth-dialog-description"
        tabIndex={-1}
      >
        <h2 id="auth-dialog-title">Inicia sesión para personalizar</h2>
        <p id="auth-dialog-description">
          Conserva tu prenda, talla y color y continúa con tu idea de diseño.
        </p>
        <p className="auth-dialog-selection">
          {selectedName} · Talla {selectedSize}
        </p>
        <p className="auth-dialog-note">
          Tu selección se conserva al iniciar sesión o crear tu cuenta.
        </p>
        <div className="auth-dialog-actions">
          <Link
            className="button button-primary"
            href={`/login?next=${encodeURIComponent(nextPath)}`}
          >
            Iniciar sesión
          </Link>
          <Link
            className="button button-secondary"
            href={`/registro?next=${encodeURIComponent(nextPath)}`}
          >
            Crear cuenta
          </Link>
          <button type="button" className="auth-dialog-dismiss" onClick={onClose}>
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  );
};
