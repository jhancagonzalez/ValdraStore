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

- `DATABASE_URL`: cadena Supavisor Session Pooler IPv4 de Supabase para la aplicación.
- `DATABASE_URL_MIGRATIONS`: cadena del mismo Session Pooler, reservada para crear
  y ejecutar migraciones.
- `NEXT_PUBLIC_SERVER_URL`: conserva `http://localhost:3000` para desarrollo local.
- `ALLOW_ADMIN_BOOTSTRAP=true`: permite crear el primer administrador únicamente
  en desarrollo local y mientras la colección de administradores esté vacía. El
  código lo bloquea en producción.

No compartas ni subas `.env.local`; está excluido de Git. No uses una clave
`NEXT_PUBLIC_` para secretos.

## Credenciales S3 para el spike de Storage

El adaptador S3 todavía no está habilitado en Payload. El bucket privado
`valdra-private-spike` existe, pero la prueba real está pendiente. Para continuarla,
genera un par de claves en **Supabase → Storage → S3 Configuration** y completa en
`.env.local` las variables `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY` del ejemplo.
Usa la región `us-east-1`, el endpoint indicado y el bucket de spike. Estas claves
son privilegiadas y omiten RLS: no las envíes por chat, no las publiques y no las
uses en el navegador. El origen local y los métodos CORS de carga deben configurarse
en el panel de Storage antes de probar la carga directa; la API S3 de Supabase no
implementa `PutBucketCors`. La matriz de compatibilidad tampoco declara soporte de
`If-None-Match` para `PutObject`, encabezado que Payload 3.91.0 usa al firmar cargas
directas; su compatibilidad se debe probar antes de adoptar este flujo.

Usa el Session Pooler en modo de sesión, puerto `5432`, para ambas cadenas. Mantén
`sslmode=verify-full` y `sslrootcert` con la ruta local al certificado raíz descargado
desde **Supabase Dashboard → Database Settings → SSL Configuration**. No ignores
errores de certificado. Si la contraseña de Postgres contiene caracteres reservados,
codifícala para URL en ambas cadenas.

## Crear y aplicar el esquema Payload

Payload tiene `push: false`: arrancar la aplicación no altera el esquema de Supabase.
Las tablas las administra Payload mediante migraciones.

1. Verifica que `DATABASE_URL_MIGRATIONS` use el Session Pooler del proyecto
   `pfvhzecrervwtsetspqq` (host de pooler, puerto `5432`, usuario
   `postgres.pfvhzecrervwtsetspqq`).
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
`DATABASE_URL_MIGRATIONS`. No se ejecuta ninguna migración automáticamente al iniciar
Next.js. No uses Supabase CLI para migrar el esquema de la aplicación.

La migración inicial `20261023_165324` ya se aplicó al proyecto correcto el
2026-10-23. Creó 20 tablas técnicas de Payload, cuentas y catálogo; no añadió datos,
direcciones, pedidos ni pagos. Incluyó RLS y la revocación de privilegios de Data API
para `anon`, `authenticated`, `service_role` y `PUBLIC`.

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
| `pnpm payload:migrate:create` | Genera una migración usando el Session Pooler IPv4. |
| `pnpm payload:migrate` | Aplica migraciones Payload usando el Session Pooler IPv4. |

## Estado de la infraestructura

- El 2026-10-23, el conector confirmó el proyecto `pfvhzecrervwtsetspqq` activo y
  respondió una consulta de solo lectura en PostgreSQL 17.11. Las cadenas de
  aplicación y migración usan Session Pooler IPv4 con `sslmode=verify-full`; una
  consulta runtime devolvió `postgres`. Payload aplicó `20261023_165324` y una
  consulta `getPayload` leyó `products` sin errores. La conexión directa publica
  una dirección AAAA IPv6 y la ruta de red local falló; no se activará el complemento
  IPv4 pago.
- Las 20 tablas de Payload tienen RLS y no conceden acceso a `anon`, `authenticated`
  ni `service_role`; los privilegios predeterminados de `postgres` también quedaron
  revocados para nuevos objetos en `public`. La API automática de Supabase no se
  desactivó globalmente; las tablas están protegidas por permisos y RLS. El asesor de
  Supabase muestra avisos informativos de RLS sin políticas, esperado porque las
  tablas solo se acceden mediante Payload.
- El bucket `valdra-private-spike` está privado, limitado a 10 MB y JPEG/PNG/WebP, y
  tiene 0 objetos. No hay claves S3 en `.env.local`; por eso aún no se ha probado
  carga, descarga firmada, CORS ni acceso no autorizado.
- La ruta HTTP de Next ejecutada desde un proceso en segundo plano de esta sesión no
  pudo resolver el pooler (`ENOTFOUND`). La conexión puntual de Payload sí funcionó;
  confirmar `pnpm dev` en el terminal local normal del equipo.
- Vercel está definido como hosting gratuito de la demo académica no comercial; no
  contratar planes, complementos ni servicios pagos. No bloquea el inicio del
  desarrollo; sus límites técnicos se revisarán al preparar el despliegue.
- La generación de imágenes con IA permanece abierta y desactivada; el scaffold no
  incluye proveedor, llamadas ni cobros de IA.
