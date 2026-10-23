# Arquitectura y tecnologías

## Contexto

Valdra Store es un prototipo avanzado para demostrar el recorrido de cuenta, catálogo, personalización con IA, pedido y seguimiento. El objetivo de esta documentación es fijar la base técnica; no autoriza requisitos funcionales adicionales a las HU y RF de las fuentes.

## Stack aprobado

| Área | Tecnología | Decisión |
| --- | --- | --- |
| Aplicación | Next.js, React y TypeScript | Una aplicación integrada con Payload, aprobada por el equipo (C-10) |
| CMS y lógica | Payload CMS + plugin oficial Ecommerce | Panel administrativo, autenticación, acceso por rol, colecciones, servicios y hooks. El plugin está preparado solo para catálogo |
| Base de datos | PostgreSQL en Supabase | Un proyecto Supabase para la base alojada y Storage |
| Migraciones | Payload | No crear ni gestionar migraciones de aplicación con Supabase CLI |
| Conexiones PostgreSQL | Supavisor Session Pooler IPv4 | Puerto 5432 para la aplicación y para las migraciones Payload; no depender de la conexión directa IPv6 |
| Archivos | Supabase Storage con @payloadcms/storage-s3 | La compatibilidad, URLs firmadas y control de acceso se validan en el spike |
| Hosting inicial | Vercel Hobby gratuito | Solo hosting de demo no comercial; sin servicios pagos |
| WhatsApp | Enlaces wa.me para HU-26 y HU-27 | Sin API de WhatsApp Business en esta etapa |
| Gestor de paquetes | pnpm | Dependencias fijadas y pnpm-lock.yaml versionado |

El equipo aprobó concentrar frontend y Payload en una aplicación Next.js integrada. La arquitectura mantiene tres capas lógicas y no despliega un servicio API separado.

`@payloadcms/plugin-ecommerce@3.91.0` está fijado a la misma versión de Payload y
registrado en `payload.config.ts`. Su configuración en `src/plugins/ecommerce.ts`
habilita productos y variantes, limita escrituras al administrador y excluye carritos,
direcciones, pedidos del plugin, transacciones, inventario y pagos. COP está
configurado como moneda de presentación, sin productos o precios cargados. El
adaptador tiene `push: false` para impedir cambios automáticos al esquema al iniciar;
no se han generado ni aplicado migraciones. Véase `docs/payload-ecommerce.md` y la
guía [docs/desarrollo.md](desarrollo.md).

## Tres capas lógicas (RNF-14)

1. Presentación: páginas y componentes Next.js para la experiencia cliente y administración.
2. Lógica de negocio: endpoints de Payload, servicios de dominio, hooks y reglas de acceso.
3. Datos: colecciones Payload y PostgreSQL en Supabase. Payload gestiona el esquema y las migraciones.

Flujo de datos: pantalla Next.js → endpoint/servicio Payload con autorización → colección Payload → PostgreSQL. El navegador no se conecta directamente a PostgreSQL.

## Estructura del scaffold

Esta es la base actual del repositorio. Los nombres de código se mantienen en inglés;
las instrucciones de ejecución están en `docs/desarrollo.md`.

- app/(frontend)/: portada inicial y rutas futuras de cliente.
- app/(payload)/: rutas del panel, API REST integrada y layout de Payload.
- src/collections/: colecciones base de administradores y clientes; el plugin añade productos y variantes.
- src/access/: permisos por rol y bootstrap local controlado de administrador.
- src/hooks/: hooks de ciclo de vida de Payload.
- src/plugins/: configuración aislada de plugins Payload.
- src/services/: servicios de dominio y adaptadores externos.
- src/services/ai/: interfaz AiProvider e implementaciones intercambiables.
- src/lib/: configuración y utilidades de infraestructura.
- scripts/: utilidad CLI que carga `.env.local` y dirige las migraciones a `DATABASE_URL_MIGRATIONS`.
- docs/: documentación técnica.
- specs/000-sprint0/: documentos Spec Kit del Sprint 0.

La aplicación no se conecta a PostgreSQL sin `DATABASE_URL` y `PAYLOAD_SECRET`.
Payload tiene desactivado el push automático de Drizzle. Las migraciones se crean y
aplican manualmente por Supavisor Session Pooler IPv4, después de revisar el destino
y el SQL.

## Supabase

- URL de proyecto proporcionada por el equipo: https://pfvhzecrervwtsetspqq.supabase.co.
- Usar el mismo proyecto para Postgres y Storage.
- No usar Supabase Auth ni exponer credenciales de base de datos al cliente.
- Usar Supavisor Session Pooler IPv4 (puerto 5432) en ejecución y para ejecutar las migraciones Payload, evitando depender de IPv6 en las redes de los integrantes.
- Para las tablas de Payload, revocar los privilegios predeterminados de Data API para `anon`, `authenticated`, `service_role` y `PUBLIC`, y habilitar RLS. La migración base incluye ambas medidas; además, el trigger `ensure_rls` del proyecto aplica RLS a tablas públicas futuras. No crear políticas para la Data API de Supabase mientras el acceso lo gestione Payload. Payload se conecta como dueño de PostgreSQL y omite RLS, por lo que debe autorizar cada operación en servidor.
- No ejecutar migraciones de Supabase sobre las tablas administradas por Payload.
- La integración S3 de Supabase Storage debe pasar el spike antes de considerarse validada.

## Archivos y privacidad

- Referencias del cliente, propuestas de IA y mockups: privados por defecto.
- Solo las imágenes aprobadas para el catálogo pueden ser públicas.
- Servir archivos privados con enlaces firmados temporales y control de acceso de Payload.
- Guardar credenciales S3 exclusivamente en el servidor.
- Las claves S3 de Supabase omiten RLS y dan acceso amplio al almacenamiento. Nunca usar `service_role` como sustituto ni exponer las claves con `NEXT_PUBLIC_`.
- Probar en el spike el flujo donde Payload autoriza la carga y emite un permiso firmado acotado; el navegador envía los bytes directamente al bucket Supabase para evitar que pasen por funciones de Vercel.
- La compatibilidad de las URLs prefirmadas, CORS, el alcance/expiración del permiso de carga y la interacción con @payloadcms/storage-s3 están pendientes de validación. Las claves S3 no deben llegar al navegador. La expiración aprobada de 15 minutos aplica a los enlaces firmados de lectura.
- Límites aprobados para el prototipo: 10 MB máximo por archivo; JPEG, PNG o WebP; enlaces firmados por 15 minutos; limpieza de propuestas IA no aprobadas a los 30 días. El spike debe validar compatibilidad técnica antes de implementarlos.
- Tener en cuenta el límite de subida server-side de Vercel documentado por Payload. El spike decidirá si se requiere subida desde cliente con CORS.

## Vercel: hosting y límites técnicos

Vercel Hobby se aprobó como hosting gratuito únicamente para una demo académica no
comercial; no contratar planes, complementos ni servicios pagos. La documentación
revisada indica 300 segundos por función con Fluid Compute y 4.5 MB como tamaño
máximo del cuerpo de solicitud/respuesta. Como el archivo aprobado puede medir hasta
10 MB, las imágenes privadas deben cargarse directamente a Storage con permiso
firmado, sin pasar por una función. Vercel no tiene decisiones pendientes para
iniciar el desarrollo; sus límites técnicos se revisarán al preparar el despliegue.

## IA y trabajos costosos

HU-14 y HU-31 deben depender de una interfaz intercambiable AiProvider. Mantener errores distinguibles, reintentos acotados, estado visible «procesando» y máximo futuro aprobado de 3 generaciones por usuario al día. El usuario eligió OpenRouter como plataforma y aprobó presupuesto máximo USD 0; hasta verificar un endpoint realmente gratuito, la generación de imágenes permanece desactivada. No invocar modelos pagados ni hacer fallback pagado. Revisar la política de datos del proveedor/modelo efectivo antes de enviar imágenes privadas; OpenRouter indica que las entradas llegan al proveedor y que sus prácticas de retención/entrenamiento pueden variar. La disponibilidad gratuita del endpoint y las fuentes consultadas están en `specs/000-sprint0/clarifications.md`.

Antes de desplegar, revisar límites técnicos de Vercel y el tiempo de respuesta del proveedor. Si la generación no cabe en el límite aprobado, diseñar un proceso asíncrono persistente con estado de trabajo y consulta periódica; no asumir que Vercel Cron Hobby permite polling frecuente.

## WhatsApp

- HU-26 y HU-27: enlaces wa.me con mensaje preparado por el usuario.
- No integrar WhatsApp Business Cloud API ni otro proveedor en esta fase.
- wa.me no puede entregar mensajes automáticos para HU-28. El cliente aprobó que el
  administrador abra un enlace wa.me con el texto prellenado y lo envíe manualmente;
  esta interacción aún debe implementarse según HU-28. No integrar la API Business.

## Respaldos y continuidad (RNF-16)

El repositorio remoto con historial versionado cubre respaldo de código. El equipo aprobó Google Drive compartido, frecuencia semanal y retención de 30 días. El usuario informó que creó el Drive el 2026-10-23; Jhancarlos Gonzalez es responsable de realizar y verificar las copias semanales. La carpeta se llama `ValdraStoreRespaldos`, pero falta confirmar su ubicación exacta y ruta padre. La copia de Storage debe incluir todos los archivos de todos los buckets. El cifrado y la modalidad de ejecución (manual o automatizada) quedaron pendientes. Falta concretar la exportación de PostgreSQL y el procedimiento para copiar Storage. La restauración se probará en un entorno local aislado, sin sobrescribir el proyecto actual. El respaldo de PostgreSQL no incluye los objetos binarios de Storage. No guardar dumps ni archivos de usuarios en Git.

## Seguridad y secretos

- No incluir secretos, URLs de conexión completas, dumps o archivos privados en commits, issues o logs.
- PAYLOAD_SECRET, conexión PostgreSQL, claves S3 y tokens de proveedores solo en variables de entorno del servidor o el gestor de secretos del hosting.
- Nunca usar prefijo NEXT_PUBLIC_ para secretos o credenciales de servidor.
- El rol administrador se asigna solo mediante un proceso controlado del equipo; no confiar en campos de rol enviados por el cliente.
- Cada colección y endpoint debe aplicar permisos Payload en servidor. Probar separación cliente/administrador y acceso por propiedad.
- Mantener privados los buckets de referencias, propuestas y mockups; evitar URLs permanentes y no autorizadas.
- No mostrar prompts, credenciales o respuestas sensibles de proveedores en logs.

## Pendientes

Ver `specs/000-sprint0/clarifications.md` para disponibilidad de endpoint de imágenes
IA realmente gratuito (permanece abierto y desactivado), detalles operativos de
respaldos y compatibilidad técnica de carga directa firmada. La alternativa manual
wa.me para HU-28 quedó aprobada por el cliente.
La moneda COP quedó decidida; no se han cargado precios.
