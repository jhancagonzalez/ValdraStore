import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <main className="page">
      <h1 className="section-title">Términos y condiciones</h1>
      <p className="section-subtitle">Condiciones de uso de Valdra Store.</p>

      <section className="prose">
        <h2>1. Sobre este sitio</h2>
        <p>
          Valdra Store es un prototipo académico de personalización de prendas. El catálogo, las
          cuentas y las propuestas de diseño se ofrecen con fines demostrativos y no constituyen una
          tienda comercial en producción.
        </p>

        <h2>2. Cuentas de cliente</h2>
        <p>
          Para personalizar prendas y realizar pedidos necesitas una cuenta. Eres responsable de la
          veracidad de los datos que registres y de mantener tu contraseña bajo custodia. Avísanos si
          detectas un uso no autorizado de tu cuenta.
        </p>

        <h2>3. Prendas y personalización</h2>
        <p>
          Las imágenes del catálogo son ilustrativas. Las propuestas de personalización se generan a
          partir de la información que proporciones y deben revisarse antes de confirmar cualquier
          pedido.
        </p>

        <h2>4. Propiedad intelectual</h2>
        <p>
          Las imágenes, diseños y textos de este sitio pertenecen a Valdra Store o se usan con
          autorización. No está permitido reproducirlos ni distribuirlos sin consentimiento.
        </p>

        <h2 id="datos-personales">5. Datos personales</h2>
        <p>
          Usamos tus datos únicamente para operar tu cuenta y gestionar tus pedidos. Puedes
          consultarlos y actualizarlos desde tu cuenta. No compartimos tu información con terceros
          sin tu autorización.
        </p>

        <h2>6. Cambios en las condiciones</h2>
        <p>
          Podemos actualizar estas condiciones cuando cambie el alcance del prototipo. La versión
          vigente estará siempre publicada en esta página.
        </p>

        <p className="form-hint">
          ¿Tienes dudas? Escríbenos por{" "}
          <a
            href="https://www.instagram.com/valdra.store"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>{" "}
          o vuelve al{" "}
          <Link href="/catalogo">catálogo</Link>.
        </p>
      </section>
    </main>
  );
}
