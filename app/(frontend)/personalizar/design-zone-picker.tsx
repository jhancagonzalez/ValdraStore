import { type MockupSelection, REVISION_ZONE_PRESETS } from "@/lib/mockup-selection";

type DesignZonePickerProps = {
  generating: boolean;
  onAdjust: (patch: Partial<MockupSelection>) => void;
  onSelectFree: () => void;
  onSelectZone: (zone: { id: string; selection: MockupSelection }) => void;
  selection: MockupSelection | null;
  selectionZone: string | null;
};

/** Zona del diseño anterior que se va a modificar (HU-16). */
export const DesignZonePicker = ({
  generating,
  onAdjust,
  onSelectFree,
  onSelectZone,
  selection,
  selectionZone,
}: DesignZonePickerProps) => (
  <fieldset className="design-zone-picker" disabled={generating}>
    <legend>Zona a cambiar</legend>
    <div className="design-zone-options">
      <button
        type="button"
        className="design-zone"
        aria-pressed={selectionZone === "custom"}
        onClick={onSelectFree}
      >
        Selección libre
      </button>
      {REVISION_ZONE_PRESETS.map((zone) => (
        <button
          key={zone.id}
          type="button"
          className="design-zone"
          aria-pressed={selectionZone === zone.id}
          onClick={() => onSelectZone(zone)}
        >
          {zone.label}
        </button>
      ))}
    </div>
    {selection ? (
      <div className="design-zone-adjustments">
        <fieldset className="design-zone-options" aria-label="Mover la zona">
          <button
            type="button"
            className="design-zone"
            aria-label="Mover a la izquierda"
            onClick={() => onAdjust({ x: selection.x - 0.02 })}
          >
            ←
          </button>
          <button
            type="button"
            className="design-zone"
            aria-label="Mover hacia arriba"
            onClick={() => onAdjust({ y: selection.y - 0.02 })}
          >
            ↑
          </button>
          <button
            type="button"
            className="design-zone"
            aria-label="Mover hacia abajo"
            onClick={() => onAdjust({ y: selection.y + 0.02 })}
          >
            ↓
          </button>
          <button
            type="button"
            className="design-zone"
            aria-label="Mover a la derecha"
            onClick={() => onAdjust({ x: selection.x + 0.02 })}
          >
            →
          </button>
        </fieldset>
        <label>
          Ancho de la zona
          <input
            type="range"
            min="2"
            max="100"
            value={Math.round(selection.width * 100)}
            onChange={(event) => onAdjust({ width: Number(event.target.value) / 100 })}
          />
        </label>
        <label>
          Alto de la zona
          <input
            type="range"
            min="2"
            max="100"
            value={Math.round(selection.height * 100)}
            onChange={(event) => onAdjust({ height: Number(event.target.value) / 100 })}
          />
        </label>
      </div>
    ) : null}
    <p className="form-hint">
      Marca espacio libre para el elemento nuevo. Lo que quede fuera se conserva; el elemento puede
      tapar contenido dentro de la zona.
    </p>
    <p className="form-hint">Arrastra sobre la prenda para marcar una selección libre.</p>
  </fieldset>
);
