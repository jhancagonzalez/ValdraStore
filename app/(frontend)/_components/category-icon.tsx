import type { ReactNode } from "react";

type CategoryIconProps = {
  category: string;
  size?: number;
};

const paths: Record<string, ReactNode> = {
  camisetas: (
    <>
      <path
        d="M8 5 4 7l1.5 4 2-.8V19h9V10.2l2 .8L20 7l-4-2a4 4 0 0 1-8 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </>
  ),
  camisa: (
    <>
      <path
        d="M9 5 5 7l1.4 3.8 1.7-.8V19h7.8V10l1.7.8L19 7l-4-2-3 2.2L9 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 8.2V19M9.5 13h5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  hoodies: (
    <>
      <path
        d="M9 6 5 8l1.5 4 1.5-.7V19h8V11.3l1.5.7L19 8l-4-2-1 2h-4L9 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 7.5c.8 1.2 1.5 2 2.5 2s1.7-.8 2.5-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </>
  ),
  gorras: (
    <>
      <path
        d="M5 14a7 7 0 0 1 14 0v2H5v-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 16h14c0 1.7-1.2 2.5-3.5 2.5H8.5C6.2 18.5 5 17.7 5 16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </>
  ),
};

/** Iconos de línea para categorías reales del catálogo. */
export const CategoryIcon = ({ category, size = 17 }: CategoryIconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
    {paths[category] ?? (
      <path d="M5 5h14v14H5zM9 9h6M9 13h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    )}
  </svg>
);
