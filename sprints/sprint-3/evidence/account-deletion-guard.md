# Evidencia — Cuenta con pedidos en curso (D-21)

Fecha: 21 de noviembre de 2026.
Rama: `branch/SPRINT-3-orders-core`, commit `6352a48`.
Entorno: local, Supabase con las migraciones de pedidos aplicadas y el stock sembrado.

## Implementación

- `src/lib/orders/status.ts`: `ORDER_ACTIVE_STATUSES` (`pendiente`, `en_produccion`, `lista`) e `isOrderInProgress`.
- `src/services/orders/customer-account.ts`: conteo de pedidos que bloquean la eliminación.
- `src/collections/Customers.ts`: el borrado de una cuenta con pedidos en curso se rechaza en servidor para clientes. Un administrador puede resolver el caso manual.
- `app/(frontend)/cuenta/actions.ts`: comprobación previa y mensaje con enlaces a Mis pedidos y al correo.
- `app/(frontend)/pedidos/actions.ts` y `cancel-order-button.tsx`: el cliente puede cancelar pedidos `pendiente` o `en_produccion`, con confirmación y devolución de stock.
- `src/lib/contact.ts`: correo público `valdra.administracion@gmail.com`.
- `src/lib/orders/stock.ts`: el stock no se devuelve al borrar pedidos entregados.

## Pruebas ejecutadas

### Bloqueo en servidor

- Cliente con pedido #189926 en `pendiente` y stock 18.
- `payload.delete` de la cuenta con sesión del cliente devolvió **409**:
  «La cuenta tiene un pedido en curso. Cancélalo antes de eliminarla o escribe a valdra.administracion@gmail.com explicando la situación.»
- La cuenta, el pedido y el diseño siguieron existiendo y el stock no cambió.

### Bloqueo en la interfaz

- `/cuenta` mostró la advertencia de pedido en curso.
- Al confirmar la eliminación, apareció el mensaje de bloqueo.
- Se mostraron los enlaces:
  - `Ir a Mis pedidos` → `/pedidos`.
  - `valdra.administracion@gmail.com` → `mailto:` con asunto «Pedido en curso — Valdra Store».

### Cancelación y eliminación

1. El cliente abrió `/pedidos?pedido=189926`.
2. El detalle mostró el botón «Cancelar pedido».
3. La confirmación «Sí, cancelar pedido» dejó el estado en **Cancelada**.
4. El historial registró `pendiente → cancelada`, con la nota «Cancelado por el cliente» y `changedBy: null`.
5. El stock volvió de 18 a **20**.
6. La eliminación de la cuenta se completó y redirigió a la portada.
7. Cliente, pedido y diseño desaparecieron; el stock siguió en 20.

### Pruebas unitarias

- `isOrderInProgress` reconoce `pendiente`, `en_produccion` y `lista`, y rechaza `entregada`, `cancelada` y valores desconocidos.
- `shouldRestoreStockOnDelete` devuelve stock para pedidos no entregados y no devueltos, y no lo hace para `entregada` o cancelados ya devueltos.
- `pnpm test`: **245 pruebas** ✅

### Chequeos

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅ 245 pruebas
- `pnpm build` ✅

## Limpieza

- Pedidos de prueba: 0.
- Diseños de prueba: 0.
- Stock de `camisetas-black|M`: 20.
- Clientes de prueba eliminados.

## Límites conocidos

- Un pedido `lista` no se puede cancelar desde la cuenta; el cliente debe escribir a Valdra.
- Un administrador puede eliminar una cuenta con pedidos en curso para resolver el caso manual; el stock se devuelve solo si el pedido no estaba entregado.
- No se envían correos automáticos: el enlace es `mailto:` y el envío es manual.
- El correo de contacto está centralizado en `src/lib/contact.ts`; cambiarlo allí actualiza la cuenta, el detalle y los términos.
