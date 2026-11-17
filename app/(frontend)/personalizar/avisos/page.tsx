import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Avisos del personalizador" };

/**
 * Transparencia del personalizador: límites, fallos posibles de la IA y buenas
 * prácticas antes de generar o aprobar un diseño.
 */
export default function PersonalizerNoticesPage() {
  return (
    <main className="page legal-page">
      <div className="page-intro">
        <p className="eyebrow">Personalizador</p>
        <h1>Avisos y recomendaciones</h1>
        <p className="section-subtitle">
          Cómo funciona la generación con IA, qué límites tiene y cómo obtener un mejor resultado.
        </p>
      </div>

      <section className="prose">
        <h2>La IA puede equivocarse</h2>
        <p>
          El personalizador usa inteligencia artificial para interpretar tu idea y proponer un
          diseño. El resultado puede tardar, fallar o no coincidir exactamente con lo que pediste:
          revisa siempre la propuesta antes de aprobarla.
        </p>
        <p>
          Cada propuesta es una vista previa. Si no te convence, pide cambios sobre la zona marcada,
          genera otra versión o vuelve a empezar con otra prenda.
        </p>

        <h2>Límites de uso</h2>
        <p>
          Para cuidar la cuota gratuita del proveedor de IA y mantener el servicio disponible, cada
          cuenta puede generar hasta <strong>3 propuestas al día</strong>. El contador se renueva
          cada día; si lo alcanzas, la aplicación te indicará cuándo puedes volver a intentarlo.
        </p>
        <p>
          Los límites pueden cambiar si el proveedor ajusta su disponibilidad. Cuando la generación
          no esté disponible, la prenda, la talla y el color que elegiste se conservan.
        </p>

        <h2>Recomendaciones para un buen resultado</h2>
        <ul>
          <li>Describe la idea con detalles: colores, estilo, formas y dónde quieres ubicarla.</li>
          <li>Si usas una imagen de referencia, que tenga fondo limpio y buena resolución.</li>
          <li>Al pedir cambios, marca solo la zona que quieres modificar.</li>
          <li>
            La generación suele tardar entre 15 y 60 segundos; no cierres la página mientras espera.
          </li>
          <li>Revisa el texto y los detalles antes de aprobar: la prenda final puede variar.</li>
          <li>No subas imágenes con marcas, derechos de terceros ni datos personales.</li>
        </ul>

        <h2>Privacidad y archivos</h2>
        <p>
          Las imágenes de referencia y las propuestas son privadas: solo tú y los administradores
          pueden verlas. Mientras la política de datos del proveedor de IA esté pendiente, las
          referencias se componen en el servidor y no se envían al modelo. Aceptamos JPEG, PNG y
          WebP de hasta 10 MB. Los borradores viven en el navegador; si sales sin aprobar, se
          pierden. Los diseños aprobados quedan registrados en tu cuenta y puedes descargarlos
          cuando quieras.
        </p>

        <h2>Si algo falla</h2>
        <p>
          Puedes reintentar la generación o volver al catálogo. Si el problema continúa, escríbenos
          por{" "}
          <a
            href="https://www.instagram.com/valdra.store"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          .
        </p>

        <p className="form-hint">
          <Link href="/personalizar">Volver al personalizador</Link>
        </p>
      </section>
    </main>
  );
}
