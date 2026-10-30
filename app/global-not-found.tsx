import Link from "next/link";

/**
 * 404 for URLs that match no route at all. Next bypasses the layouts here, so
 * the page carries its own minimal styling and language.
 */
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body
        style={{
          background: "#ffffff",
          color: "#0d0d0d",
          display: "grid",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          margin: 0,
          minHeight: "100vh",
          placeItems: "center",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "420px", width: "100%" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              margin: "0 0 16px",
              textTransform: "uppercase",
            }}
          >
            Valdra Store
          </p>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: "0 0 16px",
            }}
          >
            No encontramos esta página
          </h1>
          <p style={{ color: "#6f6f6f", lineHeight: 1.6, margin: "0 0 28px" }}>
            Puede que el enlace esté mal escrito o que la página ya no exista.
          </p>
          <Link
            href="/catalogo"
            style={{
              background: "#0d0d0d",
              color: "#ffffff",
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              padding: "14px 24px",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Ver catálogo
          </Link>
        </main>
      </body>
    </html>
  );
}
