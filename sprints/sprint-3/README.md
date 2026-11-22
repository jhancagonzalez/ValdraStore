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

Asignaciones actualizadas el 22 de noviembre de 2026. El reparto busca balancear el trabajo: HU-20 y HU-21 ya están funcionales y sus responsables cierran revisión y pruebas; HU-22 y HU-23 son el trabajo nuevo de catálogo.

| HU | Historia | Puntos | Prioridad | Responsable propuesto | Depende de |
| --- | --- | ---: | --- | --- | --- |
| HU-18 | Crear un pedido | 5 | Must Have | Jhancarlos Gonzalez | Modelo de pedidos (S3-T01) |
| HU-19 | Consultar historial de pedidos | 2 | Could Have | Jhancarlos Gonzalez | HU-18 |
| HU-20 | Consultar estado del pedido | 3 | Must Have | Kevin Burgos | HU-18 |
| HU-21 | Actualizar estado del pedido | 3 | Must Have | Emanuel Giraldo | S3-T01 y D-05 |
| HU-22 | Gestionar productos y categorías | 5 | Must Have | Andrés Valencia | D-09; no depende de pedidos |
| HU-23 | Gestionar diseños disponibles | 3 | Should Have | Daniel Cárdenas | D-10; no depende de pedidos |
| HU-24 | Gestionar clientes y pedidos | 5 | Must Have | Kevin Burgos | S3-T01 y HU-21 |
| HU-25 | Actualizar precios e información | 2 | Should Have | Emanuel Giraldo | HU-22; instantánea de precio depende de pedidos |
| **Total** | | **28** | **5 Must · 2 Should · 1 Could** | | |

## Reparto por persona

| Persona | Rol | Historias | Puntos | Enfoque |
| --- | --- | --- | ---: | --- |
| Jhancarlos Gonzalez | Scrum Master, Backend | HU-18 + HU-19 + base transversal | 7 | Modelo de pedidos, migración, acceso/RLS, creación, historial, integración y documentación |
| Kevin Burgos | Full Stack | HU-20 + HU-24 | 8 | Estado del cliente, revisión de `/pedidos` y administración de clientes/pedidos |
| Emanuel Giraldo | PO, Frontend | HU-21 + HU-25 | 5 | Revisión del cambio de estado, panel y edición de precios/información |
| Andrés Valencia | Frontend | HU-22 | 5 | Categorías, relación con productos, migración y catálogo |
| Daniel Cárdenas | Backend | HU-23 | 3 | Diseños, imágenes, relación con prendas y `active` |

**Primero, en Jhancarlos:** HU-18 y HU-19 están implementadas y validadas; la base de pedidos e inventario, las migraciones, el stock y la seguridad están cerrados. Sigue apoyando HU-24 (Kevin), HU-25 (Emanuel) y revisando los cambios de catálogo de HU-22/HU-23.

## Qué puede empezar ya, sin depender de pedidos

- **HU-22 (Andrés):** crear la colección `categories`, cambiar `products.category` a relación y preparar su migración/admin (D-09). Es la parte de catálogo con más alcance.
- **HU-23 (Daniel):** crear la colección `designs` con imagen, relación a prendas y `active`, más su migración/admin (D-10).
- **HU-25 (Emanuel):** edición de precio e información de producto; depende de HU-22. La prueba de que un pedido conserva el precio anterior requiere que exista `orders`.
- **Kevin:** revisar y cerrar HU-20; después iniciar HU-24 con la lista/detalle/filtros del panel.
- **Emanuel:** revisar y cerrar HU-21; después HU-25, cuando HU-22 esté listo.
- **Jhancarlos:** integración, revisión de esquemas, decisiones y documentación del sprint.

## Dependencias

- **HU-18** depende del modelo de `orders`, de la relación con `approved-designs` y de que el diseño pertenezca al cliente.
- **HU-19 y HU-20** dependen de HU-18. Comparten la página `/pedidos`; coordinar la lista/detalle con el estado.
- **HU-21** depende de `orders` y del catálogo de estados aprobado (D-05). HU-20 consume sus cambios de estado.
- **HU-24** depende de `orders` y de HU-21 para el filtro por estado.
- **HU-22 y HU-23** no dependen de pedidos, pero sus colecciones nuevas (`categories` y `designs`) amplían el alcance con dos migraciones y cambios en el catálogo; comparten `src/plugins/ecommerce.ts` y deben coordinarse. **HU-25** depende de HU-22.
- No hay pagos, checkout, carrito ni envíos en este sprint. WhatsApp (HU-26 a HU-28) y otros módulos quedan fuera.

## Decisiones y base protegida

La lista completa está en [DECISIONS.md](DECISIONS.md). Decisiones confirmadas:

- **Categorías:** crear la colección `categories` y cambiar `products.category` a relación (D-09).
- **Diseños:** crear la colección `designs` con imagen, relación a prendas y `active` (D-10).
- **Estados:** `pendiente`, `en_produccion`, `lista`, `entregada`, `cancelada` (D-05).
- **Pedido:** uno por diseño aprobado, cantidad 1–10 con stock (D-02, D-19).
- **Número:** aleatorio de seis cifras, único, guardado y consultable por el cliente autenticado en `/pedidos` (D-14).
- **Pedidos del cliente:** menú «Pedidos» con lista, detalle, estado, avance, aviso de producción y consulta por número (D-12, D-14).
- **Seguridad:** redirects internos, error de diseño genérico, cancelación atómica de stock, historial/stock no reescribibles, cambio de rol bloqueado con pedidos activos, borrado con contraseña y bloqueo `FOR UPDATE` (D-22, D-23).
- **Límites:** máximo 3 pedidos activos y 5 creaciones por hora en producción (D-23).
- **Precio:** fijo por prenda base: camiseta $60.000 y hoodie $120.000, sin envío ni impuestos (D-07, D-20).
- **Quién crea:** cliente y administrador (D-03).
- **Panel:** usar el admin de Payload (D-11).
- **Cuenta eliminada:** se borran también sus pedidos y diseños (D-13); el stock se devuelve solo para pedidos no entregados.
- **Cuenta con pedidos en curso:** no se puede eliminar; el cliente cancela desde `/pedidos` o escribe a `contacto@valdra.store` (D-21).
- **Avisos:** no hay correo ni WhatsApp automáticos en este sprint; el estado se ve al consultar. En producción, el detalle avisa que el equipo contactará por correo (D-15).

**Base que no se delega:** Jhancarlos conserva `orders`, `garment-stock`, migraciones, acceso/RLS, servicios, precios/estados, registro en Payload y artefactos generados. El equipo consume los contratos y no edita esos archivos sin revisión. Las colecciones de categorías y diseños pertenecen a HU-22/HU-23 y requieren revisión de Jhancarlos por el cambio de esquema.

## Estado del documento

Decisiones confirmadas el 21 de noviembre de 2026. La base de pedidos e inventario está implementada, las migraciones están aplicadas, el stock está sembrado y HU-18, HU-19 y HU-20 están validadas; el formulario de admin fue probado, la UI de `/pedidos` está mejorada, el aviso de producción está visible, la cuenta con pedidos en curso queda protegida y se aplicaron los endurecimientos D-22/D-23. Queda activar MFA, las HU-22/HU-23/HU-24 y la prueba móvil. Notion conserva la fuente de verdad del estado de las historias.
