import { Skeleton } from "../_components/skeleton";

/** Esqueleto de Mis pedidos mientras Payload entrega la consulta (HU-19/20). */
export default function OrdersLoading() {
  return (
    <main className="page orders-page" role="status" aria-live="polite">
      <span className="sr-only">Cargando tus pedidos…</span>

      <div className="page-intro" aria-hidden="true">
        <Skeleton style={{ width: 64, marginBottom: 16 }} />
        <Skeleton style={{ width: 260, height: 56 }} />
        <Skeleton style={{ width: "min(420px, 90%)", marginTop: 16 }} />
      </div>

      <section className="orders-card" aria-hidden="true">
        <Skeleton style={{ width: 220, height: 28 }} />
        <Skeleton style={{ width: "min(560px, 100%)", height: 48 }} />
        <Skeleton style={{ width: 160, height: 48, borderRadius: 999 }} />
      </section>

      <section className="orders-card" aria-hidden="true">
        <Skeleton style={{ width: 200, height: 28 }} />
        {[0, 1, 2].map((card) => (
          <Skeleton key={card} style={{ width: "100%", height: 116, borderRadius: 20 }} />
        ))}
      </section>
    </main>
  );
}
