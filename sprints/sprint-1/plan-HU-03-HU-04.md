# Plan y evidencia — HU-03 y HU-04

**Rama**: `feat/HU-03-HU-04-sprint-1-account`

**Responsable**: Kevin Burgos (Developer Full Stack)

**Sprint**: 1 (20 de octubre al 3 de noviembre de 2026)

**Trazabilidad**: `HU-03`, `HU-04`. El backlog no publica el mapeo a RF/RNF, así que no
se atribuyen requisitos sin confirmar.

## Decisiones aplicadas

| Tema | Decisión | Fuente |
| --- | --- | --- |
| Correo saliente de HU-03 | Brevo por SMTP, adaptador `@payloadcms/email-nodemailer` con variables de servidor | C-15, aprobada por el usuario el 2026-10-26 |
| Campos editables de HU-04 | Nombre, correo y teléfono | Aprobado por el usuario el 2026-10-26 |
| Cambio de correo | Exige la contraseña actual, validada en el servidor | C-16, aprobada por el usuario el 2026-10-26 |
| Canal de correo en desarrollo | Consola de Payload; `SMTP_USE_ETHEREAL=true` para una bandeja temporal | Decisión técnica, sin costo |

Supabase no expone credenciales SMTP reutilizables: su servicio integrado solo entrega a
los correos del equipo del proyecto, con 2 mensajes por hora y únicamente para Supabase
Auth. Por eso el correo de HU-03 sale desde Payload con un proveedor externo.

## HU-04 — Consultar y editar información personal

### Qué se construyó

| Criterio | Implementación | Archivos |
| --- | --- | --- |
| 1. Ve sus datos actuales | La página lee el documento por `findByID` con `overrideAccess: false`, no solo desde la sesión | `app/(frontend)/cuenta/page.tsx`, `src/services/customers/profile.ts` |
| 2. Edita y solo guarda si pasa validación | Server Action con lista blanca de campos y validación en servidor; el navegador nunca envía el `id` | `app/(frontend)/cuenta/actions.ts`, `profile-form.tsx` |
| 3. Solo ve y modifica lo propio | `isAdminOrSelf` devuelve un `Where` por `id` de la sesión; Payload lo combina con el `id` solicitado | `src/access/roles.ts`, `src/collections/Customers.ts` |

`delete` sigue restringido a administradores y `role` sigue bloqueado con `isAdminField`
más el hook `beforeChange`, así que un cliente no puede escalar privilegios.

### Cambio de correo (C-16)

El correo es el identificador de acceso, así que cambiarlo pide la contraseña actual:

- La Server Action la recibe, la verifica con la operación de login de Payload (que además
  aplica el mismo límite de intentos que el formulario de acceso) y descarta el token
  resultante.
- El hook `beforeChange` de `customers` rechaza cualquier cambio de correo que no traiga
  la marca `emailChangeVerified` en `req.context`. Esa marca solo puede ponerla el código
  de servidor: una llamada REST directa con la cookie del cliente recibe `400`.
- Cambiar nombre o teléfono no pide contraseña, y un administrador sigue editando
  cualquier dato desde el panel.

### Migración

`src/migrations/20261026_224713_customer_phone.ts`:

```sql
ALTER TABLE "customers" ADD COLUMN "phone" varchar;
```

Aplicada el 2026-10-26. Verificado después: la columna existe como `varchar` nullable,
RLS sigue activo en `customers` y `anon`, `authenticated` y `service_role` conservan sus
privilegios revocados. Reversible con `DROP COLUMN "phone"`.

### Evidencia

`pnpm typecheck` sin errores. 17 pruebas unitarias en verde
(`src/access/roles.test.ts`, `src/services/customers/profile.test.ts`,
`src/services/customers/password.test.ts`).

Comprobación contra la API real (12/12):

- Un cliente lee su propio perfil y su propio documento.
- Un cliente recibe 404 al pedir el documento de otro y 403 al intentar modificarlo.
- Un visitante anónimo recibe 403.
- El servidor rechaza un rol `admin` enviado por el cliente.
- El servidor rechaza tomar el correo de otra cuenta y un teléfono con formato inválido.

Comprobación en navegador: registro, `/cuenta` con los datos actuales, edición de nombre y
teléfono, mensaje «Guardamos tus datos.» y persistencia tras recargar.

Cambio de correo: sin contraseña el servidor responde `400` y el correo no cambia; con
contraseña incorrecta el formulario muestra el error y el correo tampoco cambia; con la
contraseña correcta el cambio se guarda y el acceso pasa a usar el correo nuevo.

## HU-03 — Recuperar contraseña

### Qué se construyó

| Criterio | Implementación | Archivos |
| --- | --- | --- |
| 1. Solicita con su correo y recibe el enlace | `/recuperar` responde siempre igual; el correo incluye un enlace a `/restablecer` | `app/(frontend)/recuperar/`, `src/services/email/` |
| 2. Vigencia limitada y un solo uso | `forgotPassword.expiration` de una hora; Payload invalida el token al usarlo | `src/collections/Customers.ts` |
| 3. Nueva contraseña válida y login inmediato | Reglas en servidor (mínimo 8, máximo 100, confirmación) y enlace directo a `/login` | `app/(frontend)/restablecer/`, `src/services/customers/password.ts` |

Detalles relevantes:

- Payload arma por defecto el enlace hacia `/admin/reset/<token>`, que es una ruta del
  panel de administradores. Se reemplazó con `generateEmailHTML` para apuntar a
  `/restablecer?token=…`, la pantalla del cliente.
- La URL base del enlace se toma del origen de la petición y, si no existe, de
  `NEXT_PUBLIC_SERVER_URL`. Así la demo en Vercel no genera enlaces a `localhost`.
- La respuesta de `/recuperar` no revela si el correo está registrado.

### Evidencia

Con el adaptador en modo consola (sin credenciales todavía):

- Solicitud desde `/recuperar`: mensaje genérico, sin filtrar la existencia de la cuenta.
- Contraseñas que no coinciden: rechazadas por el servidor con mensaje en español.
- Enlace usado una vez: actualiza la contraseña y cierra las sesiones activas.
- Reutilizar el mismo enlace: rechazado con «El enlace es inválido, ya expiró o ya fue utilizado».
- Inicio de sesión con la contraseña anterior: rechazado. Con la nueva: correcto y redirige a `/cuenta`.

Con Brevo ya habilitado (2026-10-27, envío real):

- La verificación del transporte SMTP pasa en los cuatro puertos de Brevo
  (587, 2525, 465) sin `525` ni errores de certificado.
- `POST /api/customers/forgot-password` responde `200` y la operación espera la
  confirmación SMTP sin lanzar excepción: Brevo aceptó el mensaje para entrega.
- El token guardado en `customers.reset_password_token` es el mismo que viaja en el
  enlace `/restablecer?token=…` del correo.
- Con ese token: la pantalla `/restablecer` acepta la nueva contraseña, el formulario
  desaparece y muestra el enlace a `/login`.
- El mismo enlace, reutilizado: «El enlace es inválido, ya expiró o ya fue utilizado».
- `reset_password_expiration` queda en el pasado tras el cambio, así que el token
  no vuelve a servir.
- Inicio de sesión: con la contraseña nueva responde `200` y en el navegador entra a
  `/cuenta`; con la anterior responde `401`.

La recepción en la bandeja de destino la confirma el destinatario: el agente no tiene
acceso a esa cuenta de correo. El envío, en cambio, está aceptado por Brevo sin error.

## Bloqueos de Brevo resueltos

Al conectar el adaptador aparecieron dos bloqueos, ambos del lado de Brevo:

1. **Certificado TLS.** `smtp-relay.brevo.com` resuelve al relay regional
   `1.179.117.2`. En ese momento el certificado solo cubría
   `smtp-relay.sendinblue.com` y `smtp-relay-offshore-southamerica-east-v2.sendinblue.com`,
   y Nodemailer rechazaba la conexión con `ERR_TLS_CERT_ALTNAME_INVALID`. No se
   desactivó la validación TLS: se usó el nombre heredado
   `smtp-relay.sendinblue.com`, que apunta al mismo relay. Después Brevo actualizó el
   certificado para incluir `smtp-relay.brevo.com` y se volvió al nombre documentado.
2. **IP no autorizada.** La autenticación respondía `525 5.7.1 Unauthorized IP address`
   (`code: EAUTH`) porque la cuenta tenía activo el bloqueo de IP desconocidas para
   claves SMTP. Jhan desactivó ese bloqueo el 2026-10-27 y el error desapareció.

Configuración final en `.env.local` (solo variables de servidor):

```text
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_ADDRESS=
```

El bloqueo por IP habría roto también la demo en Vercel, cuyas IP de salida son
dinámicas; por eso se dejó desactivado en lugar de autorizar una sola IP.

## Decisiones abiertas

1. **Reglas de contraseña.** Se aplica el mínimo de 8 caracteres que ya usa el registro.
   Si el equipo define requisitos de complejidad, se cambian en un solo archivo
   (`src/services/customers/password.ts`).
2. **Datos de prueba en Supabase.** Las tres cuentas de verificación
   (`prueba-a-…`, `prueba-b-…`, `ui-…@valdra.test`) fueron eliminadas. Quedan tres
   cuentas `@valdra.test` (`ana.gomez@`, `carlos.ruiz@`, `laura.perez@`) creadas por
   otra persona del equipo: no se tocan.
3. **Cuenta de prueba con correo real.** Para cerrar el criterio 1 se creó
   `kevinburgos808@gmail.com` (id 9, rol `customer`, «Kevin Burgos (prueba HU-03)»).
   Un administrador debe eliminarla desde el panel cuando Kevin confirme la recepción
   del correo.

## Cómo verificarlo

```powershell
pnpm typecheck
pnpm test
pnpm dev
```

Luego: `/registro` → `/cuenta` → editar y guardar → recargar; y
`/recuperar` → revisar la bandeja del destinatario → `/restablecer?token=…` → `/login`.

