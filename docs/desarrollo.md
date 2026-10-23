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

El adaptador `@payloadcms/storage-s3` está configurado para la colección temporal
`private-spike-media`, con carga directa, lectura firmada por 15 minutos y límite
global de 10 MB. El usuario ya agregó las variables S3 a `.env.local`; verifica que
usen la región, endpoint y bucket del spike. Las claves son privilegiadas y omiten
RLS: no las envíes por chat, no las publiques y no las uses en el navegador. La
prueba directa con archivo sintético confirmó PUT con `If-None-Match: *`, GET firmado,
rechazo anónimo y borrado. La preflight OPTIONS desde el origen local también pasó;
no se necesita configurar `PutBucketCors`. El administrador ya subió y previsualizó
una imagen WebP de prueba desde Payload. Falta comprobar expiración efectiva, rechazo
de un cliente sin rol admin, límites de tipo/tamaño y borrado desde Payload. CORS no
sustituye la autorización del servidor ni el bucket privado.

Las imágenes del catálogo usan la colección `media` y el bucket público
`valdra-catalog-media` (creado el 2026-10-23 con límite de 10 MB y JPEG/PNG/WebP).
`S3_CATALOG_BUCKET` y `SUPABASE_URL` deben existir en `.env.local`; `SUPABASE_URL` solo
se usa en servidor para construir la URL pública del objeto. Solo las imágenes de
catálogo son públicas; referencias, propuestas y mockups permanecen privados.

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
a `false` en `.env.local` y reinicia el servidor. Los clientes se registran desde
`/registro` (HU-01); su rol lo asigna el servidor y no acceden al panel.

No despliegues un proyecto vacío con una cuenta administradora pendiente de crear.
La configuración de producción siempre bloquea el modo de bootstrap.

## Levantar la aplicación

En una terminal, desde la raíz:

```powershell
pnpm dev
```

Rutas locales:

- `http://localhost:3000`: portada del prototipo.
- `http://localhost:3000/catalogo`: catálogo público con paginación.
- `http://localhost:3000/catalogo/[id]`: detalle de prenda.
- `http://localhost:3000/registro` y `/login`: registro e inicio de sesión de clientes.
- `http://localhost:3000/cuenta`: vista privada del cliente autenticado.
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
- El bucket `valdra-private-spike` está privado, limitado a 10 MB y JPEG/PNG/WebP.
  La prueba S3 sintética confirmó carga y lectura firmadas, bytes íntegros, rechazo
  anónimo (403), preflight OPTIONS (200) y borrado. El administrador cargó y
  previsualizó una imagen WebP desde Payload. La tabla de la colección de spike tiene
  RLS y ningún rol de Data API puede leerla. Faltan comprobar expiración efectiva,
  rechazo de clientes sin rol admin, límites de archivo y borrado mediante Payload.
- La ruta HTTP de Next ejecutada desde un proceso en segundo plano de esta sesión no
  pudo resolver el pooler (`ENOTFOUND`). La conexión puntual de Payload sí funcionó;
  confirmar `pnpm dev` en el terminal local normal del equipo.
- Vercel está definido como hosting gratuito de la demo académica no comercial; no
  contratar planes, complementos ni servicios pagos. No bloquea el inicio del
  desarrollo; sus límites técnicos se revisarán al preparar el despliegue.
- La generación de imágenes con IA permanece abierta y desactivada; el scaffold no
  incluye proveedor, llamadas ni cobros de IA.
