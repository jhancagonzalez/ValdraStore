import type { CSSProperties } from "react";

type SkeletonProps = {
  style?: CSSProperties;
};

/**
 * Bloque decorativo para estados de carga. El contenedor que lo usa anuncia
 * con `role="status"` qué se está cargando; el esqueleto queda oculto para
 * lectores de pantalla.
 */
export const Skeleton = ({ style }: SkeletonProps) => (
  <span className="skeleton" style={style} aria-hidden="true" />
);
