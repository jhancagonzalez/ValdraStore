# Evidencia — Revisión de seguridad y mejora de la consulta de pedidos

Fecha: 21 de noviembre de 2026.
Rama: `branch/SPRINT-3-orders-core`, commits `fe3de8e` y `964efe6`.
Base revisada: `e009cfe`; cambios de pedidos hasta `bf9d1f9`.

## Alcance

La revisión con el agente de seguridad cubrió:

- Número de pedido y consulta por número en `/pedidos`.
- Lista, detalle y control de acceso por propietario.
- Cancelación del cliente y devolución de stock.
- Bloqueo de eliminación de cuenta con pedidos en curso.
- Uso de `overrideAccess`, `user` y `context` en Payload.
- Correo de contacto y avisos de producción.
- Redirects de login/registro, diseño de pedidos y permisos de administración.

## Hallazgos corregidos

1. **Doble devolución de stock en cancelaciones concurrentes.**
   - La cancelación ahora reclama `stock_restored` y actualiza el inventario en una sola sentencia SQL dentro de la transacción de Payload.
   - Prueba con dos cancelaciones simultáneas: stock 18 → 20 (no 22), una sola entrada de historial.

2. **Cambio de rol de un cliente con pedidos activos.**
   - `changeAccountRole` bloquea la promoción si el cliente tiene pedidos `pendiente`, `en_produccion` o `lista`.
   - Prueba unitaria añadida.

3. **Open redirect con caracteres de control.**
   - Login y registro usan `safeNextPath`, que rechaza rutas externas, `//`, barras invertidas y caracteres de control.
   - Pruebas unitarias añadidas.

4. **Reescritura de `stockRestored` y `statusHistory`.**
   - El hook de estado ignora esos campos del formulario y conserva el historial anterior.
   - El panel de administración guardó correctamente un cambio a `en_produccion`.

5. **Oráculo de existencia de diseños ajenos.**
   - El error es el mismo para un diseño inexistente y uno de otro cliente.

## Hallazgos que requieren decisión

- **Borrado por administrador:** un administrador todavía puede eliminar una cuenta con pedidos activos para resolver el caso manual. Es una decisión de producto (D-21).
- **Rate limit / tope de pedidos activos:** no hay límite específico en la creación; un cliente podría retener stock con pedidos pendientes.
- **Correo de contacto:** `valdra.administracion@gmail.com` es también una cuenta de administrador; se recomienda un alias dedicado y MFA.
- **Re-autenticación:** eliminar la cuenta no pide la contraseña actual.
- **Carrera conteo/borrado:** el conteo previo y el borrado no comparten un bloqueo de fila; el hook vuelve a comprobar, pero queda una ventana.
- **Backfill del número:** la migración usa `100000 + id`; a partir de `id ≥ 900000` el número tendría 7 cifras. No es alcanzable con el volumen del prototipo; documentado.

## Verificación

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅ **249 pruebas**
- `pnpm build` ✅
- Cancelación concurrente: stock restaurado una sola vez.
- Flujo de UI probado con el pedido **#182826**:
  - Pendiente: badge, avance y detalle.
  - Administrador: cambio a **En producción** desde el panel.
  - Cliente: aviso de producción y botón de cancelación.
  - Cancelación: estado **Cancelada**, stock 20 y cuenta eliminada después.
- Datos de prueba limpiados: 0 pedidos, 0 diseños, stock 20.

## Notas

- El agente de seguridad trabajó en modo lectura y tuvo el shell denegado; los fixes se verificaron con pruebas y con el navegador interno.
- Las decisiones pendientes no bloquean la demo, pero sí deben resolverse antes de un uso público o de un PR de producción.
