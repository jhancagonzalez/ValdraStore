# Tareas: Preparación técnica del Sprint 0

**Entradas**: Documentos de diseño de specs/000-sprint0/

**Prerrequisitos**: plan.md y spec.md

**Pruebas**: En esta base documental y de dependencias no se agrega ni ejecuta una
suite automatizada. El spike técnico solicitado de dos días tiene escenarios de
validación, no una suite de pruebas del producto.

## Formato: [ID] [P?] Descripción

- [P] indica que la tarea puede hacerse en paralelo sin editar los mismos archivos ni
  depender de trabajo sin terminar.
- Estas son tareas técnicas del Sprint 0, no tareas para implementar historias de usuario.

## Fase 1: Configuración y documentación

**Propósito**: Establecer las instrucciones aprobadas del proyecto y sus herramientas.

- [x] T001 Documentar el stack y las tres capas lógicas en docs/architecture.md (RNF-14).
- [x] T002 Crear AGENTS.md con las reglas para contribuir y trabajar con agentes; incluir DoR/DoD, seguridad, costos, trazabilidad, comandos y skills disponibles (RNF-14/RNF-15/RNF-16).
- [x] T003 Inicializar Spec Kit 1.0.6 con integración de skills de Codex; crear .specify/ y los artefactos de specs/000-sprint0/.
- [x] T004 Instalar/cambiar a un runtime de Node.js compatible con Payload para ejecutar la aplicación y el spike. Se verificó Node.js global v24.22.1 en Windows; `.node-version` registra el objetivo.
- [x] T005 Instalar las dependencias base fijadas con pnpm, crear pnpm-lock.yaml y verificar que la instalación congelada coincida con el lockfile. La instalación original se hizo antes de completar T004. Mantener la autenticación en Payload y no agregar Supabase Auth (RNF-14).
- [x] T025 Instalar y configurar Biome 2.6.2 para lint y formato con pnpm, fijar la dependencia en pnpm-lock.yaml, añadir los comandos de calidad y verificar `pnpm check` antes de generar el scaffold (C-12). La verificación terminó con código 0; revisó `biome.json` y `package.json`.
- [x] T026 Crear el scaffold integrado de Next.js + Payload: rutas de Admin/API y portada, configuración Postgres con `push: false`, colecciones de administradores/clientes con acceso por rol, y plugin Ecommerce solo con productos/variantes y moneda COP. No aplicar migraciones alojadas (RNF-14, RNF-15).
- [x] T027 Documentar instalación, variables locales, creación/revisión/aplicación manual de migraciones y comandos para desarrollar/compilar/levantar la app en `docs/desarrollo.md` (RNF-14, RNF-15).

## Fase 2: Decisiones fundamentales y accesos

- [ ] T028 Crear y publicar las ramas permanentes `develop` e `integracion` junto con `main`, y verificar que el flujo de ramas de trabajo hacia `integracion` quede disponible para el equipo (RNF-15). Requiere un commit inicial y la identidad Git del responsable del repositorio.

**Propósito**: Confirmar los prerrequisitos de una integración confiable.

- [x] T006 Validar desde Payload las conexiones PostgreSQL de aplicación y migraciones por Supavisor Session Pooler IPv4, sin versionar credenciales (RNF-14/RNF-16). El 2026-10-23 el proyecto `pfvhzecrervwtsetspqq` (PostgreSQL 17.11) respondió `postgres` por `DATABASE_URL` y por `DATABASE_URL_MIGRATIONS`, ambos en Session Pooler, TLS `verify-full` y CA. No depender de IPv6 ni activar complemento IPv4 pago. `.env.local` y `.env` están ignorados por Git. La migración Payload `20261023_165324` se aplicó correctamente y el runtime `getPayload` leyó la colección vacía `products`. La ruta HTTP de Next desde el proceso aislado de esta sesión falló al resolver DNS (`ENOTFOUND`); validar `pnpm dev` en un terminal normal del equipo.
- [x] T007 Verificar y proteger la exposición de la Data API de Supabase para tablas Payload. El 2026-10-23 se revocaron por migración los privilegios predeterminados de `anon`, `authenticated`, `service_role` y `PUBLIC` sobre tablas, secuencias y funciones creadas por `postgres` en `public`; se habilitó RLS en las 20 tablas base y se revocó la ejecución API de `public.rls_auto_enable()`. Verificación SQL: ninguna tabla Payload concede lectura o escritura a esos roles; el trigger `ensure_rls` continúa activo. No se depende del interruptor global de Data API.
- [ ] T008 Identificar la ubicación de `ValdraStoreRespaldos` en el Drive compartido, que el usuario informó haber creado el 2026-10-23. Jhancarlos Gonzalez es responsable de realizar y verificar las copias semanales. Configurar copias de PostgreSQL y de todos los archivos de todos los buckets de Storage con retención de 30 días. Probar restauración en un entorno local aislado. La frecuencia, retención, alcance de Storage y destino local de restauración están aprobados; ruta exacta, cifrado y modalidad de ejecución siguen pendientes (RNF-16).
- [x] T009 Registrar Vercel Hobby gratuito solo como hosting de la demo académica no comercial, sin contratar servicios pagos. No hay decisiones pendientes de Vercel para iniciar desarrollo. Revisar límites técnicos y duración efectiva al preparar el despliegue; el límite documentado de cuerpo de función (4.5 MB) es menor que el máximo de archivo aprobado (10 MB), por lo que el spike valida carga directa a Supabase.
- [ ] T010 Completar el spike de disponibilidad de un endpoint de generación de imágenes OpenRouter que cueste USD 0. El usuario aprobó presupuesto máximo USD 0, generación desactivada hasta verificar gratuidad real y máximo futuro de 3 generaciones por usuario al día. No llamar endpoints pagados ni activar fallback pagado. Registrar evidencia de catálogo/precio y privacidad; mientras no se confirme una opción gratuita, HU-14/HU-31 permanecen sin generación de imágenes activa (HU-14/HU-31).
- [x] T011 Aprobar los límites de imagen para el prototipo: máximo 10 MB, JPEG/PNG/WebP, enlaces firmados por 15 minutos y eliminación de propuestas de IA no aprobadas después de 30 días. T016 validará que el stack los soporte (privacidad/costo).
- [x] T012 Obtener la decisión del cliente sobre HU-28: Alexander Guerrero aprobó el 2026-10-23 el enlace wa.me con mensaje prellenado que el administrador envía manualmente. La API automática de WhatsApp queda fuera de alcance (HU-28).
- [x] T013 Confirmar la disponibilidad de Andrés para Sprint 0; el equipo confirmó su participación el 2026-10-22.
- [x] T014 Registrar la aprobación del cliente para incluir HU-31 en el alcance, confirmada el 2026-10-22; conservar su prioridad Could (HU-31).

## Fase 3: Spike técnico de dos días

**Propósito**: Resolver riesgos de integración usando únicamente datos descartables de prueba.

- [x] T015 Validar la conexión de ejecución de Payload a PostgreSQL Supabase y una migración controlada mediante Supavisor Session Pooler IPv4 (puerto 5432); registrar evidencia y limpieza (RNF-14). La migración base se aplicó sin datos de prueba; `getPayload.find({ collection: 'products', limit: 1 })` devolvió cero documentos y no produjo errores.
- [ ] T016 Validar @payloadcms/storage-s3 y el flujo de carga privada directa. El bucket privado `valdra-private-spike` fue verificado en Supabase: 10 MB, JPEG/PNG/WebP, 0 objetos. Falta generar las claves S3 en el panel y añadirlas solo a `.env.local`, definir CORS en el panel para el origen local (la API S3 no implementa `PutBucketCors`), configurar el adaptador Payload y probar carga/lectura/eliminación, permisos, expiración y acceso no autorizado. Payload 3.91.0 envía `If-None-Match: *` en la carga directa; la matriz S3 de Supabase no declara soporte para este encabezado, así que requiere prueba real (seguridad/privacidad).
- [ ] T017 Crear una colección y un registro Payload descartables para una prenda con tallas y colores; documentar si el modelo de datos la representa sin convertirlo en un módulo de producto (preparación de catálogo).
- [ ] T018 Validar cuentas/roles separados de administrador y cliente en Payload; comprobar que el cliente no tenga acceso administrativo (HU-05/RF-5/RNF-2).
- [ ] T019 Validar que un pedido de prueba almacene y recupere un estado de pedido definido por el proyecto, sin adoptar un flujo externo (HU-20/HU-21/RF-20/RF-21).
- [ ] T020 Completar el informe del spike en specs/000-sprint0/spike-results.md con los resultados restantes, evidencia, limpieza, fallos, riesgos y decisiones siguientes (RNF-14/RNF-16). Existe un informe parcial con T006/T007/T015 y el bloqueo de Storage.

## Fase 4: Revisión y entrega del Sprint 0

**Propósito**: Dejar listo el inicio del Sprint 1 sin afirmar que se entregaron módulos.

- [ ] T021 Revisar con Product Owner y cliente las clarificaciones pendientes y sus responsables; actualizar specs/000-sprint0/clarifications.md.
- [ ] T022 Revisar en Notion el DoR, dependencias, prioridades y criterios de aceptación del backlog; registrar solo cambios aprobados.
- [ ] T023 Verificar el remoto del repositorio, trazabilidad de ramas/commits y configuración aprobada de respaldos externos; informar brechas antes de la entrega (RNF-15/RNF-16).
- [ ] T024 Cerrar Sprint 0 con el equipo después de revisar los cinco chequeos del spike y la evidencia de aceptación de la configuración; no marcar HUs de producto como Done.

## Dependencias

- T004 bloquea ejecutar Payload y el spike; los metadatos de dependencias y el lockfile pueden prepararse por separado.
- T025 bloquea el scaffold y las condiciones de calidad de Sprint 1.
- T026 crea la base integrada; T027 documenta su puesta en marcha. Ninguna de las dos tareas aplica una migración a Supabase.
- T006 y T007 completadas; T015 completada. T016 sigue bloqueada hasta disponer de claves S3 locales y configurar CORS.
- T009 y T010 informan la decisión sobre procesamiento asíncrono de IA; no autorizan activar un proveedor mientras no se verifique un endpoint gratuito ni requieren llamadas pagadas.
- T011 define límites aprobados para el prototipo; T016 debe verificar compatibilidad y usar solo datos de prueba.
- T015 a T019 componen el spike de dos días y pueden hacerse en paralelo solo después de T006/T007 y de tener cuentas de prueba de roles/datos.
- T020 tiene evidencia parcial; se completa después de T016–T019. T021–T024 siguen la revisión de evidencias y decisiones del spike.

## Trabajo en paralelo

Después de confirmar el acceso a Supabase y las cuentas seguras de prueba, T015
(base de datos), T016 (Storage) y T018 (roles) pueden validarse de forma independiente.
T017 y T019 pueden avanzar en paralelo si sus esquemas de prueba descartables no se
superponen. T020 consolida la evidencia cuando terminen las validaciones.

## Criterios de cierre

- La documentación, las plantillas de Spec Kit y el lockfile coinciden con el stack aprobado.
- Los cinco chequeos del spike tienen resultados registrados; los fallos tienen responsable y siguiente acción.
- La disponibilidad de un endpoint IA realmente gratuito, detalles operativos de respaldos,
  compatibilidad de carga directa de imágenes y conexión/compatibilidad de Storage
  con Supabase siguen visibles hasta resolverse. La conexión de Payload requiere
  cadenas locales de Session Pooler para aplicación y migraciones. La política de costo/cuota de IA, HU-31, la disponibilidad de Andrés, Vercel Hobby
  gratuito solo para hosting no comercial,
  la estructura integrada, Biome, moneda COP, mecanismo manual HU-28 y ratificación de la constitución están
  registrados.
- La preparación del Sprint 0 no agrega módulos de producto, pagos/checkout,
  integración de IA con proveedor específico, integración de WhatsApp Business,
  migraciones de producción ni medios permanentes de clientes.
