"use client";

import type { ReactNode, Ref } from "react";

export type DesignNoticeTone = "error" | "warning" | "info";

export type DesignNoticeAction = {
  label: string;
  onClick: () => void;
};

type DesignNoticeProps = {
  actions?: DesignNoticeAction[];
  children: ReactNode;
  id?: string;
  noticeRef?: Ref<HTMLDivElement>;
  title: string;
  tone: DesignNoticeTone;
};

const ToneIcon = ({ tone }: { tone: DesignNoticeTone }) => (
  <svg
    className="design-notice-icon"
    viewBox="0 0 20 20"
    width="20"
    height="20"
    aria-hidden="true"
    focusable="false"
  >
    {tone === "info" ? (
      <>
        <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9v5M10 6.2v.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </>
    ) : (
      <>
        <path
          d="M10 2.5 18 17H2L10 2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M10 8v4.5M10 14.6v.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </>
    )}
  </svg>
);

/**
 * Aviso destacado del personalizador: ícono, título corto, explicación y acciones
 * para resolver el problema sin buscar en la página. Los errores se anuncian con
 * `role="alert"`; el resto, como estado.
 */
export const DesignNotice = ({
  actions,
  children,
  id,
  noticeRef,
  title,
  tone,
}: DesignNoticeProps) => (
  <div
    id={id}
    ref={noticeRef}
    className="design-notice"
    data-tone={tone}
    role={tone === "error" ? "alert" : "status"}
    tabIndex={-1}
  >
    <ToneIcon tone={tone} />
    <div className="design-notice-body">
      <p className="design-notice-title">{title}</p>
      <div className="design-notice-text">{children}</div>
      {actions?.length ? (
        <div className="design-notice-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="design-notice-action"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);
