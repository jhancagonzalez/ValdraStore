# Plan de implementación: Preparación técnica del Sprint 0

**Rama**: docs/RNF-14-RNF-15-RNF-16-sprint-0-foundation | **Fecha**: 2026-10-22 | **Especificación**: spec.md

**Entrada**: Especificación de specs/000-sprint0/spec.md

## Resumen

Preparar la base documental y técnica para comenzar Sprint 1 con Payload CMS, Next.js,
TypeScript, PostgreSQL/Storage en Supabase y Vercel. Crear constitución y artefactos
Spec Kit únicamente para Sprint 0, instalar dependencias base con pnpm, crear el
scaffold integrado y planear un spike de dos días para validar los riesgos de
integración definidos. El scaffold no implementa funcionalidades de las historias.

## Contexto técnico

**Lenguaje/Versión**: TypeScript; Node.js compatible con Payload: ^22.23.4 o >=24.22.1. Runtime global verificado: Node.js 24.22.1; `.node-version` conserva la versión del proyecto.

**Dependencias principales**: Payload CMS, @payloadcms/next, @payloadcms/db-postgres, @payloadcms/storage-s3, Next.js, React, TypeScript. Herramientas de calidad: Biome para lint y formato, Vitest y Playwright.

**Almacenamiento**: PostgreSQL y Supabase Storage en el mismo proyecto. Pooler para consultas de aplicación; conexión directa para migraciones Payload. El proyecto conserva la URL proporcionada por el equipo, sin credenciales en Git.

**Pruebas**: La instalación prepara herramientas; no crea ni ejecuta suites funcionales en esta fase. El spike sí debe producir evidencia manual de sus cinco criterios.

**Plataforma objetivo**: Vercel Hobby queda aprobado como alojamiento gratuito únicamente para una demo académica no comercial; no contratar planes, complementos ni servicios pagos. La documentación revisada el 2026-10-22 indica hasta 300 s por función con Fluid Compute y un límite de 4.5 MB por cuerpo de solicitud/respuesta; los archivos aprobados pueden medir 10 MB, por lo que se debe validar la carga directa firmada. No hay decisiones pendientes de Vercel para iniciar desarrollo; los límites técnicos se revisarán al preparar el despliegue.

**Tipo de proyecto**: Una aplicación web Next.js integrada con Payload, aprobada por el equipo; tres capas lógicas en un despliegue inicial.

**Carga de imágenes privadas**: El equipo aprobó probar una carga directa desde el navegador a Supabase Storage mediante permiso firmado y acotado que Payload solo emite tras autorizar al usuario. Los bytes no deben pasar por Vercel. La compatibilidad con el plugin S3 de Payload, CORS, alcance y vigencia de permisos de carga se comprobarán en el spike; la vigencia de 15 minutos aprobada corresponde a enlaces de lectura.

**Objetivos de rendimiento**: No se definen métricas no presentes en las fuentes. Verificar duración de función disponible frente al tiempo real del proveedor de IA antes de elegir ejecución síncrona o asíncrona.

**Restricciones**: No usar Supabase Auth. Payload maneja autenticación, roles, colecciones y migraciones. La Data API de Supabase debe estar desactivada para las tablas Payload o protegida con RLS activo y sin permisos públicos. Archivos de referencia, IA y maquetas privados; catálogo público. IA y WhatsApp sujetos a costos, accesos y adaptadores. Sin checkout ni pagos.

**Equipo/Alcance**: Cinco integrantes, entrega máxima 2026-12-15. Alcance HU-01 a HU-29 más HU-31 (Could, aprobada por el cliente el 2026-10-22). HU-30 Won't. Sprint 0 (2026-10-20 a 2026-11-03) corre en paralelo con el inicio del Sprint 1 según Notion.

## Revisión de la constitución

- Trazabilidad: conforme; S0-REQ enlaza a RNF-14/15/16 y las decisiones aprobadas.
- Capas: conforme; UI Next.js → lógica Payload → colecciones/PostgreSQL.
- Seguridad: conforme; credenciales solo en servidor y archivos privados por defecto.
- Costos: conforme; no seleccionar proveedor pagado, plan comercial o presupuesto sin aprobación.
- Alcance: conforme; el plan solo prepara la plataforma, no implementa HUs.
- Calidad: conforme; Biome sustituye ESLint/Prettier según C-12. Las pruebas del stack se preparan, pero no se generan/ejecutan fuera del spike solicitado.
- Ratificación: C-11 resuelta; constitución 0.1.0 ratificada por los cinco integrantes el 2026-10-22.

## Estructura del proyecto

### Documentación de esta especificación

- specs/000-sprint0/spec.md: propósito, alcance y criterios de aceptación.
- specs/000-sprint0/plan.md: este plan.
- specs/000-sprint0/tasks.md: tareas dependency-ordered del Sprint 0.
- specs/000-sprint0/clarifications.md: decisiones pendientes.
- .specify/memory/constitution.md: principios del repositorio.

### Código fuente (raíz del repositorio)

No hay funcionalidades de módulos en este plan. La estructura base del scaffold es:

- app/(frontend)/: portada y futuras páginas de cliente.
- app/(payload)/: rutas Payload API/Admin.
- src/collections/: colecciones `admins` y `customers`; el plugin define productos y variantes.
- src/access/: permisos por rol y bootstrap local del administrador inicial.
- src/hooks/: hooks de Payload.
- src/services/: servicios y adaptadores externos; IA bajo src/services/ai/.
- src/lib/: utilidades de infraestructura.
- scripts/: herramientas de Payload para migraciones y generación de tipos.
- docs/ y specs/: documentación y especificaciones.

## Decisión sobre la estructura

La estructura inicial aprobada es una aplicación integrada Next.js + Payload en la
raíz. No se crea apps/api ni un servicio independiente; las responsabilidades siguen
separadas en las tres capas lógicas (C-10).

## Plan de trabajo del Sprint 0

1. Documentación y Spec Kit: inicializar workflows Codex, constitución, arquitectura,
   spec/plan/tasks y registro de clarificaciones.
2. Entorno reproducible: Node 24.22.1 está instalado y verificado; mantener la
   versión indicada por .node-version, las dependencias fijadas con pnpm, el
   pnpm-lock.yaml y Biome 2.6.2 con sus comandos configurados.
3. Seguridad/infraestructura: verificar las conexiones Payload pooler/directa,
   privacidad de Data API/RLS y credenciales locales sin guardarlas en el repo. El
   scaffold deja el push automático desactivado y no ha aplicado migraciones.
4. Spike técnico (timebox de dos días): demostrar a-e de la especificación con datos
   de prueba; borrar datos temporales al terminar según política aprobada.
5. Decisiones de servicio: OpenRouter fue elegido como plataforma por el usuario. El
   presupuesto USD 0 y la decisión de mantener desactivada la generación de imágenes
   hasta verificar un endpoint realmente gratuito quedaron aprobados (C-01). El máximo
   futuro es de 3 generaciones por usuario al día. Continuar validando disponibilidad;
   no ejecutar llamadas pagadas ni fallback pagado. El hosting Vercel ya está
   decidido y no bloquea el inicio; revisar sus límites al preparar el despliegue.
   Validar carga privada firmada directa a Storage, detalles operativos de respaldos
   y compatibilidad Payload S3. El cliente aprobó el enlace
   wa.me manual para HU-28. Los límites de imágenes
   ya aprobados deben validarse en el spike.
6. Cierre Sprint 0: confirmar DoR/backlog, dependencias y disponibilidad del equipo;
   revisar evidencias con Product Owner y cliente según el proceso de Notion.


## Seguimiento de complejidad

No se crean servicios separados, modelos de producción, contratos API ni migraciones
de producto durante Sprint 0. El scaffold integrado y los schemas técnicos base ya
están preparados, sin cambios aplicados a Supabase. El adaptador S3 y el procesamiento
asíncrono solo se implementarán si el spike y las aprobaciones lo requieren.
