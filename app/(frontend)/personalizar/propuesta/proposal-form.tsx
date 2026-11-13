"use client";

import Image from "next/image";
import { type FormEvent, useRef, useState } from "react";

const REFERENCE_ACCEPT = "image/jpeg,image/png,image/webp";

/** Límite aprobado para la imagen de referencia (HU-13). */
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024;

/** El servidor admite hasta 240 s; el navegador corta un poco antes. */
const CLIENT_TIMEOUT_MS = 250_000;

type ProposalOption = {
  id: string;
  name: string;
};

type ProposalFormProps = {
  bases: ProposalOption[];
  initialBaseId: string;
  initialSize: string;
  sizes: readonly string[];
};

type RequestState = "error" | "generating" | "idle" | "success";

type ProposalImage = {
  dataUrl: string;
  model: string;
  provider: string;
};

type FieldErrors = {
  idea?: string;
  referenceImage?: string;
};

export const ProposalForm = ({ bases, initialBaseId, initialSize, sizes }: ProposalFormProps) => {
  const [baseId, setBaseId] = useState(initialBaseId);
  const [size, setSize] = useState(initialSize);
  const [idea, setIdea] = useState("");
  const [reference, setReference] = useState<File | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [proposal, setProposal] = useState<ProposalImage | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ideaRef = useRef<HTMLTextAreaElement | null>(null);

  const generating = state === "generating";
  const selectedName = bases.find((base) => base.id === baseId)?.name ?? "tu prenda";

  const showError = (nextMessage: string, errors: FieldErrors = {}) => {
    setFieldErrors(errors);
    setMessage(nextMessage);
    setState("error");
  };

  const generate = async () => {
    const trimmedIdea = idea.trim();

    if (trimmedIdea === "") {
      showError("Revisa los datos marcados y vuelve a intentarlo.", {
        idea: "Describe tu idea antes de generar la propuesta.",
      });
      ideaRef.current?.focus();
      return;
    }

    if (reference && reference.size > MAX_REFERENCE_BYTES) {
      showError("Revisa los datos marcados y vuelve a intentarlo.", {
        referenceImage: "La imagen de referencia supera el máximo de 10 MB.",
      });
      return;
    }

    const form = new FormData();
    form.append("baseId", baseId);
    form.append("size", size);
    form.append("idea", trimmedIdea);

    if (reference) {
      form.append("referenceImage", reference);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    setFieldErrors({});
    setMessage(null);
    setProposal(null);
    setState("generating");

    try {
      const response = await fetch("/api/ai/proposal", {
        body: form,
        method: "POST",
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as {
        error?: unknown;
        image?: unknown;
        model?: unknown;
        provider?: unknown;
      } | null;

      if (!response.ok || typeof data?.image !== "string") {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "No pudimos generar la propuesta. Inténtalo de nuevo.",
        );
      }

      setProposal({
        dataUrl: data.image,
        model: typeof data.model === "string" ? data.model : "",
        provider: typeof data.provider === "string" ? data.provider : "",
      });
      setState("success");
    } catch (error) {
      showError(
        controller.signal.aborted
          ? "La generación tardó demasiado o se canceló. Inténtalo de nuevo."
          : error instanceof Error
            ? error.message
            : "No pudimos generar la propuesta. Inténtalo de nuevo.",
      );
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!generating) {
      void generate();
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="proposal-layout">
      <form className="form proposal-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="proposal-fieldset" disabled={generating}>
          <legend className="proposal-legend">1. Tu prenda</legend>
          <div className="proposal-row">
            <label className="proposal-field">
              <span>Prenda</span>
              <select
                name="baseId"
                onChange={(event) => setBaseId(event.target.value)}
                value={baseId}
              >
                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="proposal-field">
              <span>Talla</span>
              <select name="size" onChange={(event) => setSize(event.target.value)} value={size}>
                {sizes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="proposal-fieldset" disabled={generating}>
          <legend className="proposal-legend">2. Tu idea</legend>
          <label className="proposal-field">
            <span>Describe el diseño que quieres</span>
            <textarea
              aria-describedby={fieldErrors.idea ? "proposal-idea-error" : "proposal-idea-hint"}
              aria-invalid={Boolean(fieldErrors.idea)}
              name="idea"
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Por ejemplo: un tigre geométrico en tonos verdes, centrado en el pecho"
              ref={ideaRef}
              rows={5}
              value={idea}
            />
          </label>
          {fieldErrors.idea ? (
            <p className="form-field-error" id="proposal-idea-error">
              {fieldErrors.idea}
            </p>
          ) : (
            <p className="form-hint" id="proposal-idea-hint">
              La idea no puede quedar vacía. Evita pedir logos o marcas registradas.
            </p>
          )}

          <label className="proposal-field">
            <span>Imagen de referencia (opcional)</span>
            <input
              accept={REFERENCE_ACCEPT}
              name="referenceImage"
              onChange={(event) => setReference(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          {fieldErrors.referenceImage ? (
            <p className="form-field-error">{fieldErrors.referenceImage}</p>
          ) : (
            <p className="form-hint">JPEG, PNG o WebP de hasta 10 MB.</p>
          )}
        </fieldset>

        <div className="proposal-actions">
          <button className="button button-primary" disabled={generating} type="submit">
            {generating ? "Generando…" : state === "error" ? "Reintentar" : "Generar propuesta"}
          </button>
          {generating ? (
            <button className="button button-secondary" onClick={cancel} type="button">
              Cancelar
            </button>
          ) : null}
        </div>

        {generating ? (
          <p aria-live="polite" className="proposal-status" role="status">
            <span aria-hidden="true" className="proposal-spinner" />
            Tu diseño se está generando…
          </p>
        ) : null}

        {state === "error" && message ? (
          <p className="form-error" role="alert">
            {message}
          </p>
        ) : null}
      </form>

      <section aria-live="polite" className="proposal-result">
        <p className="proposal-step-label">Resultado</p>
        {proposal ? (
          <figure className="proposal-figure">
            <Image
              alt={`Propuesta de diseño generada para ${selectedName}`}
              height={1024}
              src={proposal.dataUrl}
              unoptimized
              width={1024}
            />
            <figcaption>
              Propuesta generada con {proposal.provider}
              {proposal.model ? ` (${proposal.model})` : ""}. Todavía no está aprobada.
            </figcaption>
          </figure>
        ) : (
          <div className="proposal-placeholder">
            <p>
              {generating
                ? "Preparando tu propuesta…"
                : "Aquí verás la propuesta cuando esté lista."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
