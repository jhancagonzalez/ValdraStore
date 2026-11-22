# TODO — Sprint 3

Criterios transcritos del [Product Backlog de Notion](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1) el 21 de noviembre de 2026. Las 8 historias figuran en **Backlog** y sin responsable asignado. Este documento no agrega criterios nuevos.

La base y los límites están en [DECISIONS.md](DECISIONS.md). **Núcleo Jhancarlos:** `orders`, `garment-stock`, migraciones, acceso/RLS, servicios, tipos/estados/precios y artefactos generados no se editan sin su revisión. La base de pedidos e inventario está implementada en `branch/SPRINT-3-orders-core` (commit `62d0365`); la migración aún no se aplica.

## Resumen y reparto propuesto

| HU | Historia | Puntos | Prioridad | Responsable propuesto | Depende de |
| --- | --- | ---: | --- | --- | --- |
| HU-18 | Crear un pedido | 5 | Must Have | Jhancarlos Gonzalez | S3-T01 |
| HU-19 | Consultar historial de pedidos | 2 | Could Have | Andrés Valencia | HU-18 |
| HU-20 | Consultar estado del pedido | 3 | Must Have | Kevin Burgos | HU-18 |
| HU-21 | Actualizar estado del pedido | 3 | Must Have | Daniel Cárdenas | S3-T01, D-05 |
| HU-22 | Gestionar productos y categorías | 5 | Must Have | Emanuel Giraldo | D-09 |
| HU-23 | Gestionar diseños disponibles | 3 | Should Have | Andrés Valencia | D-10 |
| HU-24 | Gestionar clientes y pedidos | 5 | Must Have | Daniel Cárdenas | S3-T01, HU-21 |
| HU-25 | Actualizar precios e información | 2 | Should Have | Emanuel Giraldo | HU-22 |
| **Total** | | **28** | **5 Must · 2 Should · 1 Could** | | |

## Primero (Jhancarlos)

1. Revisar y aplicar la migración `20261121_120000_orders_core`; ejecutar `pnpm seed:order-stock`.
2. UI de creación y confirmación del pedido (HU-18).
3. Integración, E2E, evidencias y actualización de Notion.
4. Revisar los cambios de esquema de HU-22/HU-23.

HU-18 bloquea HU-19, HU-20, HU-21 y HU-24. No debe empezar por la UI.

## Puede empezar ya (sin depender de pedidos)

- **Emanuel — HU-22:** crear la colección `categories`, cambiar `products.category` a relación y preparar su migración/admin (D-09).
- **Andrés — HU-23:** crear la colección `designs` con imagen, relación a prendas y `active`, más su migración/admin (D-10).
- **Emanuel — HU-25:** edición de precio e información del catálogo; los pedidos usan la tabla fija de precios por prenda base.
- **Andrés:** textos, estados vacíos y revisión responsive de historial/estado.
- **Daniel:** checklist de acceso/RLS/auditoría para `orders`.
- **Jhancarlos:** transcripción, decisiones y documentación.

## HU-18 — Crear un pedido · 5 puntos · Must Have

Responsable propuesto: **Jhancarlos Gonzalez**. Depende de S3-T01.

- [ ] El cliente puede crear un pedido con la prenda, talla, color y diseño aprobado.
- [ ] El pedido se guarda con fecha, cliente, productos y estado inicial.
- [ ] El sistema confirma al cliente que el pedido fue creado y no permite crear un pedido sin diseño o prenda.

Tareas: modelo de `orders` con diseño, cantidad 1–10, stock e instantáneas; precio fijo de la prenda base; creación por cliente o administrador; UI de creación y confirmación; pruebas negativas sin diseño, sin prenda o sin stock.

## HU-19 — Consultar historial de pedidos · 2 puntos · Could Have

Responsable propuesto: **Andrés Valencia**. Depende de HU-18.

- [ ] El cliente ve la lista de sus pedidos con fecha, producto y estado.
- [ ] Solo se muestran los pedidos del cliente autenticado.
- [ ] Los pedidos aparecen ordenados del más reciente al más antiguo.

Tareas: consulta filtrada por propietario, orden descendente, estado vacío y enlace al detalle.

## HU-20 — Consultar estado del pedido · 3 puntos · Must Have

Responsable propuesto: **Kevin Burgos**. Depende de HU-18.

- [ ] El cliente ve el estado actual de cada uno de sus pedidos.
- [ ] Los estados mostrados corresponden a las etapas de producción definidas por Valdra Store.
- [ ] Cuando el administrador cambia el estado, el cliente lo ve actualizado al consultar.

Tareas: estado visible en historial/detalle; revalidación al consultar; no prometer tiempo real.

## HU-21 — Actualizar estado del pedido · 3 puntos · Must Have

Responsable propuesto: **Daniel Cárdenas**. Depende de S3-T01 y D-05.

- [ ] El administrador puede cambiar el estado de un pedido entre las etapas de producción definidas.
- [ ] Cada cambio de estado queda registrado con fecha y usuario que lo realizó.
- [ ] Un cliente no puede cambiar el estado de ningún pedido.

Tareas: transiciones permitidas; `statusHistory` con fecha y administrador; endpoint/panel solo para admin; prueba negativa con cliente. La máquina de estados la define Jhancarlos; Daniel implementa el cambio y las pruebas.

## HU-22 — Gestionar productos y categorías · 5 puntos · Must Have

Responsable propuesto: **Emanuel Giraldo**. Depende de D-09.

- [ ] El administrador puede crear, editar y deshabilitar productos y categorías.
- [ ] No se puede guardar un producto sin nombre, categoría y precio.
- [ ] Los cambios se reflejan en el catálogo que ve el cliente.

**Decisión confirmada (D-09):** se crea la colección `categories` y `products.category` pasa de `select` a relación. Incluye migración, CRUD/desactivado de categorías y actualización de filtros del catálogo.

Tareas: colección `categories`; relación con productos; migración revisada; validaciones del producto; deshabilitar producto/categoría; revalidación del catálogo. Coordinar con Jhancarlos por el cambio en `src/plugins/ecommerce.ts`.

## HU-23 — Gestionar diseños disponibles · 3 puntos · Should Have

Responsable propuesto: **Andrés Valencia**. Depende de D-10.

- [ ] El administrador puede crear, editar y eliminar los diseños disponibles.
- [ ] Los diseños se pueden asociar a las prendas con su imagen.
- [ ] Los diseños deshabilitados dejan de mostrarse a los clientes.

**Decisión confirmada (D-10):** se crea la colección `designs` con imagen, relación a prendas y `active`; `products.designs` pasa de carga de medios a relación. Incluye migración y lectura pública solo de activos.

Tareas: colección `designs`; carga de imagen; relación con prendas; `active`; migración revisada; CRUD y lectura pública de activos. Coordinar con Jhancarlos por el cambio en `src/plugins/ecommerce.ts`.

## HU-24 — Gestionar clientes y pedidos · 5 puntos · Must Have

Responsable propuesto: **Daniel Cárdenas**, con apoyo de **Emanuel Giraldo** en el panel. Depende de S3-T01 y HU-21.

- [ ] El panel muestra la lista de clientes y de pedidos con sus datos principales.
- [ ] El administrador puede abrir el detalle de un pedido y de un cliente.
- [ ] El administrador puede buscar o filtrar pedidos por estado.

Tareas: la colección y la configuración base de `orders` las crea Jhancarlos; Daniel trabaja sobre el panel, columnas, filtros y pruebas; clientes existentes en «Cuentas».

## HU-25 — Actualizar precios e información · 2 puntos · Should Have

Responsable propuesto: **Emanuel Giraldo**. Depende de HU-22; la instantánea de precio depende de `orders`.

- [ ] El administrador puede modificar el precio y la información de un producto.
- [ ] El nuevo precio se muestra en el catálogo después de guardar.
- [ ] Los pedidos ya creados conservan el precio con el que fueron realizados.

Tareas: edición de producto; revalidación del catálogo; los pedidos usan la tabla fija por prenda base, así que un cambio de precio de producto no altera pedidos; probar que un pedido antiguo conserva su `unitPrice` y `total`.

## Decisiones confirmadas

Ver [DECISIONS.md](DECISIONS.md): D-01 a D-20. La base de pedidos e inventario está implementada; la migración y la semilla de stock están pendientes.

## Checklist de cierre por historia

- [ ] Criterios de aceptación verificados.
- [ ] Pruebas unitarias o de integración cuando aplique.
- [ ] Prueba manual en navegador (escritorio y móvil).
- [ ] Control de acceso por propietario y validación en servidor.
- [ ] Migración revisada y aplicada, si cambia el esquema.
- [ ] Evidencia registrada en `sprints/sprint-3/` y estado actualizado en Notion.

No se declaran criterios cumplidos por tener la pantalla o el endpoint creados.
