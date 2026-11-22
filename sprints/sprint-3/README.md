# Sprint 3 — Pedidos y administración

## Datos del sprint

- **Estado en Notion:** Backlog. Las 8 historias están sin responsable asignado.
- **Periodo:** 18 de noviembre — 1 de diciembre de 2026.
- **Objetivo:** que el cliente cree y consulte pedidos con su diseño aprobado, y que el administrador gestione catálogo, clientes y pedidos.
- **Alcance:** HU-18 a HU-25; **28 puntos**; 5 Must Have, 2 Should Have y 1 Could Have.
- **Módulo:** Pedidos y administración.
- **Fuente:** Product Backlog — Valdra Store (Notion), consultado el 21 de noviembre de 2026.
- **Página del sprint:** <https://app.notion.com/p/3f6cd0bef3648148b1ecc7c06f44334a>
- **Documentos de trabajo:** [DECISIONS.md](DECISIONS.md), [PLAN.md](PLAN.md) y [TODO.md](TODO.md).

## Listo cuando

El cliente crea un pedido desde un diseño aprobado, lo ve en su historial con su estado, y el administrador puede cambiar ese estado y verlo reflejado cuando el cliente consulta. El pedido conserva la prenda, talla, color, diseño y precio con los que fue creado.

## Historias y reparto propuesto

Las asignaciones de Notion están en «Por definir». Esta es una propuesta de reparto basada en las dependencias técnicas y en la capacidad del equipo; no reemplaza la asignación oficial.

| HU | Historia | Puntos | Prioridad | Responsable propuesto | Depende de |
| --- | --- | ---: | --- | --- | --- |
| HU-18 | Crear un pedido | 5 | Must Have | Jhancarlos Gonzalez | Modelo de pedidos (S3-T01) |
| HU-19 | Consultar historial de pedidos | 2 | Could Have | Andrés Valencia | HU-18 |
| HU-20 | Consultar estado del pedido | 3 | Must Have | Kevin Burgos | HU-18 |
| HU-21 | Actualizar estado del pedido | 3 | Must Have | Daniel Cárdenas | S3-T01 y D-05 |
| HU-22 | Gestionar productos y categorías | 5 | Must Have | Emanuel Giraldo | D-09; no depende de pedidos |
| HU-23 | Gestionar diseños disponibles | 3 | Should Have | Andrés Valencia | D-10; no depende de pedidos |
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

**Primero, en Jhancarlos:** la base de pedidos e inventario está implementada, la migración aplicada, el stock sembrado y HU-18 validada de punta a punta. Sigue la UI de HU-19/HU-20 y la coordinación de los cambios de HU-22/HU-23.

## Qué puede empezar ya, sin depender de pedidos

- **HU-22 (Emanuel):** crear la colección `categories`, cambiar `products.category` a relación y preparar su migración/admin (D-09). Es la parte de catálogo con más alcance.
- **HU-23 (Andrés):** crear la colección `designs` con imagen, relación a prendas y `active`, más su migración/admin (D-10).
- **HU-25 (Emanuel):** edición de precio e información de producto. La prueba de que un pedido conserva el precio anterior requiere que exista `orders`.
- **Andrés:** textos, estados vacíos y revisión responsive de historial/estado; se conectan cuando exista el backend.
- **Daniel:** checklist de acceso, RLS y auditoría para `orders`, usando el modelo propuesto.
- **Jhancarlos:** transcripción del backlog, decisiones y documentación del sprint.

## Dependencias

- **HU-18** depende del modelo de `orders`, de la relación con `approved-designs` y de que el diseño pertenezca al cliente.
- **HU-19 y HU-20** dependen de HU-18.
- **HU-21** depende de `orders` y del catálogo de estados aprobado (D-05).
- **HU-24** depende de `orders` y de HU-21 para el filtro por estado.
- **HU-22 y HU-23** no dependen de pedidos, pero sus colecciones nuevas (`categories` y `designs`) amplían el alcance con dos migraciones y cambios en el catálogo. **HU-25** no depende de pedidos.
- No hay pagos, checkout, carrito ni envíos en este sprint. WhatsApp (HU-26 a HU-28) y otros módulos quedan fuera.

## Decisiones y base protegida

La lista completa está en [DECISIONS.md](DECISIONS.md). Decisiones confirmadas:

- **Categorías:** crear la colección `categories` y cambiar `products.category` a relación (D-09).
- **Diseños:** crear la colección `designs` con imagen, relación a prendas y `active` (D-10).
- **Estados:** `pendiente`, `en_produccion`, `lista`, `entregada`, `cancelada` (D-05).
- **Pedido:** uno por diseño aprobado, cantidad 1–10 con stock (D-02, D-19).
- **Precio:** fijo por prenda base: camiseta $60.000 y hoodie $120.000, sin envío ni impuestos (D-07, D-20).
- **Quién crea:** cliente y administrador (D-03).
- **Panel:** usar el admin de Payload (D-11).
- **Cuenta eliminada:** se borran también sus pedidos y se devuelve el stock (D-13).
- **Avisos:** ninguno en este sprint; el estado se ve al consultar (D-15).

**Base que no se delega:** Jhancarlos conserva `orders`, `garment-stock`, migraciones, acceso/RLS, servicios, precios/estados, registro en Payload y artefactos generados. El equipo consume los contratos y no edita esos archivos sin revisión. Las colecciones de categorías y diseños pertenecen a HU-22/HU-23 y requieren revisión de Jhancarlos por el cambio de esquema.

## Estado del documento

Decisiones confirmadas el 21 de noviembre de 2026. La base de pedidos e inventario está implementada, la migración aplicada, el stock sembrado y HU-18 validada. Quedan HU-19/HU-20, HU-22/HU-23, HU-24 y la prueba del formulario de admin. Notion conserva la fuente de verdad del estado de las historias.
