import type { Metadata } from "next";
import { getSessionCustomer } from "@/lib/auth";
import { getMockupBase, isMockupSize, MOCKUP_BASES, type MockupSize } from "@/lib/mockup-bases";
import { GarmentSelector } from "./garment-selector";

export const metadata: Metadata = { title: "Personalizar" };

type SearchParam = string | string[] | undefined;

/** Next entrega string[] cuando un parámetro se repite; se toma el primer valor. */
const firstValue = (value: SearchParam): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

type PersonalizePageProps = {
  searchParams: Promise<Record<string, SearchParam>>;
};

export default async function PersonalizePage({ searchParams }: PersonalizePageProps) {
  const params = await searchParams;
  const selectedBase = getMockupBase(firstValue(params.base)) ?? MOCKUP_BASES[0];
  const requestedSize = firstValue(params.size);
  const initialSize: MockupSize | null = isMockupSize(requestedSize) ? requestedSize : null;
  const customer = await getSessionCustomer();

  return (
    <main className="page page-personalizer">
      <header className="personalizer-head">
        <h1 className="section-title">Personalizar</h1>
        <p className="section-subtitle">
          Elige la prenda y la talla; después damos forma a tu idea sobre ella.
        </p>
      </header>
      <GarmentSelector
        initialBaseId={selectedBase.id}
        initialSize={initialSize}
        isAuthenticated={customer !== null}
      />
    </main>
  );
}
