import { getPayload } from "payload";
import config from "../payload.config";
import { getMockupBaseName, MOCKUP_BASES, MOCKUP_SIZES } from "../src/lib/mockup-bases";
import { DEFAULT_STOCK_QUANTITY, getStockKey } from "../src/lib/orders/stock";

/**
 * Crea las filas de inventario para las diez prendas base y las cuatro tallas.
 * Debe ejecutarse después de aplicar la migración `20261121_120000_orders_core`.
 * Es idempotente: no reinicia el stock de las filas existentes.
 */
const payload = await getPayload({ config });

let created = 0;
let skipped = 0;

for (const base of MOCKUP_BASES) {
  for (const size of MOCKUP_SIZES) {
    const key = getStockKey(base.id, size);
    const existing = await payload.find({
      collection: "garment-stock",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { key: { equals: key } },
    });

    if (existing.docs[0]) {
      skipped += 1;
      continue;
    }

    await payload.create({
      collection: "garment-stock",
      data: {
        active: true,
        baseId: base.id,
        key,
        label: getMockupBaseName(base),
        quantity: DEFAULT_STOCK_QUANTITY,
        size,
      },
      overrideAccess: true,
    });
    created += 1;
  }
}

console.log(
  JSON.stringify(
    {
      created,
      skipped,
      total: MOCKUP_BASES.length * MOCKUP_SIZES.length,
    },
    null,
    2,
  ),
);

process.exit(0);
