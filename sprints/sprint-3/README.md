# Sprint 3 — Pedidos y administración

## Datos del sprint

- **Estado en Notion:** Backlog. Las 8 historias están sin responsable asignado.
- **Periodo:** 18 de noviembre — 1 de diciembre de 2026.
- **Objetivo:** que el cliente cree y consulte pedidos con su diseño aprobado, y que el administrador gestione catálogo, clientes y pedidos.
- **Alcance:** HU-18 a HU-25; **28 puntos**; 5 Must Have, 2 Should Have y 1 Could Have.
- **Módulo:** Pedidos y administración.
- **Fuente:** Product Backlog — Valdra Store (Notion), consultado el 21 de noviembre de 2026.
- **Página del sprint:** <https://app.notion.com/p/3f6cd0bef3648148b1ecc7c06f44334a>
- **Documentos de trabajo:** [PLAN.md](PLAN.md) y [TODO.md](TODO.md).

## Listo cuando

El cliente crea un pedido desde un diseño aprobado, lo ve en su historial con su estado, y el administrador puede cambiar ese estado y verlo reflejado cuando el cliente consulta. El pedido conserva la prenda, talla, color, diseño y precio con los que fue creado.

## Historias y reparto propuesto

Las asignaciones de Notion están en «Por definir». Esta es una propuesta de reparto basada en las dependencias técnicas y en la capacidad del equipo; no reemplaza la asignación oficial.

| HU | Historia | Puntos | Prioridad | Responsable propuesto | Depende de |
| --- | --- | ---: | --- | --- | --- |
| HU-18 | Crear un pedido | 5 | Must Have | Jhancarlos Gonzalez | Modelo de pedidos (S3-T01) |
| HU-19 | Consultar historial de pedidos | 2 | Could Have | Andrés Valencia | HU-18 |
| HU-20 | Consultar estado del pedido | 3 | Must Have | Kevin Burgos | HU-18 |
| HU-21 | Actualizar estado del pedido | 3 | Must Have | Daniel Cárdenas | S3-T01 y C-20 |
| HU-22 | Gestionar productos y categorías | 5 | Must Have | Emanuel Giraldo | C-18; no depende de pedidos |
| HU-23 | Gestionar diseños disponibles | 3 | Should Have | Andrés Valencia | C-19; no depende de pedidos |
| HU-24 | Gestionar clientes y pedidos | 5 | Must Have | Daniel Cárdenas | S3-T01 y HU-21 |
| HU-25 | Actualizar precios e información | 2 | Should Have | Emanuel Giraldo | HU-22; instantánea de precio depende de pedidos |
| **Total** | | **28** | **5 Must · 2 Should · 1 Could** | | |

## Reparto por persona

| Persona | Rol | Historias | Puntos | Enfoque |
| --- | --- | --- | ---: | --- |
| Jhancarlos Gonzalez | Scrum Master, Backend | HU-18 + base transversal | 5 | Modelo de pedidos, migración, acceso/RLS, creación de pedido, integración y documentación |
| Kevin Burgos | Full Stack | HU-20 + apoyo HU-18 | 3 | Estado del pedido para el cliente y apoyo en la creación |
| Daniel Cárdenas | Backend | HU-21 + HU-24 | 8 | Cambio de estado con historial, administración de clientes y pedidos, revisión de seguridad |
| Emanuel Giraldo | PO, Frontend | HU-22 + HU-25 | 7 | Administración de productos/categorías, precios y apoyo en el panel |
| Andrés Valencia | Frontend | HU-23 + HU-19 | 5 | Diseños disponibles, historial del cliente y apoyo de UI/QA |

**Primero, en Jhancarlos:** cerrar las decisiones C-18 a C-21, congelar el modelo de `orders`, escribir la migración con acceso/RLS y sacar HU-18. Es la ruta crítica que desbloquea HU-19, HU-20, HU-21 y HU-24.

## Qué puede empezar ya, sin depender de pedidos

- **HU-22 (Emanuel):** inventario del admin actual de prendas, validaciones de nombre/categoría/precio y edición de categorías. La decisión C-18 puede convertirla en una colección nueva.
- **HU-23 (Andrés):** inventario del campo `designs` de cada prenda y de la gestión de medios; definir si se queda como carga asociada o pasa a una colección con estado activo (C-19).
- **HU-25 (Emanuel):** edición de precio e información de producto. La prueba de que un pedido conserva el precio anterior requiere que exista `orders`.
- **Andrés:** textos, estados vacíos y revisión responsive de historial/estado; se conectan cuando exista el backend.
- **Daniel:** checklist de acceso, RLS y auditoría para `orders`, usando el modelo propuesto.
- **Jhancarlos:** transcripción del backlog, decisiones y documentación del sprint.

## Dependencias

- **HU-18** depende del modelo de `orders`, de la relación con `approved-designs` y de que el diseño pertenezca al cliente.
- **HU-19 y HU-20** dependen de HU-18.
- **HU-21** depende de `orders` y del catálogo de estados aprobado (C-20).
- **HU-24** depende de `orders` y de HU-21 para el filtro por estado.
- **HU-22, HU-23 y HU-25** no dependen de pedidos, pero C-18/C-19 pueden ampliar su alcance.
- No hay pagos, checkout, carrito ni envíos en este sprint. WhatsApp (HU-26 a HU-28) y otros módulos quedan fuera.

## Decisiones que requieren aprobación

| ID | Tema | Propuesta |
| --- | --- | --- |
| C-18 | Categorías | Hoy `category` es un `select` fijo en `products`. La historia pide crear/editar/deshabilitar categorías. Propuesta: colección `categories` y relación; alternativa: mantener el select y limitar la gestión a elegir una opción existente. |
| C-19 | Diseños disponibles | Hoy `designs` es una carga múltiple de `media` por prenda. La historia pide crear/editar/eliminar/deshabilitar. Propuesta: colección `designs` con imagen, prendas relacionadas y `active`; alternativa: mantener `media` y quitar la asociación para “deshabilitar”. |
| C-20 | Estados del pedido | Propuesta: `pendiente`, `en_produccion`, `lista`, `entregada`, `cancelada`. Definir nombres y transiciones permitidas. |
| C-21 | Cantidad y alcance del pedido | Propuesta: un pedido por diseño aprobado, cantidad 1, sin carrito ni pagos. Confirmar si se permiten varias unidades. |
| C-22 | Precio y moneda | Propuesta: COP, precio de la variante al momento del pedido, guardado como instantánea; sin envío ni impuestos. |
| C-23 | Panel administrativo | Propuesta: usar el panel de Payload para clientes, pedidos, prendas y diseños; no crear un panel paralelo. |

## Estado del documento

Propuesta de trabajo para revisión del equipo. No modifica Notion, no asigna responsables oficiales y no marca historias como terminadas. Notion conserva la fuente de verdad.
