# Evidencia — Revisión de seguridad y endurecimiento

Fecha: 22 de noviembre de 2026.
Rama: `branch/SPRINT-3-orders-core`, commits `fe3de8e`, `964efe6` y `7b6848f`.
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
   - La cancelación reclama `stock_restored` y actualiza el inventario en una sola sentencia SQL dentro de la transacción de Payload.
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

6. **Tope y rate limit de pedidos.**
   - Máximo 3 pedidos activos por cliente y 5 creaciones por hora en producción.
   - El cuarto pedido activo devuelve 409; el límite horario se omite en desarrollo local.

7. **Correo de contacto separado.**
   - El correo público es `contacto@valdra.store`, configurable con `NEXT_PUBLIC_CONTACT_EMAIL`.
   - La cuenta de administrador ya no se muestra en la UI.

8. **Re-autenticación antes de eliminar la cuenta.**
   - La acción exige la contraseña actual y usa la verificación y el bloqueo por intentos de Payload.
   - Contraseña incorrecta: no elimina y muestra el error. Contraseña correcta: elimina.

9. **Carrera entre conteo y borrado de cuenta.**
   - El hook bloquea la fila del cliente con `SELECT … FOR UPDATE` antes de contar pedidos.
   - La eliminación normal y el bloqueo por pedido activo siguen funcionando.

10. **Backfill y check de 6 cifras.**
    - La migración `20261122_120000_order_number_check` repara números inválidos y añade la restricción `orders_order_number_check`.
    - Aplicada el 22 de noviembre de 2026 y verificada con `pg_constraint`.

## Decisiones confirmadas

- **Borrado por administrador:** se mantiene el override manual para cuentas con pedidos activos como excepción de Valdra. No es un camino de cliente.
- **MFA:** falta activarla en la cuenta de administrador; es una operación en Google, no un cambio de código.
- **Sesiones:** cliente y admin comparten `payload-token`; se alternan sesiones. Separarlo requeriría un cambio de autenticación.

## Verificación

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm test` ✅ **249 pruebas**
- `pnpm build` ✅
- Cancelación concurrente: stock restaurado una sola vez.
- Cuarto pedido activo: **409** y stock sin cambios.
- Eliminación con contraseña incorrecta: bloqueada; con la correcta: completada.
- Correo mostrado en la UI: `contacto@valdra.store`.
- Migración aplicada; constraint presente.
- Datos de prueba limpiados: 0 pedidos, 0 diseños, stock 20.

## Notas

- El agente de seguridad trabajó en modo lectura y tuvo el shell denegado; los fixes se verificaron con pruebas y con el navegador interno.
- Quedan MFA y la separación de cookies como pendientes operativos/opcionales; no bloquean la demo.
