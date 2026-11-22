# Plan de trabajo — Sprint 3

## 1. Lectura del sprint

El Sprint 3 va del **18 de noviembre al 1 de diciembre de 2026**. El alcance registrado en Notion es **HU-18 a HU-25: 28 puntos**, con **5 Must Have, 2 Should Have y 1 Could Have**. La página del sprint resume el objetivo así:

> Que el cliente haga pedidos y consulte su estado, y que el administrador gestione catálogo, clientes y pedidos.

El flujo completo que se busca es:

**diseño aprobado → pedido → confirmación → historial/estado del cliente → cambio de estado por el administrador → estado actualizado**

No incluye pagos, checkout, carrito, envíos ni WhatsApp. Las historias de pedidos usan el diseño aprobado en HU-17.

Las decisiones confirmadas y la base protegida están en [DECISIONS.md](DECISIONS.md). La base de pedidos e inventario está implementada, las migraciones aplicadas y el stock sembrado; HU-18, HU-19 y HU-20 están validadas, los pedidos se consultan en `/pedidos` y la cuenta con pedidos en curso queda protegida (D-21). Faltan HU-22/HU-23 y HU-24.

## 2. Base técnica concreta

### 2.1 Colección `orders` (implementada)

La base está en `branch/SPRINT-3-orders-core` (commits `62d0365` a `5acab13`). Los pedidos del plugin siguen desactivados.

- `customer` — relación con `customers`, obligatoria, indexada.
- `design` — relación con `approved-designs`, obligatoria; debe pertenecer al cliente.
- `orderNumber` — número aleatorio de seis cifras, único, generado en servidor (D-14).
- `quantity` — entero de 1 a 10; descuenta stock.
- `garmentBase`, `garmentLabel`, `category`, `colorLabel`, `size` — instantánea de la prenda del diseño.
- `unitPrice` — precio fijo por prenda base: camiseta $60.000 / hoodie $120.000 (D-07, D-20).
- `total` — `unitPrice × quantity`, calculado en servidor.
- `status` — `pendiente` por defecto; estados en D-05.
- `source` — `customer` o `admin`; `createdBy` — administrador que lo creó.
- `statusHistory` — cambios con fecha, administrador y estados anterior/nuevo.
- `stockRestored` — control interno para no devolver stock dos veces.
- `createdAt` — automático de Payload.

El cliente, el diseño, las instantáneas, el precio y el estado inicial se fijan en servidor. El cliente no puede enviar ni cambiar esos valores. El stock se valida contra `garment-stock` por `garmentBase|size`.

### 2.2 Estados y transiciones (D-05)

Confirmados con el cliente (D-05):

| Estado | Significado | Transiciones permitidas |
| --- | --- | --- |
| `pendiente` | Pedido recibido, aún sin producir | `en_produccion`, `cancelada` |
| `en_produccion` | En producción | `lista`, `cancelada` |
| `lista` | Lista para entrega | `entregada` |
| `entregada` | Entregada al cliente | — |
| `cancelada` | Cancelada | — |

Solo un administrador cambia el estado. Cada cambio deja una fila en `statusHistory` con fecha y usuario (D-06).

### 2.3 Acceso y seguridad

- **Crear:** cliente con sesión o administrador. El hook fija el cliente cuando es cliente, valida el cliente elegido cuando es admin, y fija diseño, instantáneas, precio, total, estado inicial, número y stock. El cliente usa `/api/orders/create`; el panel usa el REST de Payload en `/api/orders`.
- **Leer:** el cliente solo ve sus pedidos; el administrador ve todos. Se aplica control de acceso de Payload y, cuando corresponda, RLS en PostgreSQL.
- **Pedidos del cliente:** `/pedidos` muestra la lista con número, prenda/talla, fecha, estado y total, y permite consultar por número. La página exige sesión y filtra por propietario; el detalle no expone el historial de cambios.
- **Cuenta con pedidos en curso:** el cliente no puede eliminar su cuenta si tiene pedidos `pendiente`, `en_produccion` o `lista`. Puede cancelar los dos primeros desde `/pedidos`; si el pedido está `lista`, se le muestra `valdra.administracion@gmail.com`. El servidor bloquea la eliminación y un administrador puede resolver el caso manual.
- **Actualizar:** solo administradores. El cliente no puede cambiar estado, precio, prenda ni diseño.
- **Eliminar:** solo administradores; el stock se devuelve si el pedido no estaba cancelado.
- **Validaciones de servidor:** el diseño debe existir, pertenecer al cliente y estar aprobado; la prenda debe tener precio fijo; la cantidad debe ser 1–10; el stock debe alcanzar. El precio se toma de la tabla del servidor, no del navegador.
- **Migración:** aplicadas el 21 de noviembre de 2026 (`orders_core` y `order_number`), con privilegios de Data API revocados y RLS activo.
- **Auditoría:** `statusHistory` cubre HU-21; el historial está oculto para el cliente.

### 2.4 Panel administrativo (D-11)

Se propone usar el panel de Payload, no un panel paralelo:

- **Pedidos:** grupo «Pedidos», columnas número, cliente, estado, cantidad, total y fecha; filtro por estado; detalle con ítems e historial.
- **Inventario:** colección `garment-stock` por prenda base y talla; el administrador ajusta cantidades.
- **Clientes:** la colección `customers` ya existe; se revisan columnas y detalle.
- **Prendas y diseños:** las colecciones existentes de catálogo y medios; HU-22/HU-23 agregan categorías y diseños.

### 2.5 Categorías y diseños disponibles (D-09 y D-10)

Las dos se implementan como colecciones nuevas, con migración y cambio de catálogo:

- **`categories`:** nombre y activo; `products.category` pasa de `select` a relación. HU-22 incluye CRUD, deshabilitado, validaciones y revalidación del catálogo.
- **`designs`:** imagen, relación a prendas y `active`; `products.designs` pasa de carga de medios a relación. HU-23 incluye CRUD, asociación, deshabilitado y lectura pública solo de activos.
- Ambas pertenecen a HU-22/HU-23. Sus responsables coordinan con Jhancarlos el cambio en `src/plugins/ecommerce.ts`, la migración y la lectura del catálogo. **No forman parte del núcleo de pedidos.**

### 2.6 Núcleo Jhancarlos

No se delega: `Orders.ts`, `GarmentStock.ts`, servicios en `src/services/orders/*`, tipos/estados/precios/stock/número en `src/lib/orders/*`, migraciones de pedidos e inventario, acceso/RLS, registro en `payload.config.ts` y `src/collections/index.ts`, `payload-types.ts`, hook de borrado de `Customers`, semilla de stock, `app/(frontend)/pedidos/page.tsx`, navegación de pedidos, `src/lib/contact.ts`, `package.json` e import map. El equipo importa los contratos y no edita esos archivos sin revisión. El detalle está en [DECISIONS.md](DECISIONS.md).

## 3. Tareas técnicas

| ID | Tarea | HU | Responsable propuesto | Depende de |
| --- | --- | --- | --- | --- |
| S3-T00 | Decisiones confirmadas y alcance congelado | Transversal | Jhancarlos + Emanuel | Hecho |
| S3-T01 | Modelo `orders`, inventario, estados, acceso, RLS y migración | HU-18/21/24 | Jhancarlos | Implementado y migrado |
| S3-T02 | Servicio de creación, stock, validaciones e instantáneas de precio | HU-18 | Jhancarlos | Implementado |
| S3-T03 | UI de creación, confirmación y consulta por número del pedido | HU-18/20 | Jhancarlos + Kevin | Implementado y validado |
| S3-T04 | Lista, detalle y estado del pedido para el cliente (`/pedidos`) | HU-19/20 | Kevin + Andrés | Implementado y validado; revisión de UI |
| S3-T05 | Cambio de estado con historial y auditoría | HU-21 | Daniel | S3-T01, D-05 |
| S3-T06 | Lista/detalle/filtro de clientes y pedidos en el admin | HU-24 | Daniel + Emanuel | S3-T01, S3-T05 |
| S3-T07 | Colección `categories`, relación con productos, migración y admin | HU-22 | Emanuel | D-09; revisión de Jhancarlos |
| S3-T08 | Colección `designs`, relación con prendas, migración y admin | HU-23 | Andrés | D-10; revisión de Jhancarlos |
| S3-T09 | Edición de precio/información y prueba de instantánea fija | HU-25 | Emanuel | S3-T01, D-07 |
| S3-T10 | Integración, E2E, seguridad/RLS, responsive, evidencias y Notion | Transversal | Jhancarlos + Andrés | Todas |
| S3-T11 | Semilla de inventario y pruebas de stock | HU-18/19 | Jhancarlos | Hecho: 40 filas |
| S3-T12 | Bloqueo de eliminación de cuenta con pedidos en curso y cancelación del cliente | HU-04/19/20 | Jhancarlos | Implementado y validado |

## 4. Fases y calendario propuesto

| Fecha | Foco | Entregable |
| --- | --- | --- |
| 21-22 nov | Decisiones y base | Decisiones confirmadas, `orders`/`garment-stock` implementados, migraciones aplicadas y stock sembrado |
| 23–25 nov | Pedido inicial y catálogo | HU-18, HU-19 y HU-20 validadas; S3-T07/T08/T09 en paralelo |
| 25–28 nov | Estado e historial | Revisión de S3-T04, S3-T05 (HU-21), cierre de HU-22/23/25 |
| 28 nov–1 dic | Administración y QA | S3-T06 (HU-24), E2E, seguridad/RLS, responsive, evidencias, demo y Notion |

El calendario es una propuesta: el sprint ya está en curso y el equipo debe ajustar según la capacidad real.

## 5. Qué va primero

**Jhancarlos, en este orden:**

1. Revisar los cambios de esquema de HU-22/HU-23 antes de que se mezclen.
2. Apoyar HU-24 y revisar la UI de `/pedidos` con Kevin y Andrés.
3. Integrar, probar el recorrido completo y mantener la documentación.
4. Preparar la evidencia y la demo.

HU-18, HU-19 y HU-20 están validadas y habilitan HU-21 y HU-24.

## 6. Qué no depende de nadie

- **HU-22** (categorías) y **HU-23** (diseños): deben crear sus colecciones y migraciones; Emanuel y Andrés pueden empezar ya con el relevamiento y el esquema, coordinando con Jhancarlos.
- **HU-25** (precio e información): la edición del producto es independiente; los pedidos usan la tabla fija de precios por prenda base.
- Textos, estados vacíos y revisión responsive de historial/estado.
- Checklist de acceso, RLS y auditoría para pedidos.
- Documentación, trazabilidad y preparación de la demo.

## 7. Riesgos y bloqueos

- **D-09/D-10:** las colecciones `categories` y `designs` amplían el alcance con dos migraciones y cambios en el catálogo; deben coordinarse con Jhancarlos.
- **D-05:** la máquina de estados ya está implementada; cualquier cambio de nombres/transiciones afecta la UI y los datos.
- **Stock:** la comprobación y el descuento no son atómicos; dos pedidos simultáneos podrían competir por la última unidad. Está marcado con `ponytail:` y se corrige con transacción/row lock cuando haga falta.
- **Formulario de admin:** validado con una sesión real; los campos calculados no se marcan `required` en el panel porque el hook los completa antes de validar.
- **Número de pedido:** la generación comprueba duplicados y el índice único es la garantía final; dos creaciones simultáneas podrían requerir reintento.
- **Consulta por número:** la página `/pedidos` requiere sesión y solo muestra pedidos de la cuenta; no es una consulta pública ni muestra el historial de cambios.
- **Cuenta con pedidos en curso:** la eliminación se bloquea; el cliente puede cancelar `pendiente`/`en_produccion` o escribir a `valdra.administracion@gmail.com`. Los administradores pueden resolver el caso manual.
- **Stock al borrar:** no se devuelve para pedidos entregados; solo para pedidos no entregados y no devueltos por una cancelación.
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
