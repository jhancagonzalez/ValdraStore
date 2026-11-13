import type { Metadata } from "next";
import Link from "next/link";
import { getSessionCustomer } from "@/lib/auth";
import { findGarmentBase, GARMENT_BASES, MOCKUP_SIZES } from "@/services/ai/garment-bases";
import { ProposalForm } from "./proposal-form";

export const metadata: Metadata = { title: "Propuesta con IA" };

type SearchParam = string | string[] | undefined;

type ProposalPageProps = {
  searchParams: Promise<Record<string, SearchParam>>;
};

/** Next entrega string[] cuando un parámetro se repite; se toma el primer valor. */
const firstValue = (value: SearchParam): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

/**
 * Página de HU-14: exige sesión de cliente para generar una propuesta
 * (decisión D6). El catálogo sigue siendo público.
 */
export default async function ProposalPage({ searchParams }: ProposalPageProps) {
  const [customer, params] = await Promise.all([getSessionCustomer(), searchParams]);

  if (!customer) {
    return (
      <main className="page proposal-page">
        <section className="proposal-gate">
          <h1 className="section-title">Propuesta con IA</h1>
          <p className="section-subtitle">
            Inicia sesión como cliente para generar una propuesta de diseño sobre tu prenda.
          </p>
          <Link className="button button-primary" href="/login">
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  const initialBase = findGarmentBase(firstValue(params.base)) ?? GARMENT_BASES[0];
  const requestedSize = firstValue(params.size);
  const initialSize = (MOCKUP_SIZES as readonly string[]).includes(requestedSize)
    ? requestedSize
    : "M";

  return (
    <main className="page proposal-page">
      <header className="proposal-head">
        <h1 className="section-title">Propuesta con IA</h1>
        <p className="section-subtitle">
          Elige la prenda, escribe tu idea y recibe una propuesta generada automáticamente sobre la
          prenda que seleccionaste.
        </p>
      </header>
      <ProposalForm
        bases={GARMENT_BASES.map((base) => ({ id: base.id, name: base.name }))}
        initialBaseId={initialBase.id}
        initialSize={initialSize}
        sizes={MOCKUP_SIZES}
      />
    </main>
  );
}
