# Instalar y ejecutar Valdra Store

Esta guía prepara el entorno local para la aplicación Next.js integrada con Payload.
El scaffold incluye autenticación base, acceso separado para administradores y
clientes, y las colecciones de catálogo del plugin Ecommerce. No implementa las
historias funcionales del Sprint 1.

## Requisitos

- Node.js `24.22.1` (verificado para este repositorio en `.node-version`).
- pnpm `11.25.0`.
- Acceso al proyecto PostgreSQL de Supabase `pfvhzecrervwtsetspqq`.
- Las conexiones de base de datos obtenidas desde **Supabase → Connect**. La URL
  HTTPS del proyecto no es una cadena de conexión PostgreSQL.

Comprueba las herramientas:

```powershell
node --version
pnpm --version
```

## Preparar el proyecto

Desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Genera una clave local para Payload:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Pega el resultado en `PAYLOAD_SECRET` dentro de `.env.local`. Completa también:

- `DATABASE_URL`: cadena del pooler de Supabase para la aplicación.
- `DATABASE_URL_DIRECT`: cadena directa, reservada para crear y ejecutar migraciones.
- `NEXT_PUBLIC_SERVER_URL`: conserva `http://localhost:3000` para desarrollo local.
- `ALLOW_ADMIN_BOOTSTRAP=true`: permite crear el primer administrador únicamente
  en desarrollo local y mientras la colección de administradores esté vacía. El
  código lo bloquea en producción.

No compartas ni subas `.env.local`; está excluido de Git. No uses una clave
`NEXT_PUBLIC_` para secretos.

Mantén `sslmode=require` en ambas cadenas PostgreSQL y no desactives SSL. Para
verificación completa del certificado, descarga el certificado raíz desde **Supabase
Dashboard → Database Settings → SSL Configuration** y configura el cliente Node/Postgres
para confiar en ese archivo. No ignores errores de certificado. Si la contraseña de
Postgres contiene caracteres reservados, codifícala para URL en ambas cadenas.

## Crear y aplicar el esquema Payload

Payload tiene `push: false`: arrancar la aplicación no altera el esquema de Supabase.
Las tablas las administra Payload mediante migraciones.

1. Verifica que `DATABASE_URL_DIRECT` apunte al proyecto `pfvhzecrervwtsetspqq`.
2. Genera una migración desde la configuración actual:

   ```powershell
   pnpm payload:migrate:create
   ```

3. Revisa el archivo SQL/TypeScript generado en `src/migrations/` y confirma que
   contiene únicamente las tablas de Payload y del catálogo que se esperan.
4. Cuando el equipo haya revisado y aprobado ese cambio para el proyecto correcto,
   aplícalo con:

   ```powershell
   pnpm payload:migrate
   ```

Los dos comandos anteriores cargan `.env.local` y usan exclusivamente
`DATABASE_URL_DIRECT`. No se ejecuta ninguna migración automáticamente al iniciar
Next.js. No uses Supabase CLI para migrar el esquema de la aplicación.

## Crear el primer administrador local

Después de aplicar la migración, levanta la aplicación y abre `/admin`. Mientras no
haya administradores, Payload permite la creación inicial solo si se cumple todo lo
siguiente: entorno no productivo, `ALLOW_ADMIN_BOOTSTRAP=true` y colección vacía.
El hook asigna el rol de administrador en el servidor. Al terminar, cambia la variable
a `false` en `.env.local` y reinicia el servidor. La colección de clientes no permite
crear cuentas todavía; el registro se incorporará al implementar la HU correspondiente.

No despliegues un proyecto vacío con una cuenta administradora pendiente de crear.
La configuración de producción siempre bloquea el modo de bootstrap.

## Levantar la aplicación

En una terminal, desde la raíz:

```powershell
pnpm dev
```

Rutas locales:

- `http://localhost:3000`: portada inicial del prototipo.
- `http://localhost:3000/admin`: panel Payload.
- `http://localhost:3000/api`: API REST integrada de Payload.

Para comprobar el formato y tipos:

```powershell
pnpm check
pnpm typecheck
```

Para preparar y ejecutar el build de producción local:

```powershell
pnpm build
pnpm start
```

`pnpm start` requiere haber ejecutado `pnpm build` primero.

## Comandos habituales

| Comando | Uso |
| --- | --- |
| `pnpm install --frozen-lockfile` | Instala exactamente las dependencias del lockfile. |
| `pnpm dev` | Inicia Next.js en modo desarrollo. |
| `pnpm build` | Compila la aplicación para producción. |
| `pnpm start` | Sirve el build de producción local. |
| `pnpm check` | Ejecuta Biome sobre archivos compatibles. |
| `pnpm typecheck` | Comprueba los tipos de TypeScript. |
| `pnpm payload:types` | Genera los tipos de colecciones Payload. |
| `pnpm payload:importmap` | Regenera el import map del panel Payload. |
| `pnpm payload:migrate:create` | Genera una migración usando la conexión directa. |
| `pnpm payload:migrate` | Aplica migraciones Payload usando la conexión directa. |

## Estado de la infraestructura

- El 2026-10-23, el conector confirmó el proyecto `pfvhzecrervwtsetspqq` activo y
  respondió una consulta de solo lectura en PostgreSQL 17.11. Ya existe el bucket
  privado de prueba `valdra-private-spike`, limitado a 10 MB y JPEG/PNG/WebP; S3 aún
  no se ha probado. Las cadenas pooler y directa están completas en `.env` y
  `.env.local`, que están ignorados por Git. La primera prueba del pooler con SSL
  requerido falló porque Node no confía todavía en la cadena del certificado
  (`SELF_SIGNED_CERT_IN_CHAIN`); una prueba previa sin SSL recibió rechazo de
  credenciales (`28P01`). La conexión directa no resolvió el hostname en el entorno
  local (`ENOTFOUND`), aunque coincide con el hostname que reporta Supabase. No ejecutar
  migraciones hasta corregir certificado/credenciales y verificar ambas conexiones.
- No se activó Supabase Storage en Payload. La integración S3 y la carga privada
  firmada siguen sujetas al spike técnico.
- Vercel está definido como hosting gratuito de la demo académica no comercial; no
  contratar planes, complementos ni servicios pagos. No bloquea el inicio del
  desarrollo; sus límites técnicos se revisarán al preparar el despliegue.
- La generación de imágenes con IA permanece abierta y desactivada; el scaffold no
  incluye proveedor, llamadas ni cobros de IA.
