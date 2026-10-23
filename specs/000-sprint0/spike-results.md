# Resultados parciales del spike de Sprint 0

**Fecha de verificación:** 2026-10-23

**Proyecto:** Supabase `ValdraStore` (`pfvhzecrervwtsetspqq`)

**Estado:** base de datos y seguridad completadas; Storage y escenarios de dominio pendientes.

## T006/T015 — PostgreSQL y migración Payload

- Proyecto activo en PostgreSQL 17.11.
- `DATABASE_URL` y `DATABASE_URL_MIGRATIONS` usan Supavisor Session Pooler IPv4,
  puerto 5432, TLS `verify-full` y CA local. No se guardaron credenciales en Git.
- `SELECT current_database()` devolvió `postgres` por la conexión de aplicación y
  por la conexión de migraciones.
- Se generó y revisó `src/migrations/20261023_165324.ts`. La primera versión incluía
  `addresses` pese a que el plugin las desactiva; se corrigió el wrapper del plugin y
  se regeneró antes de aplicar. La versión final crea 20 tablas técnicas para
  `admins`, `customers`, productos/variantes y estructuras internas de Payload.
- No crea tablas de carritos, pedidos o pagos; tampoco crea `addresses`. No inserta
  datos ni usuarios.
- `pnpm payload:migrate` terminó correctamente y registró la migración como lote 1.
- Una lectura puntual con `getPayload` a `products` respondió con cero documentos.
- Una petición HTTP a Next lanzada en un proceso aislado de esta sesión falló al
  resolver el pooler (`ENOTFOUND`). La conexión puntual de Payload y la migración sí
  funcionaron; falta repetir `pnpm dev` desde un terminal local normal y comprobar la
  ruta HTTP.

## T007 — Data API y RLS

- Las 20 tablas de Payload tienen RLS habilitado.
- La migración revoca los privilegios predeterminados de tablas, secuencias y
  funciones creadas por el rol `postgres` en `public` para `anon`, `authenticated`,
  `service_role` y `PUBLIC`.
- La consulta de verificación confirmó que los roles de Data API no tienen permisos
  de lectura o escritura sobre las tablas Payload. También se revocó EXECUTE público
  de `public.rls_auto_enable()`; el trigger de eventos `ensure_rls` siguió activo y
  habilitó RLS durante la creación.
- El interruptor global de Data API no se cambió. La seguridad de las tablas se basa
  en privilegios revocados y RLS. Payload usa el rol dueño y omite RLS; por eso su
  acceso sigue controlado por Payload.
- El asesor de Supabase reporta 20 avisos informativos `rls_enabled_no_policy`.
  Son esperados: no hay políticas de Data API porque el acceso a esas tablas debe
  pasar por Payload. No crear políticas permisivas para eliminar estos avisos.

## T016 — Storage S3: pendiente de credenciales y prueba

- El bucket `valdra-private-spike` existe, es privado, limita archivos a 10 MB y
  acepta `image/jpeg`, `image/png` y `image/webp`. Tiene 0 objetos.
- No hay variables S3 en `.env.local` y la sesión actual no tiene acceso al panel
  visual de Supabase para generar claves. No se configuró el adaptador ni CORS y no
  se cargó ningún archivo.
- Por tanto, siguen sin probarse carga directa, lectura firmada, expiración, borrado,
  denegación de acceso no autorizado, CORS ni el encabezado `If-None-Match` que envía
  Payload 3.91.0. La vigencia de la URL firmada de carga permanece sin decidir.
- La matriz oficial de compatibilidad de Supabase no declara soporte de
  `If-None-Match` para `PutObject` y no implementa `PutBucketCors`; la prueba deberá
  configurar CORS desde el panel y medir la compatibilidad real del encabezado.
- Para continuar, el responsable debe generar claves S3 en **Supabase → Storage → S3
  Configuration** y escribirlas directamente en `.env.local` bajo
  `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`. No compartirlas por chat ni usar la
  clave `service_role`. Después se configura CORS para `http://localhost:3000`, se
  conecta `@payloadcms/storage-s3` a la colección temporal del spike y se ejecutan
  las pruebas usando un archivo sintético.

## T017–T019 — Casos de dominio pendientes

- No se creó una prenda ni un registro de prueba con tallas/colores.
- No se crearon usuarios de prueba ni se verificó el aislamiento del panel admin.
- No se creó un pedido ni se verificó un estado propio.
- No se necesita limpieza de datos: la migración no insertó datos y el bucket sigue
  vacío.

## Siguiente trabajo

1. Repetir `pnpm dev` desde un terminal normal y comprobar `/api/products`.
2. Configurar claves y CORS S3 localmente; ejecutar el flujo privado de carga y lectura.
3. Completar los escenarios T017–T019 con datos descartables y documentar su limpieza.
4. Actualizar este informe y cerrar T016/T020 solo después de observar resultados.

## Referencias técnicas

- [Protección de la Data API de Supabase](https://supabase.com/docs/guides/api/securing-your-api)
- [Compatibilidad S3 de Supabase Storage](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Autenticación S3 de Supabase Storage](https://supabase.com/docs/guides/storage/s3/authentication)
- [Adaptador S3 de Payload](https://payloadcms.com/docs/upload/storage-adapters)
