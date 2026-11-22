# Plan de trabajo — Sprint 3

## 1. Lectura del sprint

El Sprint 3 va del **18 de noviembre al 1 de diciembre de 2026**. El alcance registrado en Notion es **HU-18 a HU-25: 28 puntos**, con **5 Must Have, 2 Should Have y 1 Could Have**. La página del sprint resume el objetivo así:

> Que el cliente haga pedidos y consulte su estado, y que el administrador gestione catálogo, clientes y pedidos.

El flujo completo que se busca es:

**diseño aprobado → pedido → confirmación → historial/estado del cliente → cambio de estado por el administrador → estado actualizado**

No incluye pagos, checkout, carrito, envíos ni WhatsApp. Las historias de pedidos usan el diseño aprobado en HU-17.

Las decisiones de alcance y la base protegida están en [DECISIONS.md](DECISIONS.md). Este plan asume las recomendaciones D-02, D-05, D-07, D-08, D-09, D-10, D-13 y D-15; si el cliente las cambia, se replanifica antes de delegar.

## 2. Base técnica concreta

### 2.1 Colección `orders` (propuesta)

Los pedidos del plugin están desactivados y el flujo no tiene pagos ni carrito. Se propone una colección propia, más simple y alineada con las historias:

- `customer` — relación con `customers`, obligatoria, indexada.
- `items` — arreglo con al menos una fila:
  - `product` — relación con `products`, obligatoria.
  - `variant` — relación con `variants`, obligatoria.
  - `garmentLabel`, `size`, `colorLabel` — instantánea de la prenda al crear el pedido.
  - `unitPrice` — precio de la variante en COP al crear el pedido.
  - `quantity` — entero, por ahora **1** (D-02).
  - `approvedDesign` — relación con `approved-designs`, obligatoria.
- `status` — `pendiente` por defecto; valores en D-05.
- `total` — suma calculada en servidor, COP.
- `statusHistory` — arreglo de cambios: `from`, `to`, `changedAt`, `changedBy` (relación con `admins`) y `note` opcional.
- `createdAt` — automático de Payload.

El precio, el estado inicial, el cliente y el total se fijan en el servidor. El cliente no puede enviar ni cambiar esos valores.

### 2.2 Estados y transiciones (D-05)

Propuesta para confirmar con el cliente:

| Estado | Significado | Transiciones permitidas |
| --- | --- | --- |
| `pendiente` | Pedido recibido, aún sin producir | `en_produccion`, `cancelada` |
| `en_produccion` | En producción | `lista`, `cancelada` |
| `lista` | Lista para entrega | `entregada` |
| `entregada` | Entregada al cliente | — |
| `cancelada` | Cancelada | — |

Solo un administrador cambia el estado. Cada cambio deja una fila en `statusHistory` con fecha y usuario (D-06).

### 2.3 Acceso y seguridad

- **Crear:** solo un cliente con sesión. El hook fija `customer`, `status = pendiente` y `total`; ignora cualquier precio o estado enviado por el cliente.
- **Leer:** el cliente solo ve sus pedidos; el administrador ve todos. Se aplica control de acceso de Payload y, cuando corresponda, RLS en PostgreSQL.
- **Actualizar:** solo administradores. El cliente no puede cambiar estado, precio, prenda ni diseño.
- **Eliminar:** solo administradores.
- **Validaciones de servidor:** el diseño debe existir, pertenecer al cliente y estar aprobado; la variante debe pertenecer al producto; el precio se toma de la base, no del navegador.
- **Migración:** se revisa antes de aplicarla, conserva privilegios de Data API revocados y RLS activo.
- **Auditoría:** `statusHistory` cubre HU-21; no se confía en el historial del cliente.

### 2.4 Panel administrativo (D-11)

Se propone usar el panel de Payload, no un panel paralelo:

- **Pedidos:** grupo «Pedidos», columnas cliente, estado, total y fecha; filtro por estado; detalle con ítems e historial.
- **Clientes:** la colección `customers` ya existe; se revisan columnas y detalle.
- **Prendas y diseños:** las colecciones existentes de catálogo y medios.

### 2.5 Categorías y diseños disponibles (D-09 y D-10)

La recomendación para no ampliar el alcance es mantener el modelo actual:

- `products.category` sigue siendo un `select`; HU-22 cubre crear/editar/deshabilitar productos y elegir una categoría existente.
- `products.designs` sigue siendo una carga de `media` por prenda; HU-23 cubre subir, reemplazar, asociar y quitar medios; «deshabilitar» significa quitar la asociación o dejar la prenda en borrador.
- Si el cliente exige categorías dinámicas o diseños con estado `active`, se crea una colección nueva con su migración y se replanifica el sprint. Ningún integrante lo implementa por iniciativa propia.

### 2.6 Núcleo Jhancarlos

No se delega: `Orders.ts`, servicios en `src/services/orders/*`, tipos y estados en `src/lib/orders/*`, migraciones de pedidos, acceso/RLS, registro en `payload.config.ts` y `src/collections/index.ts`, `payload-types.ts` e import map. El equipo importa los contratos y no edita esos archivos sin revisión. El detalle está en [DECISIONS.md](DECISIONS.md).

## 3. Tareas técnicas

| ID | Tarea | HU | Responsable propuesto | Depende de |
| --- | --- | --- | --- | --- |
| S3-T00 | Cerrar D-02 a D-15 y congelar el alcance | Transversal | Jhancarlos + Emanuel | — |
| S3-T01 | Modelo `orders`, estados, acceso, RLS y migración | HU-18/21/24 | Jhancarlos | S3-T00, D-05 |
| S3-T02 | Servicio de creación, validaciones e instantáneas de precio | HU-18 | Jhancarlos | S3-T01 |
| S3-T03 | UI de creación y confirmación del pedido | HU-18 | Jhancarlos + Kevin | S3-T02 |
| S3-T04 | Historial y estado del pedido para el cliente | HU-19/20 | Kevin + Andrés | S3-T03 |
| S3-T05 | Cambio de estado con historial y auditoría | HU-21 | Daniel | S3-T01, D-05 |
| S3-T06 | Lista/detalle/filtro de clientes y pedidos en el admin | HU-24 | Daniel + Emanuel | S3-T01, S3-T05 |
| S3-T07 | Administración de productos y categorías | HU-22 | Emanuel | D-09 |
| S3-T08 | Administración de diseños disponibles | HU-23 | Andrés | D-10 |
| S3-T09 | Edición de precio/información y prueba de instantánea | HU-25 | Emanuel | S3-T01, D-07 |
| S3-T10 | Integración, E2E, seguridad/RLS, responsive, evidencias y Notion | Transversal | Jhancarlos + Andrés | Todas |

## 4. Fases y calendario propuesto

| Fecha | Foco | Entregable |
| --- | --- | --- |
| 21–22 nov | Decisiones y base | D-02 a D-15, modelo `orders`, borrador de migración, inventario de admin |
| 23–25 nov | Pedido inicial y catálogo | S3-T01/T02/T03 (HU-18); S3-T07/T08/T09 en paralelo |
| 25–28 nov | Estado e historial | S3-T04 (HU-19/20), S3-T05 (HU-21), cierre de HU-22/23/25 |
| 28 nov–1 dic | Administración y QA | S3-T06 (HU-24), E2E, seguridad/RLS, responsive, evidencias, demo y Notion |

El calendario es una propuesta: el sprint ya está en curso y el equipo debe ajustar según la capacidad real.

## 5. Qué va primero

**Jhancarlos, en este orden:**

1. Cerrar las decisiones D-02 a D-15 con el PO/cliente.
2. Congelar `orders`, estados, acceso y migración (S3-T01).
3. Implementar la creación del pedido y su UI (S3-T02/T03, HU-18).
4. Integrar, probar el recorrido completo y mantener la documentación.

HU-18 es la ruta crítica: sin ella no se pueden probar HU-19, HU-20, HU-21 ni HU-24.

## 6. Qué no depende de nadie

- **HU-22** (productos/categorías) y **HU-23** (diseños): se pueden inventariar y avanzar con el modelo actual mientras se confirman D-09/D-10.
- **HU-25** (precio e información): la edición del producto es independiente; la prueba de la instantánea llega con `orders`.
- Textos, estados vacíos y revisión responsive de historial/estado.
- Checklist de acceso, RLS y auditoría para pedidos.
- Documentación, trazabilidad y preparación de la demo.

## 7. Riesgos y bloqueos

- **D-09/D-10:** si se eligen colecciones nuevas, HU-22/HU-23 crecen y requieren migración; si se mantiene el modelo actual, el alcance es menor pero limitado.
- **D-05:** sin estados y transiciones definidos, HU-21 no puede cerrarse.
- **Ruta crítica:** el modelo de pedidos bloquea cuatro historias. Debe salir primero.
- **Capacidad:** 28 puntos en dos semanas con 5 personas; el trabajo independiente de catálogo debe empezar ya.
- **Pagos:** no se habilitan; el pedido es una solicitud de producción, no una compra pagada.
- **Tiempo real:** el estado se actualiza al consultar; no se promete notificación en vivo.
- **Privacidad:** los pedidos contienen datos personales; se aplican acceso por propietario, RLS y revisión de la migración.

## 8. Definition of Done

Una historia se cierra cuando:

- [ ] Los tres criterios de aceptación están verificados.
- [ ] Hay pruebas unitarias o de integración cuando aplique.
- [ ] Se probó en navegador en escritorio y móvil.
- [ ] El control de acceso por propietario y la validación en servidor están cubiertos.
- [ ] La migración fue revisada y aplicada, si cambia el esquema.
- [ ] Hay evidencia en `sprints/sprint-3/` y el estado está actualizado en Notion.

No se marca una historia como terminada por tener la pantalla o el endpoint creados.
