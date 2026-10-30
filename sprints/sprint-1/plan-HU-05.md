# Plan y evidencia — HU-05

**Rama**: `feat/HU-05-sprint-1-user-roles`

**Responsable**: Daniel Cárdenas (Developer Backend)

**Sprint**: 1 (20 de octubre al 3 de noviembre de 2026)

**Trazabilidad**: `HU-05`. La tarea T018 de `specs/000-sprint0/tasks.md` relaciona HU-05
con RF-5 y RNF-2; el backlog de Notion no publica ese mapeo, así que los commits solo
citan `HU-05`.

## Historia

Como administrador, quiero gestionar los roles de los usuarios para controlar el acceso
a las funciones administrativas.

## Decisión de diseño

El scaffold aprobado separa las cuentas en dos colecciones de autenticación: `admins`
(rol administrador, única colección que entra al panel) y `customers` (rol cliente). Se
conserva esa separación (README, T018) y el rol de una cuenta **es la colección que la
contiene**.

Cambiar el rol mueve la cuenta a la otra colección:

1. Se lee la cuenta original desde el adaptador de base de datos para obtener `hash` y
   `salt`.
2. Se crea la cuenta en la colección destino con el mismo correo. Los hooks de cada
   colección siguen asignando el rol en el servidor.
3. Se copian `hash` y `salt`: el usuario conserva su contraseña.
4. Se borra la cuenta original. Al no existir, Payload invalida su JWT y sus sesiones en
   la siguiente petición; el nuevo rol se aplica en su siguiente inicio de sesión.

Todo ocurre en una sola transacción: si un paso falla, la cuenta queda como estaba.

Alternativa descartada: unificar `admins` y `customers` en una colección `users` con un
campo `role`. Exigía una migración sobre la base compartida y reescribir el registro,
el inicio de sesión y el perfil de HU-01, HU-02 y HU-04, que ya están integrados o en
curso.

**Requiere revisión del equipo antes de habilitar pedidos**: el cambio de rol borra el
documento original y crea uno nuevo con otro `id`. Hoy ninguna colección referencia a
`customers` (carritos, direcciones y pedidos del plugin están desactivados). Cuando se
habiliten pedidos u otras relaciones con el cliente, hay que bloquear el cambio de un
cliente con registros relacionados o migrarlos.

## Qué se construyó

| Criterio | Implementación | Archivos |
| --- | --- | --- |
| 1. Roles cliente y administrador; cliente por defecto al registrarse | Los roles son las colecciones `customers` y `admins`. El registro público solo crea en `customers` y su hook fija `role: "customer"` (HU-01, sin cambios). `hasAdminRole` exige además que la sesión venga de `admins` | `src/access/roles.ts` |
| 2. Un cliente es rechazado en funciones administrativas | El panel solo admite `admins` (`admin.user`) y `canAccessAdminPanel` niega a un cliente. Las colecciones y el endpoint nuevo responden `403` a un cliente. Un `role: "admin"` guardado en una cuenta de cliente no da privilegios | `src/access/roles.ts`, `src/services/roles/change-role-endpoint.ts` |
| 3. El administrador cambia el rol y se aplica en el siguiente inicio de sesión | Control «Rol de la cuenta» en la barra lateral del detalle de administradores y clientes. Llama a `POST /api/{admins\|customers}/:id/change-role`, que mueve la cuenta conservando correo y contraseña y cierra sus sesiones | `src/services/roles/change-role.ts`, `src/plugins/role-management.ts`, `src/components/admin/role-change/` |

### Reglas del cambio de rol

- Solo un administrador puede llamarlo: sin sesión `401`; un cliente `403`.
- Un administrador no puede cambiar su propio rol (`409`).
- Siempre queda al menos un administrador (`409`).
- Si el correo ya existe en el rol destino no se duplica la cuenta (`409`).
- Al pasar un administrador a cliente, el nombre se toma de la parte local del correo; el
  cliente puede editarlo desde su perfil (HU-04).

### Integración

`withRoleManagement` agrega el endpoint y el campo de interfaz (`type: "ui"`, sin columna
en la base) a `admins` y `customers` desde `src/collections/index.ts`, sin modificar
`Admins.ts` ni `Customers.ts`. No hay migración.

## Pruebas automatizadas

`pnpm test` (Vitest):

| Archivo | Cubre |
| --- | --- |
| `src/access/admin-access.test.ts` | Criterios 1 y 2: reconocimiento de roles y rechazo del cliente en acceso y panel |
| `src/services/roles/change-role.test.ts` | Criterio 3: promoción, degradación, conservación de contraseña, borrado de la cuenta original y reglas de bloqueo |
| `src/services/roles/change-role-endpoint.test.ts` | Endpoint: `401`, `403`, `400`, transacción confirmada en éxito y revertida en error |
| `src/plugins/role-management.test.ts` | El endpoint y el control se agregan solo a `admins` y `customers` |

## Prueba manual

Usar cuentas de prueba desechables (la base de Supabase es compartida).

1. **Criterio 1**: registrar `prueba-hu05@valdra.test` en `/registro`. En el panel aparece
   en **Clientes** con rol Cliente y no en **Administradores**.
2. **Criterio 2**: con la sesión de ese cliente, abrir `/admin` y
   `/api/admins`: ambos se rechazan.
3. **Criterio 3**: como administrador, abrir el cliente y pulsar **Cambiar a
   Administrador**. El panel abre la cuenta en **Administradores**. En la otra ventana, el
   cliente pierde la sesión al recargar. Iniciar sesión en `/admin` con el mismo correo y
   contraseña: entra como administrador.
4. Desde otro administrador, devolverlo a **Cliente**: ya no entra a `/admin` y sí a
   `/login` con la misma contraseña.
5. Abrir la propia cuenta de administrador: el control indica que no se puede cambiar el
   propio rol.
6. Borrar la cuenta de prueba al terminar.

## Evidencia

| Fecha | Comprobación | Resultado |
| --- | --- | --- |
| 2026-10-29 | `pnpm test`, `pnpm check`, `pnpm typecheck` | Pendiente de registrar |
| 2026-10-29 | Prueba manual, pasos 1 a 6 | Pendiente de registrar |
