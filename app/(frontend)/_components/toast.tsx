"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastTone = "error" | "info" | "success";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastApi = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 5000;

const ToneIcon = ({ tone }: { tone: ToastTone }) => (
  <svg
    className="toast-icon"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    {tone === "success" ? (
      <path d="m3 10.5 4.5 4.5L17 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    ) : tone === "error" ? (
      <>
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 5.5v5.5M10 14.2v.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </>
    ) : (
      <>
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9v5M10 5.8v.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </>
    )}
  </svg>
);

/**
 * Notificaciones no bloqueantes, sin dependencias externas. Se anuncian con
 * `aria-live` y mantienen los errores de formulario inline.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      nextId.current += 1;
      const id = nextId.current;
      setItems((current) => [...current.slice(-3), { ...input, id }]);
      const timer = window.setTimeout(() => dismiss(id), input.duration ?? DEFAULT_DURATION);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        window.clearTimeout(timer);
      }
      pending.clear();
    };
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {items.map((item) => {
          const tone = item.tone ?? "info";
          return (
            <div key={item.id} className="toast" data-tone={tone}>
              <ToneIcon tone={tone} />
              <div className="toast-body">
                <p className="toast-title">{item.title}</p>
                {item.description ? <p className="toast-description">{item.description}</p> : null}
              </div>
              <button
                type="button"
                className="toast-dismiss"
                aria-label={`Cerrar notificación: ${item.title}`}
                onClick={() => dismiss(item.id)}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path
                    d="m3 3 10 10M13 3 3 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
};
