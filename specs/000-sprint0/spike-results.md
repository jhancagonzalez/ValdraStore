# Resultados parciales del spike de Sprint 0

**Fecha de verificación:** 2026-10-23

**Proyecto:** Supabase `ValdraStore` (`pfvhzecrervwtsetspqq`)

**Estado:** base de datos y seguridad completadas; carga y previsualización privada de Payload comprobadas; expiración, validaciones negativas y escenarios de dominio pendientes.

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

## T016 — Storage S3: flujo feliz comprobado; validaciones restantes pendientes

- El bucket `valdra-private-spike` es privado, limita archivos a 10 MB y acepta
  `image/jpeg`, `image/png` y `image/webp`. La prueba sintética directa fue borrada;
  después el administrador subió una imagen WebP de 29 096 bytes (1080×1080) desde
  Payload y pudo previsualizarla.
- Se confirmó que las variables S3 necesarias están definidas en `.env.local`, sin
  mostrar ni registrar sus valores. `payload.config.ts` conecta el adaptador S3,
  habilita carga directa del cliente, fija las descargas firmadas a 900 segundos y
  limita cargas a 10 MB. La colección temporal `private-spike-media` solo permite
  acceso a administradores. Se generó, revisó y aplicó `20261023_174312`; su tabla
  tiene RLS y no concede lectura a los roles de Data API.
- Prueba sintética directa contra Supabase S3: PUT firmado con `If-None-Match: *`
  devolvió 200; GET firmado devolvió 200 y los bytes coincidieron; GET sin firma
  devolvió 403; el objeto temporal fue borrado.
- Preflight OPTIONS con origen `http://localhost:3000`, método PUT y encabezados
  `content-type,if-none-match` devolvió 200 y autorizó dichos encabezados. No se
  requirió configurar `PutBucketCors`. CORS no controla permisos de acceso.
- El ciclo feliz desde el panel Payload está comprobado: la sesión de administrador
  cargó la imagen WebP y la previsualizó. Sigue pendiente probar el rechazo a un
  cliente autenticado sin rol admin, la expiración efectiva, límites MIME/tamaño y
  borrado del registro/objeto mediante Payload. Un GET sin sesión a
  `/api/private-spike-media?limit=1` respondió 403, confirmando que la ruta Next/Payload
  está activa y deniega acceso anónimo. La expiración de URL de carga sigue sin
  decidirse; la descarga quedó configurada a los 15 minutos aprobados, aún falta
  medir su expiración real.

## T017–T019 — Casos de dominio pendientes

- No se creó una prenda ni un registro de prueba con tallas/colores.
- No se crearon usuarios de prueba ni se verificó el aislamiento del panel admin.
- No se creó un pedido ni se verificó un estado propio.
- No se necesita limpieza de datos: la migración no insertó datos y el bucket sigue
  vacío.

## Siguiente trabajo

1. Repetir `pnpm dev` desde un terminal normal y comprobar `/api/products`.
2. Levantar `pnpm dev` en el entorno local y ejecutar la prueba integrada Payload Storage desde navegador con un administrador y archivo sintético.
3. Completar los escenarios T017–T019 con datos descartables y documentar su limpieza.
4. Actualizar este informe y cerrar T016/T020 solo después de observar resultados.

## Referencias técnicas

- [Protección de la Data API de Supabase](https://supabase.com/docs/guides/api/securing-your-api)
- [Compatibilidad S3 de Supabase Storage](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Autenticación S3 de Supabase Storage](https://supabase.com/docs/guides/storage/s3/authentication)
- [Adaptador S3 de Payload](https://payloadcms.com/docs/upload/storage-adapters)
