# TODO — Sprint 3

Criterios transcritos del [Product Backlog de Notion](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1) el 21 de noviembre de 2026. Las 8 historias figuran en **Backlog** y sin responsable asignado. Este documento no agrega criterios nuevos.

La base y los límites están en [DECISIONS.md](DECISIONS.md). **Núcleo Jhancarlos:** `orders`, migraciones, acceso/RLS, servicios, tipos/estados y artefactos generados no se editan sin su revisión.

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

1. Cerrar D-02 a D-15 con el PO/cliente y congelar el alcance.
2. Modelo `orders`, estados, acceso, RLS y migración (S3-T01).
3. Creación del pedido y UI de confirmación (HU-18).
4. Integración, E2E, evidencias y actualización de Notion.

HU-18 bloquea HU-19, HU-20, HU-21 y HU-24. No debe empezar por la UI.

## Puede empezar ya (sin depender de pedidos)

- **Emanuel — HU-22:** inventario del admin de prendas, validaciones de nombre/categoría/precio y edición dentro del `select` actual (D-09).
- **Andrés — HU-23:** inventario de `designs` y medios; se mantiene la carga por prenda (D-10).
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

> **Aclaración D-09:** con el `select` actual se pueden crear/editar/deshabilitar productos y elegir una categoría, pero no crear ni deshabilitar categorías. Si el cliente exige esa parte literal, se necesita una colección `categories` y una migración; no se implementa por iniciativa de un integrante.

Tareas: validaciones del producto; categorías dentro del `select` actual (D-09); deshabilitar producto (borrador/estado); revalidación del catálogo.

## HU-23 — Gestionar diseños disponibles · 3 puntos · Should Have

Responsable propuesto: **Andrés Valencia**. Depende de D-10.

- [ ] El administrador puede crear, editar y eliminar los diseños disponibles.
- [ ] Los diseños se pueden asociar a las prendas con su imagen.
- [ ] Los diseños deshabilitados dejan de mostrarse a los clientes.

> **Aclaración D-10:** con la carga de medios por prenda se pueden subir, reemplazar, asociar y quitar diseños; «deshabilitar» significa quitar la asociación o dejar la prenda en borrador. Un estado `active` independiente requiere una colección `designs` y migración.

Tareas: carga/reemplazo de imágenes de diseño; asociación a prendas; «deshabilitar» = quitar la asociación o dejar la prenda en borrador (D-10); lectura pública solo de lo publicado.

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

Tareas: edición de producto; revalidación del catálogo; instantánea `unitPrice`/`total` en el pedido; prueba de que un pedido antiguo no cambia al editar el precio.

## Decisiones pendientes

Ver [DECISIONS.md](DECISIONS.md): D-02 a D-15.

## Checklist de cierre por historia

- [ ] Criterios de aceptación verificados.
- [ ] Pruebas unitarias o de integración cuando aplique.
- [ ] Prueba manual en navegador (escritorio y móvil).
- [ ] Control de acceso por propietario y validación en servidor.
- [ ] Migración revisada y aplicada, si cambia el esquema.
- [ ] Evidencia registrada en `sprints/sprint-3/` y estado actualizado en Notion.

No se declaran criterios cumplidos por tener la pantalla o el endpoint creados.
