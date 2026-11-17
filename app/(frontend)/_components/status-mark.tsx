/**
 * Marca de estado animada, inspirada en `StatusMark` de React Bits. Es
 * puramente decorativa: el texto del contenedor anuncia el proceso.
 */
export const StatusMark = () => (
  <span className="status-mark" aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);
