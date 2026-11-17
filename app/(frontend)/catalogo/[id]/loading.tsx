import { Skeleton } from "../../_components/skeleton";

/** Esqueleto de la ficha de prenda mientras Payload entrega el detalle (HU-09). */
export default function ProductLoading() {
  return (
    <main className="page" role="status" aria-live="polite">
      <span className="sr-only">Cargando la prenda…</span>

      <article className="product-detail" aria-hidden="true">
        <div className="product-gallery">
          <Skeleton style={{ height: "auto", aspectRatio: "3 / 4", borderRadius: 18 }} />
          <div className="product-gallery-thumbs">
            {[0, 1, 2, 3].map((thumb) => (
              <Skeleton key={thumb} style={{ width: 74, height: 94, borderRadius: 8 }} />
            ))}
          </div>
        </div>

        <div className="product-meta">
          <div className="detail-row">
            <Skeleton style={{ width: 70, height: 10, marginBottom: 12 }} />
            <Skeleton style={{ width: "72%", height: 40 }} />
          </div>
          <div className="detail-row">
            <Skeleton style={{ width: 80, height: 10, marginBottom: 10 }} />
            <Skeleton style={{ width: 140, height: 14 }} />
          </div>
          <Skeleton style={{ width: 120, height: 28, marginTop: 18 }} />
          <Skeleton style={{ width: 240, height: 48, borderRadius: 999, marginTop: 22 }} />
          <Skeleton style={{ width: 180, height: 48, borderRadius: 999, marginTop: 8 }} />
        </div>
      </article>
    </main>
  );
}
