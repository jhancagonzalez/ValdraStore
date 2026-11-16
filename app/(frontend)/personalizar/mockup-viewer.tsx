"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getMockupBaseName, type MockupBase, type MockupSize } from "@/lib/mockup-bases";
import { getMockupAlt, getMockupSummary } from "@/lib/mockup-summary";

type MockupViewerProps = {
  base: MockupBase;
  size: MockupSize | null;
  imageSrc: string;
  label?: string;
};

/**
 * Visor del mockup de HU-15: muestra la propuesta sobre la prenda con su
 * resumen legible y permite ampliarla en un diálogo modal.
 */
export const MockupViewer = ({
  base,
  size,
  imageSrc,
  label = "Propuesta sobre tu prenda",
}: MockupViewerProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const lastSrcRef = useRef(imageSrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (lastSrcRef.current !== imageSrc) {
      lastSrcRef.current = imageSrc;
      setFailed(false);
    }
  }, [imageSrc]);

  const openZoom = () => dialogRef.current?.showModal();
  const closeZoom = () => dialogRef.current?.close();

  const alt = getMockupAlt(base, size);

  return (
    <figure className="design-compare-item mockup-viewer">
      <figcaption className="design-compare-label">{label}</figcaption>
      {failed ? (
        <p className="mockup-viewer-error" role="alert">
          No pudimos mostrar el mockup. Genera la propuesta de nuevo.
        </p>
      ) : (
        <button
          type="button"
          className="design-compare-frame mockup-viewer-frame"
          onClick={openZoom}
          aria-label={`Ampliar el mockup: ${alt}`}
        >
          <Image
            src={imageSrc}
            alt={alt}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1240px) 44vw, 520px"
            unoptimized
            onError={() => setFailed(true)}
          />
          <span className="mockup-viewer-zoom-hint" aria-hidden="true">
            Ampliar
          </span>
        </button>
      )}
      <dl className="mockup-viewer-summary">
        {getMockupSummary(base, size).map((item) => (
          <div className="mockup-viewer-summary-item" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <dialog ref={dialogRef} className="mockup-viewer-dialog" aria-label="Mockup ampliado">
        <div className="mockup-viewer-dialog-body">
          <Image
            className="mockup-viewer-dialog-image"
            src={imageSrc}
            alt={alt}
            width={1024}
            height={1024}
            unoptimized
          />
          <p className="mockup-viewer-dialog-meta">
            {getMockupBaseName(base)}
            {size ? ` · Talla ${size}` : ""}
          </p>
          <button
            type="button"
            className="button button-secondary mockup-viewer-close"
            onClick={closeZoom}
          >
            Cerrar
          </button>
        </div>
      </dialog>
    </figure>
  );
};
