import { Skeleton } from "../_components/skeleton";

/** Esqueleto de la cuenta mientras Payload entrega el perfil (HU-04). */
export default function AccountLoading() {
  return (
    <main className="page account-page" role="status" aria-live="polite">
      <span className="sr-only">Cargando tu cuenta…</span>

      <div className="page-intro" aria-hidden="true">
        <Skeleton style={{ width: 64, marginBottom: 16 }} />
        <Skeleton style={{ width: 230, height: 44 }} />
        <Skeleton style={{ width: "min(360px, 80%)", marginTop: 16 }} />
      </div>

      <div className="account-layout" aria-hidden="true">
        <div className="account-main">
          {[0, 1].map((card) => (
            <section className="account-card" key={card}>
              <Skeleton style={{ width: 210, height: 26 }} />
              <Skeleton style={{ width: "min(560px, 100%)", height: 46 }} />
              <Skeleton style={{ width: "min(560px, 100%)", height: 46 }} />
              <Skeleton style={{ width: "min(560px, 100%)", height: 46 }} />
              <Skeleton style={{ width: 170, height: 48, borderRadius: 999, marginTop: 4 }} />
            </section>
          ))}
        </div>

        <aside className="account-side">
          {[0, 1].map((block) => (
            <div className="account-side-block" key={block}>
              <Skeleton style={{ width: 54 }} />
              <Skeleton style={{ width: 150, height: 24 }} />
              <Skeleton style={{ width: "100%" }} />
              <Skeleton style={{ width: "82%" }} />
              <Skeleton style={{ width: "100%", height: 48, borderRadius: 999, marginTop: 6 }} />
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}
