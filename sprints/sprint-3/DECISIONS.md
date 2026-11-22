# Decisiones confirmadas del Sprint 3

Decisiones cerradas con el usuario el 21 de noviembre de 2026. Sustituyen las recomendaciones anteriores del documento. La base de pedidos ya está implementada en la rama `branch/SPRINT-3-orders-core` (commit `62d0365`); la migración **no** se ha aplicado.

## 1. Decisiones

| ID | Decisión | Estado |
| --- | --- | --- |
| D-01 | Colección propia `orders`; no se activan los pedidos del plugin ni el checkout | Implementada |
| D-02 | Un pedido por diseño aprobado, con cantidad entera de 1 a 10 | Implementada |
| D-03 | El cliente crea desde su diseño y el administrador también puede crear pedidos | Implementada en acceso/hooks; UI pendiente |
| D-04 | El pedido guarda prenda, talla, color, precio y diseño del momento; no se recalcula después | Implementada |
| D-05 | Estados `pendiente` → `en_produccion` → `lista` → `entregada`; `cancelada` desde pendiente o en producción | Implementada |
| D-06 | El historial de estados es solo para administradores; el cliente ve el estado actual | Implementada; historia oculta al cliente |
| D-07 | Precio fijo por prenda base en COP: camiseta **$60.000**, hoodie **$120.000**; sin envío, impuestos ni descuentos | Implementada |
| D-08 | Después de crear el pedido, el administrador solo cambia el estado; ítems, precio, cliente y diseño quedan congelados | Implementada |
| D-09 | Crear colección `categories` y cambiar `products.category` a relación; permite crear, editar y deshabilitar categorías | Pendiente (HU-22) |
| D-10 | Crear colección `designs` con imagen, relación a prendas y `active`; permite crear, editar, eliminar y deshabilitar diseños | Pendiente (HU-23) |
| D-11 | Usar el panel de Payload para pedidos, inventario, clientes, prendas y diseños | Implementada para pedidos e inventario |
| D-12 | Historial del cliente en `/cuenta` con lista y detalle simple; sin tiempo real | Pendiente (HU-19/20) |
| D-13 | Al eliminar la cuenta se eliminan también sus pedidos; el stock se devuelve | Implementada |
| D-14 | Número de pedido: ID de Payload mostrado como `#<id>` | Implementada en el modelo |
| D-15 | Sin avisos por correo o WhatsApp en Sprint 3; el estado se ve al consultar | Confirmada |
| D-16 | Cliente: crear y leer solo sus pedidos. Administrador: leer todos, cambiar estado y eliminar. Data API revocada y RLS activo | Implementada en código y migración; migración sin aplicar |
| D-17 | Una migración revisada; `push: false`; se aplica solo con aprobación y verificación de RLS | Pendiente de aplicar |
| D-18 | Datos de prueba sintéticos y limpieza al terminar | Pendiente para QA |
| D-19 | Stock por prenda base + talla en `garment-stock`; 1–10 unidades; se descuenta al crear y se devuelve al cancelar/eliminar | Implementada |
| D-20 | Precios base: camiseta $60.000 y hoodie $120.000 | Implementada |

## 2. Base implementada y protegida

Rama `branch/SPRINT-3-orders-core`, commit `62d0365`.

| Área | Archivos | Regla |
| --- | --- | --- |
| Colección de pedidos | `src/collections/Orders.ts` | Solo Jhancarlos |
| Inventario | `src/collections/GarmentStock.ts` | Solo Jhancarlos |
| Lógica de pedidos | `src/services/orders/order-hooks.ts` | Solo Jhancarlos |
| Estados y precios | `src/lib/orders/status.ts`, `pricing.ts`, `stock.ts` | Solo Jhancarlos; el equipo importa |
| Migración | `src/migrations/20261121_120000_orders_core.ts` | Solo Jhancarlos |
| Registro Payload | `src/collections/index.ts`, `payload.config.ts` | Solo Jhancarlos |
| Artefactos generados | `payload-types.ts`, import map | Solo Jhancarlos |
| Borrado de cuenta | Hook de `src/collections/Customers.ts` | Solo Jhancarlos |
| Semilla de stock | `scripts/seed-order-stock.ts` | Solo Jhancarlos |
| Dependencias | `package.json`, `pnpm-lock.yaml` | Solo Jhancarlos |

### Contratos que el equipo puede consumir

- `ORDER_STATUSES`, `ORDER_STATUS_LABELS` y `canTransitionOrderStatus`.
- `BASE_UNIT_PRICES`, `getDesignPricing`, `isOrderQuantity` y `calculateOrderTotal`.
- `getStockKey`, `parseStockKey` y `hasEnoughStock`.
- Los tipos generados `Order` y `GarmentStock` de `payload-types.ts`.

Las UI no deben duplicar etiquetas de estado ni calcular precios; el servidor es la fuente de verdad.

## 3. Reparto y límites

| Persona | Permitido | No tocar sin revisión |
| --- | --- | --- |
| Jhancarlos | Núcleo de pedidos e inventario, migración, HU-18, integración, docs | — |
| Kevin | HU-20 y apoyo a la creación del pedido | Esquema, hooks, tipos o migraciones de pedidos |
| Daniel | HU-21/HU-24 sobre el panel y pruebas; revisión de acceso/RLS | Esquema, máquina de estados o migraciones |
| Emanuel | HU-22 (categorías) y HU-25; cambios en `src/plugins/ecommerce.ts` con revisión | `orders`, `garment-stock`, precios o estados |
| Andrés | HU-23 (diseños) y HU-19; UI de historial/estado | `orders`, `garment-stock`, esquema o migraciones |

Las colecciones `categories` y `designs` pertenecen a HU-22/HU-23. Sus responsables deben coordinar con Jhancarlos cualquier cambio en `src/plugins/ecommerce.ts` y la migración correspondiente; no forman parte del núcleo de pedidos.

## 4. Pendientes antes de la demo

- [ ] Revisar y aplicar la migración `20261121_120000_orders_core` con `DATABASE_URL_MIGRATIONS`.
- [ ] Ejecutar `pnpm seed:order-stock` para crear las 40 filas de inventario (10 prendas × 4 tallas).
- [ ] Implementar la UI de creación del pedido para el cliente y el administrador.
- [ ] Implementar HU-19/HU-20 (historial y estado del cliente).
- [ ] Implementar HU-22 (colección `categories`) y HU-23 (colección `designs`).
- [ ] Probar el flujo completo en escritorio y móvil, con datos sintéticos.
- [ ] Actualizar Notion y registrar evidencias.

## 5. Riesgos y límites conocidos

- **Stock no atómico:** la comprobación y el descuento no comparten transacción; dos pedidos simultáneos podrían competir por la última unidad. Está marcado con `ponytail:` en `order-hooks.ts`; se resuelve con transacción/row lock cuando haga falta.
- **Migración sin aplicar:** la rama de pedidos no debe desplegarse hasta aplicar la migración y sembrar el stock.
- **Categorías y diseños:** las colecciones nuevas de HU-22/HU-23 amplían el alcance con dos migraciones y cambios en el catálogo.
- **UI pendiente:** la base existe, pero el cliente y el administrador todavía necesitan pantallas para crear y consultar pedidos.
- **Sin avisos:** el cliente solo ve el estado al consultar; no hay correo ni WhatsApp en este sprint.

## 6. Estado del documento

Decisiones confirmadas. Notion sigue siendo la fuente de verdad para el estado de las historias. La base de pedidos está lista para revisión, pero no debe aplicarse a Supabase sin aprobación de la migración.
