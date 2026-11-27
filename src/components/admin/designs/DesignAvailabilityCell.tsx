import type { DefaultServerCellComponentProps } from "payload";
import { designAvailabilityLabel } from "@/lib/design-visibility";

/** HU-23: muestra «Disponible» u «Oculto» en la lista de diseños del panel. */
export const DesignAvailabilityCell = ({ cellData }: DefaultServerCellComponentProps) => {
  const visible = cellData !== false;

  return (
    <span
      style={{
        background: visible ? "var(--theme-success-100)" : "var(--theme-elevation-100)",
        borderRadius: "999px",
        color: visible ? "var(--theme-success-800)" : "var(--theme-elevation-800)",
        display: "inline-block",
        fontSize: "0.8125rem",
        fontWeight: 600,
        lineHeight: 1.4,
        padding: "2px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {designAvailabilityLabel(cellData)}
    </span>
  );
};
