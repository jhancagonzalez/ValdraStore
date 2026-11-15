"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  formatFileSize,
  getScaledDimensions,
  MAX_REFERENCE_FILE_BYTES,
  REFERENCE_FILE_ACCEPT,
  validateReferenceBytes,
} from "@/lib/reference-upload";

type ReferenceUploadProps = {
  disabled?: boolean;
  /** Recibe la referencia ya reducida como data URL, o `null` al quitarla. */
  onChange: (dataUrl: string | null) => void;
};

type ReferencePreview = {
  dataUrl: string;
  fileName: string;
  height: number;
  size: number;
  width: number;
};

const readImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No pudimos leer la imagen."));
    image.src = url;
  });

/**
 * Carga de la imagen de referencia de HU-13. Valida el tipo real por los bytes
 * y el máximo de 10 MB, y reduce la imagen antes de enviarla: el cuerpo de una
 * función de Vercel Hobby no admite 10 MB en Base64.
 */
export const ReferenceUpload = ({ disabled = false, onChange }: ReferenceUploadProps) => {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ReferencePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    return () => {
      aliveRef.current = false;
    };
  }, []);

  const clear = () => {
    setPreview(null);
    setError(null);
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      clear();
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const validation = validateReferenceBytes(bytes);

      if (!validation.ok) {
        clear();
        setError(validation.message);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      let image: HTMLImageElement;

      try {
        image = await readImage(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      const dimensions = getScaledDimensions(image.naturalWidth, image.naturalHeight);

      if (dimensions.width === 0 || dimensions.height === 0) {
        clear();
        setError("La imagen no tiene dimensiones válidas.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d");

      if (!context) {
        clear();
        setError("Tu navegador no pudo procesar la imagen.");
        return;
      }

      context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      if (!aliveRef.current) {
        return;
      }

      setPreview({
        dataUrl,
        fileName: file.name,
        height: dimensions.height,
        size: file.size,
        width: dimensions.width,
      });
      onChange(dataUrl);
    } catch {
      if (aliveRef.current) {
        clear();
        setError("No pudimos leer la imagen. Prueba con otro archivo.");
      }
    } finally {
      if (aliveRef.current) {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="reference-upload">
      <div className="reference-upload-head">
        <label htmlFor={inputId}>Imagen de referencia (opcional)</label>
        <span className="form-hint">JPEG, PNG o WebP · máximo 10 MB</span>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        className="reference-upload-input"
        type="file"
        accept={REFERENCE_FILE_ACCEPT}
        disabled={disabled || processing}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          const file = event.target.files?.[0];
          void handleFile(file);
        }}
      />

      <p id={hintId} className="form-hint">
        Súbela si quieres que la IA tome el motivo o los colores de una imagen que ya tengas. Solo
        aceptamos los formatos indicados; si el archivo no sirve, lo rechazamos con el motivo.
      </p>

      {error ? (
        <p id={errorId} className="form-field-error" role="alert">
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="reference-upload-preview">
          {/* La vista previa es local: el archivo no se guarda en el servidor. */}
          {/* biome-ignore lint/performance/noImgElement: es una vista previa local, no una imagen del catálogo. */}
          <img src={preview.dataUrl} alt="Vista previa de la imagen de referencia" />
          <div className="reference-upload-meta">
            <p className="reference-upload-name">{preview.fileName}</p>
            <p className="form-hint">
              {formatFileSize(preview.size)} · {preview.width}×{preview.height} px
            </p>
            <button
              type="button"
              className="design-text-action"
              disabled={disabled || processing}
              onClick={clear}
            >
              Quitar imagen
            </button>
          </div>
        </div>
      ) : null}

      {processing ? (
        <p className="form-hint" role="status">
          Preparando la imagen…
        </p>
      ) : null}

      {!preview && !error ? (
        <p className="form-hint">
          Tamaño máximo aceptado: {formatFileSize(MAX_REFERENCE_FILE_BYTES)}.
        </p>
      ) : null}
    </div>
  );
};
