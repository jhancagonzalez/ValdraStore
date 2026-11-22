# Evidencia — Flujo completo de pedido, estado, borrado y cuenta

Fecha: 21 de noviembre de 2026.
Rama: `branch/SPRINT-3-orders-core`, commit `bf9d1f9`.
Entorno: local, Supabase con las migraciones de pedidos aplicadas y el stock sembrado.

## Flujo probado

1. Se creó un administrador, un cliente y un diseño temporales.
2. El cliente creó el pedido **#315305**: cantidad 2, total $120.000, estado `pendiente`; el stock pasó de 20 a 18.
3. El cliente abrió el detalle en `/pedidos?pedido=315305`:
   - Estado **Pendiente**.
   - Sin aviso de producción.
   - Botón «Cancelar pedido» disponible.
4. El administrador cambió el pedido a **`en_produccion`**.
5. El cliente recargó el detalle:
   - Estado **En producción**.
   - Apareció el aviso: «El equipo se conectará contigo por tu correo electrónico y te enviará la información de cuándo tu prenda esté lista.»
   - El botón de cancelación siguió disponible porque el pedido aún podía cancelarse.
6. El administrador eliminó el pedido:
   - El pedido dejó de existir.
   - El stock volvió a **20**.
7. El cliente eliminó su cuenta:
   - La operación se completó y redirigió a la portada.
   - El cliente y el diseño desaparecieron.
   - El stock siguió en **20**.
8. Se eliminó el administrador temporal.

## Resultado final

- Pedidos: **0**.
- Diseños de prueba: **0**.
- Clientes de prueba: **0**.
- Stock de `camisetas-black|M`: **20**.
- Administradores: solo las cuentas originales.

## Chequeos

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅ 245 pruebas
- `pnpm build` ✅

## Notas

- Las acciones de administración se ejecutaron con una sesión de administrador real a través de la API local; el formulario de creación del panel se validó en una prueba anterior.
- El aviso de producción es informativo: no se envía un correo automático. El equipo contacta manualmente al cliente y le informa cuándo la prenda esté lista.
- El detalle del pedido muestra el aviso solo en `en_produccion`; en `pendiente`, `lista`, `entregada` o `cancelada` no aparece.
