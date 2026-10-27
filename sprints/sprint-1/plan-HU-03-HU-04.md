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

### Pendiente para cerrar el criterio 1

Crear la cuenta en Brevo, verificar el remitente y cargar en `.env.local`:

```text
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_ADDRESS=
```

Sin esas variables el correo solo se escribe en la consola del servidor, así que el
criterio 1 no puede darse por cumplido todavía.

## Decisiones abiertas

1. **Cambiar el correo sin verificarlo.** HU-04 permite editar el correo y Payload cambia
   el identificador de acceso de inmediato. Un error de digitación deja al cliente sin
   forma de recuperar la cuenta, y una sesión robada podría cambiar el correo y luego la
   contraseña. Alternativas: pedir la contraseña actual para cambiar el correo, o activar
   `auth.verify` (hoy desactivado porque HU-01 y HU-02 no lo prevén). Requiere decisión
   del equipo.
2. **Reglas de contraseña.** Se aplica el mínimo de 8 caracteres que ya usa el registro.
   Si el equipo define requisitos de complejidad, se cambian en un solo archivo
   (`src/services/customers/password.ts`).
3. **Datos de prueba en Supabase.** Quedaron tres cuentas de verificación
   (`prueba-a-1793073549998@valdra.test`, `prueba-b-1793073549998@valdra.test`,
   `ui-1793073661780@valdra.test`). Un administrador debe eliminarlas desde el panel.

## Cómo verificarlo

```powershell
pnpm typecheck
pnpm test
pnpm dev
```

Luego: `/registro` → `/cuenta` → editar y guardar → recargar; y
`/recuperar` → revisar la consola del servidor o la bandeja de Brevo → `/restablecer?token=…`.
