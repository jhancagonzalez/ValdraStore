# Decisiones y límites del Sprint 3

Este documento se escribe **antes de repartir trabajo**. Su objetivo es cerrar las ambigüedades que pueden cambiar el alcance, congelar la base técnica y dejar claro qué puede tocar cada integrante.

Leyenda:

- **Recomendación:** opción propuesta para no frenar el sprint.
- **Decide:** quién puede cambiarla.
- **Si no hay respuesta:** valor por defecto que se aplica y se registra como limitación.

## 1. Decisiones de alcance

| ID | Tema | Recomendación | Decide | Impacto |
| --- | --- | --- | --- | --- |
| D-01 | Modelo de pedidos | Colección propia `orders`; no activar los pedidos del plugin (arrastran checkout, carrito y pagos) | Equipo | Base de HU-18/20/21/24 |
| D-02 | Unidad del pedido | Un pedido = un diseño aprobado, cantidad **1**, sin carrito | Cliente/PO | HU-18; si se piden varias unidades, cambia el modelo |
| D-03 | Quién crea el pedido | Solo un cliente autenticado desde su diseño aprobado; el administrador no crea pedidos en este sprint | Equipo/PO | HU-18 |
| D-04 | Instantánea del pedido | Guardar prenda, talla, color, diseño e imagen/precio del momento; el pedido no cambia si el catálogo cambia | Equipo | HU-18 y HU-25 |
| D-05 | Estados | `pendiente` → `en_produccion` → `lista` → `entregada`; `cancelada` desde pendiente o en producción | Cliente/PO | HU-20/21; define la máquina de estados |
| D-06 | Historial de estados | El administrador ve el historial completo; el cliente ve el estado actual | Equipo | HU-20/21 y privacidad |
| D-07 | Precio | Precio de la variante en COP, cantidad 1, sin envío, impuestos ni descuentos; `total = unitPrice` | Cliente/PO | HU-18/25 |
| D-08 | Edición posterior | Después de crear el pedido, el administrador solo cambia el estado; no edita ítems, precio, cliente ni diseño | Cliente/PO | HU-21/24; protege la instantánea |
| D-09 | Categorías | Mantener `category` como `select` en Sprint 3; no crear una colección dinámica | Cliente/PO | HU-22; evita migración y alcance extra |
| D-10 | Diseños disponibles | Mantener `designs` como carga de `media` por prenda; “deshabilitar” = quitar la asociación o dejar la prenda en borrador | Cliente/PO | HU-23; evita una colección nueva |
| D-11 | Panel administrativo | Usar el panel de Payload; pedidos en su propio grupo; clientes ya existen en «Cuentas» | Equipo | HU-24; no duplicar panel |
| D-12 | Historial del cliente | Lista en `/cuenta` y detalle simple; sin tiempo real ni notificaciones | Equipo | HU-19/20 |
| D-13 | Eliminación de cuenta | En el prototipo, borrar también los pedidos del cliente; antes de producción se define retención | Cliente/PO | Privacidad; evita datos huérfanos |
| D-14 | Número de pedido | Usar el ID de Payload y mostrarlo como `#<id>` | Equipo | UI; sin campo extra |
| D-15 | Notificaciones | Ninguna en Sprint 3; el estado se ve al consultar. WhatsApp y avisos quedan para el Sprint 4 | Cliente/PO | HU-20; evita prometer tiempo real |
| D-16 | Acceso y RLS | Cliente: crear y leer solo sus pedidos. Administrador: leer todos, cambiar estado y eliminar. Revocar Data API y mantener RLS | Equipo | Seguridad de todas las historias |
| D-17 | Migración | Una migración revisada; `push: false`; se aplica solo con aprobación y verificación de RLS | Equipo | Base de datos |
| D-18 | Datos de prueba | Solo datos sintéticos; limpiar cuentas, pedidos y diseños de prueba al terminar | Equipo | QA/demo |

**Si no hay respuesta antes del 22 de noviembre:** se aplican D-02, D-05, D-07, D-08, D-09, D-10, D-13 y D-15 tal como están escritas, y se registra la limitación en el README del sprint.

## 2. Núcleo Jhancarlos — no editar sin revisión

Esta es la base que **no deben tocar** los demás integrantes. Se puede leer e importar, pero no modificar sin pasar por Jhancarlos.

| Área | Archivos o artefactos | Regla |
| --- | --- | --- |
| Colección de pedidos | `src/collections/Orders.ts` y sus hooks/access | Solo Jhancarlos |
| Lógica de pedidos | `src/services/orders/*` | Solo Jhancarlos |
| Contratos y estados | `src/lib/orders/*` (tipos, constantes, etiquetas) | Solo Jhancarlos; los demás importan |
| Acceso y RLS | Reglas de `orders` en `src/access/*`, migración con RLS | Solo Jhancarlos; Daniel revisa, no edita |
| Registro Payload | `src/collections/index.ts`, `payload.config.ts` | Solo Jhancarlos |
| Artefactos generados | `payload-types.ts`, import map | Solo Jhancarlos |
| Vínculo con diseños | `src/collections/ApprovedDesigns.ts` (relación con pedido) | Solo Jhancarlos |
| Migraciones | `src/migrations/*orders*` | Solo Jhancarlos |
| Dependencias | `package.json`, `pnpm-lock.yaml` | Solo Jhancarlos |
| Documentación | `sprints/sprint-3/*` | Jhancarlos; el equipo propone cambios por PR/issue |

### Contratos que sí pueden consumir

- Tipos `OrderSummary` y `OrderDetail`.
- Constantes y etiquetas de estado (`pendiente`, `en_produccion`, etc.).
- Acciones/servicios de creación, consulta y cambio de estado.
- Mensajes de error y reglas de validación.

Las UI **no deben** duplicar etiquetas de estado ni calcular precios o totales por su cuenta. El servidor es la fuente de verdad.

## 3. Qué puede tocar cada persona

| Persona | Permitido | Prohibido sin revisión |
| --- | --- | --- |
| Jhancarlos | Núcleo completo, HU-18, integración, migraciones, docs | — |
| Kevin | UI de estado/historial del cliente, apoyo a HU-18 | Esquema, servicios, tipos o migraciones de pedidos |
| Daniel | HU-21/HU-24 sobre el panel y pruebas; revisión de acceso/RLS | Cambiar el esquema o la máquina de estados |
| Emanuel | HU-22/HU-25, configuración de productos/categorías dentro del modelo actual | Cambiar el modelo de pedidos o crear colecciones sin aprobación de D-09/D-10 |
| Andrés | HU-23, UI de historial/estado, QA visual | Esquema, servicios, migraciones o tipos de pedidos |

Si una tarea delegada necesita un cambio en el núcleo, se detiene y se coordina con Jhancarlos; no se duplica la lógica en otra rama.

## 4. Preguntas que deben cerrarse antes de delegar

1. ¿Un pedido puede tener varias prendas o siempre es una? (D-02)
2. ¿Los estados y transiciones propuestos son los correctos? (D-05)
3. ¿El precio incluye envío, impuestos o descuentos? (D-07)
4. ¿El administrador puede editar ítems o precios después de crear el pedido? (D-08)
5. ¿Las categorías deben ser una colección dinámica o basta el `select` actual? (D-09)
6. ¿Los diseños deben existir como entidad independiente con estado activo o basta la carga de medios por prenda? (D-10)
7. ¿Qué pasa con los pedidos cuando el cliente elimina su cuenta? (D-13)
8. ¿El cliente debe recibir avisos por WhatsApp/correo en este sprint? (D-15)

## 5. Checklist de congelamiento

- [ ] D-02, D-05, D-07, D-08, D-09, D-10, D-13 y D-15 confirmadas o aplicadas por defecto.
- [ ] Modelo `orders`, estados, acceso y tipos congelados en un PR de Jhancarlos.
- [ ] Migración revisada, con RLS y privilegios de Data API revocados.
- [ ] Contratos/tipos compartidos con el equipo.
- [ ] Tabla de “núcleo Jhancarlos” compartida y aceptada.
- [ ] Historias y responsables actualizados en Notion.
- [ ] Ramas y PRs definidos: una rama por HU, PR a `integracion`.
- [ ] Tareas independientes de HU-22/23/25 desbloqueadas con el modelo actual.
- [ ] Datos de prueba y criterios de limpieza acordados.

## 6. Riesgos si no se aclara

- Categorías o diseños como colecciones nuevas pueden sumar migraciones y varias horas al sprint.
- Nombres de estados distintos entre backend y UI generan errores y reprocesos.
- Cambiar el esquema después de que la UI empiece obliga a rehacer tipos y pantallas.
- No definir la eliminación de cuenta deja datos personales huérfanos o pedidos perdidos.
- Permitir editar precios después del pedido rompe la instantánea de HU-25.

## 7. Estado del documento

Propuesta de base para el Sprint 3. No modifica Notion ni reemplaza la aprobación del cliente. Las decisiones marcadas «Cliente/PO» deben confirmarse o aplicarse por defecto antes de repartir las historias.
