# TODO — Sprint 3

Criterios transcritos del [Product Backlog de Notion](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1) el 21 de noviembre de 2026. Las 8 historias figuran en **Backlog** y sin responsable asignado. Este documento no agrega criterios nuevos.

## Resumen y reparto propuesto

| HU | Historia | Puntos | Prioridad | Responsable propuesto | Depende de |
| --- | --- | ---: | --- | --- | --- |
| HU-18 | Crear un pedido | 5 | Must Have | Jhancarlos Gonzalez | S3-T01 |
| HU-19 | Consultar historial de pedidos | 2 | Could Have | Andrés Valencia | HU-18 |
| HU-20 | Consultar estado del pedido | 3 | Must Have | Kevin Burgos | HU-18 |
| HU-21 | Actualizar estado del pedido | 3 | Must Have | Daniel Cárdenas | S3-T01, C-20 |
| HU-22 | Gestionar productos y categorías | 5 | Must Have | Emanuel Giraldo | C-18 |
| HU-23 | Gestionar diseños disponibles | 3 | Should Have | Andrés Valencia | C-19 |
| HU-24 | Gestionar clientes y pedidos | 5 | Must Have | Daniel Cárdenas | S3-T01, HU-21 |
| HU-25 | Actualizar precios e información | 2 | Should Have | Emanuel Giraldo | HU-22 |
| **Total** | | **28** | **5 Must · 2 Should · 1 Could** | | |

## Primero (Jhancarlos)

1. Cerrar C-18 a C-23 con el PO/cliente y congelar el alcance.
2. Modelo `orders`, estados, acceso, RLS y migración (S3-T01).
3. Creación del pedido y UI de confirmación (HU-18).
4. Integración, E2E, evidencias y actualización de Notion.

HU-18 bloquea HU-19, HU-20, HU-21 y HU-24. No debe empezar por la UI.

## Puede empezar ya (sin depender de pedidos)

- **Emanuel — HU-22:** inventario del admin de prendas, validaciones de nombre/categoría/precio y edición de categorías. C-18 puede convertirla en colección.
- **Andrés — HU-23:** inventario de `designs` y medios; definir si se queda como carga asociada o pasa a colección con `active` (C-19).
- **Emanuel — HU-25:** edición de precio e información; la prueba de instantánea se hace cuando exista `orders`.
- **Andrés:** textos, estados vacíos y revisión responsive de historial/estado.
- **Daniel:** checklist de acceso/RLS/auditoría para `orders`.
- **Jhancarlos:** transcripción, decisiones y documentación.

## HU-18 — Crear un pedido · 5 puntos · Must Have

Responsable propuesto: **Jhancarlos Gonzalez**. Depende de S3-T01.

- [ ] El cliente puede crear un pedido con la prenda, talla, color y diseño aprobado.
- [ ] El pedido se guarda con fecha, cliente, productos y estado inicial.
- [ ] El sistema confirma al cliente que el pedido fue creado y no permite crear un pedido sin diseño o prenda.

Tareas: modelo de `orders`; servicio que fija cliente, estado inicial, precio y total; validación de propiedad del diseño; UI de creación y confirmación; pruebas negativas sin diseño o sin prenda.

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

Responsable propuesto: **Daniel Cárdenas**. Depende de S3-T01 y C-20.

- [ ] El administrador puede cambiar el estado de un pedido entre las etapas de producción definidas.
- [ ] Cada cambio de estado queda registrado con fecha y usuario que lo realizó.
- [ ] Un cliente no puede cambiar el estado de ningún pedido.

Tareas: transiciones permitidas; `statusHistory` con fecha y administrador; endpoint/panel solo para admin; prueba negativa con cliente.

## HU-22 — Gestionar productos y categorías · 5 puntos · Must Have

Responsable propuesto: **Emanuel Giraldo**. Depende de C-18.

- [ ] El administrador puede crear, editar y deshabilitar productos y categorías.
- [ ] No se puede guardar un producto sin nombre, categoría y precio.
- [ ] Los cambios se reflejan en el catálogo que ve el cliente.

Tareas: validaciones del producto; gestión de categorías según C-18; deshabilitar producto (borrador/estado); revalidación del catálogo.

## HU-23 — Gestionar diseños disponibles · 3 puntos · Should Have

Responsable propuesto: **Andrés Valencia**. Depende de C-19.

- [ ] El administrador puede crear, editar y eliminar los diseños disponibles.
- [ ] Los diseños se pueden asociar a las prendas con su imagen.
- [ ] Los diseños deshabilitados dejan de mostrarse a los clientes.

Tareas: CRUD de diseños/imágenes; asociación a prendas; estado activo o desasociación según C-19; lectura pública solo de activos.

## HU-24 — Gestionar clientes y pedidos · 5 puntos · Must Have

Responsable propuesto: **Daniel Cárdenas**, con apoyo de **Emanuel Giraldo** en el panel. Depende de S3-T01 y HU-21.

- [ ] El panel muestra la lista de clientes y de pedidos con sus datos principales.
- [ ] El administrador puede abrir el detalle de un pedido y de un cliente.
- [ ] El administrador puede buscar o filtrar pedidos por estado.

Tareas: colección `orders` en el grupo «Pedidos»; columnas y detalle; filtro por estado; clientes existentes en «Cuentas».

## HU-25 — Actualizar precios e información · 2 puntos · Should Have

Responsable propuesto: **Emanuel Giraldo**. Depende de HU-22; la instantánea de precio depende de `orders`.

- [ ] El administrador puede modificar el precio y la información de un producto.
- [ ] El nuevo precio se muestra en el catálogo después de guardar.
- [ ] Los pedidos ya creados conservan el precio con el que fueron realizados.

Tareas: edición de producto; revalidación del catálogo; instantánea `unitPrice`/`total` en el pedido; prueba de que un pedido antiguo no cambia al editar el precio.

## Decisiones pendientes

Ver [README.md](README.md) y [PLAN.md](PLAN.md): C-18 categorías, C-19 diseños, C-20 estados, C-21 cantidad, C-22 precio/moneda y C-23 panel administrativo.

## Checklist de cierre por historia

- [ ] Criterios de aceptación verificados.
- [ ] Pruebas unitarias o de integración cuando aplique.
- [ ] Prueba manual en navegador (escritorio y móvil).
- [ ] Control de acceso por propietario y validación en servidor.
- [ ] Migración revisada y aplicada, si cambia el esquema.
- [ ] Evidencia registrada en `sprints/sprint-3/` y estado actualizado en Notion.

No se declaran criterios cumplidos por tener la pantalla o el endpoint creados.
