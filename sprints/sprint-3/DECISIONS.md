# Decisiones confirmadas del Sprint 3

Decisiones cerradas con el usuario el 21 de noviembre de 2026. Sustituyen las recomendaciones anteriores del documento. La base de pedidos e inventario está implementada, las migraciones aplicadas y el stock sembrado; HU-18, HU-19 y HU-20 están validadas de punta a punta y los pedidos se consultan en `/pedidos`. La rama de desarrollo es `branch/SPRINT-3-orders-core`.

## 1. Decisiones

| ID | Decisión | Estado |
| --- | --- | --- |
| D-01 | Colección propia `orders`; no se activan los pedidos del plugin ni el checkout | Implementada |
| D-02 | Un pedido por diseño aprobado, con cantidad entera de 1 a 10 | Implementada |
| D-03 | El cliente crea desde su diseño y el administrador también puede crear pedidos | Implementada y validada; formulario Payload probado con una sesión real |
| D-04 | El pedido guarda prenda, talla, color, precio y diseño del momento; no se recalcula después | Implementada |
| D-05 | Estados `pendiente` → `en_produccion` → `lista` → `entregada`; `cancelada` desde pendiente o en producción | Implementada |
| D-06 | El historial de estados es solo para administradores; el cliente ve el estado actual | Implementada; historia oculta al cliente |
| D-07 | Precio fijo por prenda base en COP: camiseta **$60.000**, hoodie **$120.000**; sin envío, impuestos ni descuentos | Implementada |
| D-08 | Después de crear el pedido, el administrador solo cambia el estado; ítems, precio, cliente y diseño quedan congelados | Implementada |
| D-09 | Crear colección `categories` y cambiar `products.category` a relación; permite crear, editar y deshabilitar categorías | Pendiente (HU-22) |
| D-10 | Crear colección `designs` con imagen, relación a prendas y `active`; permite crear, editar, eliminar y deshabilitar diseños | Pendiente (HU-23) |
| D-11 | Usar el panel de Payload para pedidos, inventario, clientes, prendas y diseños | Implementada para pedidos e inventario |
| D-12 | Historial del cliente en `/pedidos` con lista y detalle simple; sin tiempo real | Implementada (HU-19/20) |
| D-13 | Al eliminar la cuenta se eliminan también sus pedidos y diseños; el stock se devuelve solo para pedidos no entregados. Con pedidos en curso, la eliminación se bloquea | Implementada |
| D-14 | Número de pedido aleatorio de seis cifras, único y guardado en `orderNumber`; el cliente lo usa para consultar el estado en `/pedidos` | Implementada y validada |
| D-15 | Sin avisos automáticos por correo o WhatsApp en Sprint 3; el estado se ve al consultar. En producción, el detalle informa que el equipo contactará por correo | Confirmada |
| D-16 | Cliente: crear y leer solo sus pedidos. Administrador: leer todos, cambiar estado y eliminar. Data API revocada y RLS activo | Implementada en código y migraciones aplicadas |
| D-17 | Cada migración revisada; `push: false`; se aplica solo con aprobación y verificación de RLS | Aplicadas el 21 nov 2026 (`orders_core` y `order_number`); RLS y revocación incluidos |
| D-18 | Datos de prueba sintéticos y limpieza al terminar | Pruebas de integración, UI y formulario de admin realizadas; datos de prueba limpiados |
| D-19 | Stock por prenda base + talla en `garment-stock`; 1–10 unidades; se descuenta al crear y se devuelve al cancelar/eliminar | Implementada |
| D-20 | Precios base: camiseta $60.000 y hoodie $120.000 | Implementada |
| D-21 | Un cliente con pedidos en curso no puede eliminar su cuenta: debe cancelarlos desde `/pedidos` o escribir a `contacto@valdra.store`. Un administrador puede resolver el caso manual | Implementada |
| D-22 | Endurecimiento de seguridad: redirects internos, error de diseño no enumerable, cancelación de stock atómica, historial/stock no reescribibles y cambio de rol bloqueado con pedidos activos | Implementada |
| D-23 | Límites y cuenta: 3 pedidos activos, 5 creaciones por hora, contraseña actual para borrar la cuenta, bloqueo `FOR UPDATE` y check de 6 cifras; el administrador mantiene el override manual | Implementada; MFA pendiente de operación |

## 2. Base implementada y protegida

Rama `branch/SPRINT-3-orders-core`, commits `62d0365`, `b53b9e6`, `07cfc17`, `9b3a2e1`, `64d37e1`, `5acab13`, `6352a48`, `bf9d1f9`, `fe3de8e`, `964efe6` y `7b6848f`.

| Área | Archivos | Regla |
| --- | --- | --- |
| Colección de pedidos | `src/collections/Orders.ts` | Solo Jhancarlos |
| Inventario | `src/collections/GarmentStock.ts` | Solo Jhancarlos |
| Lógica de pedidos | `src/services/orders/order-hooks.ts` | Solo Jhancarlos |
| Estados y precios | `src/lib/orders/status.ts`, `pricing.ts`, `stock.ts` | Solo Jhancarlos; el equipo importa |
| Migración | `src/migrations/20261121_120000_orders_core.ts`, `src/migrations/20261121_140000_order_number.ts` | Solo Jhancarlos |
| Registro Payload | `src/collections/index.ts`, `payload.config.ts` | Solo Jhancarlos |
| Artefactos generados | `payload-types.ts`, import map | Solo Jhancarlos |
| Borrado de cuenta | Hook de `src/collections/Customers.ts` | Solo Jhancarlos |
| Semilla de stock | `scripts/seed-order-stock.ts` | Solo Jhancarlos |
| API y UI de HU-18 | `app/api/orders/create/route.ts`, `app/(frontend)/personalizar/order-panel.tsx` | Solo Jhancarlos |
| Número y consulta | `src/lib/orders/order-number.ts`, `src/services/orders/order-number.ts`, `app/(frontend)/pedidos/page.tsx` y los enlaces de navegación de `site-header.tsx`/`bottom-nav.tsx` | Número y página: Jhancarlos; revisión de estado: Kevin |
| UI de pedidos | `app/(frontend)/pedidos/order-status.tsx`, `loading.tsx`, `cancel-order-button.tsx` y estilos de pedidos | Jhancarlos + Kevin |
| Endurecimiento | `src/lib/safe-next.ts`, `src/lib/orders/limits.ts`, `src/lib/rate-limit.ts`, `src/services/roles/change-role.ts`, `src/services/orders/order-hooks.ts` | Solo Jhancarlos |
| Migración de check | `src/migrations/20261122_120000_order_number_check.ts` | Solo Jhancarlos |
| Cuenta con pedidos | `src/services/orders/customer-account.ts`, hook de `Customers.ts`, `app/(frontend)/cuenta/actions.ts`, `app/(frontend)/pedidos/actions.ts`, `src/lib/contact.ts` | Solo Jhancarlos |
| Dependencias | `package.json`, `pnpm-lock.yaml` | Solo Jhancarlos |

### Contratos que el equipo puede consumir

- `ORDER_STATUSES`, `ORDER_STATUS_LABELS` y `canTransitionOrderStatus`.
- `BASE_UNIT_PRICES`, `getDesignPricing`, `isOrderQuantity` y `calculateOrderTotal`.
- `getStockKey`, `parseStockKey` y `hasEnoughStock`.
- `isOrderNumber` y el patrón de seis cifras para validar el número de pedido.
- `isOrderInProgress` y `ORDER_ACTIVE_STATUSES` para saber si un pedido bloquea la eliminación de la cuenta.
- `safeNextPath` para validar destinos internos de login/registro.
- Los tipos generados `Order` y `GarmentStock` de `payload-types.ts`.

Las UI no deben duplicar etiquetas de estado ni calcular precios; el servidor es la fuente de verdad.

## 3. Reparto y límites

| Persona | Permitido | No tocar sin revisión |
| --- | --- | --- |
| Jhancarlos | Núcleo de pedidos e inventario, migración, HU-18 y HU-19, regla de cuenta con pedidos en curso, seguridad, integración, docs | — |
| Kevin | HU-20 (estado del cliente) y HU-24 (clientes/pedidos en el panel); revisión de `/pedidos` | Esquema, hooks, tipos o migraciones de pedidos |
| Emanuel | HU-21 (cambio de estado en el panel y pruebas) y HU-25 (precios/información); revisión de estados | Esquema, hooks, tipos o migraciones de pedidos |
| Andrés | HU-22 (categorías) y cambios en `src/plugins/ecommerce.ts` con revisión | `orders`, `garment-stock`, precios o estados |
| Daniel | HU-23 (diseños), cambios en `src/plugins/ecommerce.ts` con revisión y checklist de acceso/RLS | `orders`, `garment-stock`, esquema o migraciones |

Reparto actualizado el 22 de noviembre de 2026. HU-20 y HU-21 ya están funcionales: sus responsables cierran revisión y pruebas. HU-24 y HU-25 se asignaron para balancear la carga; HU-25 depende de HU-22.

Las colecciones `categories` y `designs` pertenecen a HU-22/HU-23. Sus responsables deben coordinar con Jhancarlos cualquier cambio en `src/plugins/ecommerce.ts` y la migración correspondiente; no forman parte del núcleo de pedidos.

## 4. Pendientes antes de la demo

- [x] Revisar y aplicar la migración `20261121_120000_orders_core` con `DATABASE_URL_MIGRATIONS`.
- [x] Ejecutar `pnpm seed:order-stock` para crear las 40 filas de inventario (10 prendas × 4 tallas).
- [x] Implementar la UI de creación del pedido para el cliente (HU-18) y probarla de punta a punta.
- [x] Validar la creación por administrador a nivel de API y hooks.
- [x] Probar el formulario de creación del administrador en el panel de Payload.
- [x] Añadir el número de pedido aleatorio de seis cifras y la consulta por número.
- [x] Implementar la lista, el detalle y el menú «Pedidos» del cliente (HU-19/20).
- [x] Bloquear la eliminación de la cuenta con pedidos en curso y ofrecer cancelación o correo a Valdra (D-21).
- [x] Mostrar el aviso de producción: el equipo contactará por correo y avisará cuando la prenda esté lista.
- [x] Aplicar el endurecimiento de seguridad de D-22 y mejorar la UI de consulta de pedidos.
- [x] Aplicar el límite de 3 pedidos activos y 5 creaciones por hora (D-23).
- [x] Configurar `contacto@valdra.store` como correo público (`NEXT_PUBLIC_CONTACT_EMAIL`).
- [x] Exigir la contraseña actual para eliminar la cuenta.
- [x] Bloquear la fila del cliente con `FOR UPDATE` entre el conteo y el borrado.
- [x] Aplicar la migración que repara números inválidos y añade el check de 6 cifras.
- [x] Mantener el override manual del administrador para cuentas con pedidos en curso.
- [ ] Activar MFA en la cuenta de administrador (operación, no código).
- [ ] Evaluar la separación de cookies de cliente/admin para sesiones simultáneas.
- [ ] Implementar HU-22 (colección `categories`) y HU-23 (colección `designs`).
- [ ] Probar el flujo completo en móvil, con datos sintéticos.
- [x] Actualizar Notion y registrar evidencias.

## 5. Riesgos y límites conocidos

- **Stock no atómico en creación:** la comprobación y el descuento iniciales siguen sin transacción; dos pedidos simultáneos podrían competir por la última unidad. La cancelación ya reclama la devolución en una sola sentencia atómica y no duplica el stock.
- **Número de pedido:** se genera aleatoriamente y se comprueba antes de insertar; el índice único evita duplicados. Dos creaciones simultáneas podrían chocar y requerir reintento.
- **Consulta por número:** la página `/pedidos` requiere sesión de cliente y solo muestra pedidos de esa cuenta. No es una consulta pública por número; muestra el estado actual, no el historial de cambios.
- **Cuenta con pedidos en curso:** la eliminación se bloquea. El cliente puede cancelar pedidos `pendiente` o `en_produccion`; si el pedido está `lista`, debe escribir a `contacto@valdra.store`. Un administrador puede resolver el caso manual; el cambio de rol también se bloquea con pedidos activos.
- **Correo de contacto:** el correo público es `contacto@valdra.store` y se configura con `NEXT_PUBLIC_CONTACT_EMAIL`; hay que crear/reenviar el buzón. La cuenta de administrador sigue separada, pero falta activar MFA en Google (operación, no código).
- **Borrado forzado:** un administrador todavía puede eliminar una cuenta con pedidos activos como excepción manual; es una decisión confirmada, no un bypass de cliente.
- **Carrera de borrado de cuenta:** el hook bloquea la fila del cliente con `FOR UPDATE` antes de contar pedidos, así que un pedido nuevo no puede colarse entre el conteo y el borrado.
- **Creación de pedidos:** el cliente tiene un máximo de 3 pedidos activos y 5 creaciones por hora en producción; el límite horario se omite en desarrollo local para no bloquear pruebas.
- **Sesiones:** el navegador comparte `payload-token` entre cliente y admin; se alternan sesiones. Separarlo requeriría un cambio de autenticación.
- **Stock al borrar:** no se devuelve para pedidos entregados; solo para pedidos no entregados y no devueltos por una cancelación.
- **Categorías y diseños:** las colecciones nuevas de HU-22/HU-23 amplían el alcance con dos migraciones y cambios en el catálogo.
- **Sin avisos:** no hay correo ni WhatsApp automáticos. En producción, el detalle informa que el equipo contactará por correo; el envío es manual y no se promete una fecha exacta.

## 6. Estado del documento

Decisiones confirmadas. Notion sigue siendo la fuente de verdad para el estado de las historias. Las migraciones están aplicadas, el stock sembrado y HU-18, HU-19 y HU-20 validadas; la UI de pedidos está mejorada, el aviso de producción está visible, la cuenta con pedidos en curso queda protegida y se aplicaron D-22 y D-23. Queda activar MFA, las HU-22/HU-23/HU-24 y la prueba móvil. No se ha creado ningún PR.
