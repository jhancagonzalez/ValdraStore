import { Skeleton } from "../_components/skeleton";

const CARD_PLACEHOLDERS = Array.from({ length: 8 }, (_, index) => `card-${index}`);

/** Esqueleto del catálogo mientras Payload entrega las prendas (HU-09, HU-10). */
export default function CatalogLoading() {
  return (
    <main className="page page-catalog" role="status" aria-live="polite">
      <span className="sr-only">Cargando el catálogo…</span>

      <div className="catalog-head" aria-hidden="true">
        <div>
          <Skeleton style={{ width: 64, marginBottom: 16 }} />
          <Skeleton style={{ width: 260, height: 44 }} />
          <Skeleton style={{ width: "min(380px, 80%)", marginTop: 16 }} />
        </div>
      </div>

      <div className="catalog-toolbar" aria-hidden="true">
        <Skeleton style={{ width: 280, height: 44, borderRadius: 999 }} />
        <Skeleton style={{ width: 150, height: 44, borderRadius: 999 }} />
      </div>

      <ul className="product-grid" aria-hidden="true">
        {CARD_PLACEHOLDERS.map((card) => (
          <li key={card}>
            <div className="product-card">
              <Skeleton
                style={{
                  height: "auto",
                  aspectRatio: "3 / 4",
                  borderRadius: "var(--radius-media)",
                }}
              />
              <div className="product-info">
                <Skeleton style={{ gridColumn: "1 / -1", width: 72, height: 10 }} />
                <Skeleton style={{ width: "72%", height: 16 }} />
                <Skeleton style={{ width: 56, height: 12, justifySelf: "end" }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
