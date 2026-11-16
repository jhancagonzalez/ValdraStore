"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef } from "react";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false">
    <circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="m15.5 15.5 4.2 4.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Lupa del header con un diálogo de búsqueda real. Envía la consulta al
 * catálogo existente para no duplicar el estado de filtros en el cliente.
 */
export const SearchDialog = () => {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
  };

  const close = () => {
    dialogRef.current?.close();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputRef.current?.value.trim() ?? "";

    if (!query) {
      inputRef.current?.focus();
      return;
    }

    dialogRef.current?.close();
    router.push(`/catalogo?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <button type="button" className="icon-button" aria-label="Buscar prendas" onClick={open}>
        <SearchIcon />
      </button>
      <dialog ref={dialogRef} className="search-dialog" aria-labelledby="search-dialog-title">
        <form className="search-dialog-form" onSubmit={submit}>
          <h2 id="search-dialog-title" className="sr-only">
            Buscar prendas
          </h2>
          <label htmlFor="site-search" className="sr-only">
            Buscar prendas
          </label>
          <input
            ref={inputRef}
            id="site-search"
            name="q"
            type="search"
            placeholder="Buscar"
            autoComplete="off"
          />
          <button type="submit" className="button button-primary">
            Buscar
          </button>
          <button
            type="button"
            className="search-dialog-close"
            aria-label="Cerrar búsqueda"
            onClick={close}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="m5 5 10 10M15 5 5 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </form>
      </dialog>
    </>
  );
};
