# Constitución de Valdra Store

## Principios fundamentales

### I. Trazabilidad de requisitos

Todo cambio del producto DEBE vincularse a una HU aprobada y a sus RF/RNF de origen.
El trabajo de Sprint 0 DEBE identificarse como preparación técnica y NO DEBE
presentarse como una nueva historia de producto. Las propuestas no aprobadas deben
seguir marcadas como propuestas o pendientes de aprobación.

### II. Separación en tres capas

La aplicación DEBE mantener separadas las responsabilidades de presentación, lógica
de negocio y datos (RNF-14). Las páginas/componentes Next.js se encargan de la
presentación; los servicios/hooks de Payload, de la lógica de negocio y los controles
de acceso; y las colecciones de Payload con PostgreSQL, de la persistencia. Las capas
pueden compartir un mismo despliegue.

### III. Seguridad y privacidad por defecto

Payload DEBE aplicar en el servidor la autenticación y autorización por rol. Las
referencias de clientes, propuestas de IA y maquetas privadas DEBEN seguir privadas y
usar enlaces firmados autorizados. Los secretos DEBEN permanecer en el servidor y NO
DEBEN versionarse ni exponerse en variables públicas. El acceso a las colecciones DEBE
probarse para roles y propiedad de registros.

### IV. Servicios externos intercambiables y con costos controlados

La IA y otras integraciones externas DEBEN estar detrás de adaptadores
intercambiables. No se debe asumir un proveedor de pago, presupuesto ni plan comercial
sin aprobación. La generación de IA DEBE manejar fallos, limitar reintentos, aplicar
un límite de uso aprobado por persona y mostrar el estado «procesando» (RNF-7). La API
de WhatsApp Business queda fuera del alcance hasta que se apruebe explícitamente.

### V. Calidad incremental verificable

El trabajo DEBE ser lo bastante pequeño para revisarlo, documentarse en español si es
visible para usuarios y versionarse con trazabilidad HU/RF/RNF. Los cambios DEBEN
seguir el DoR y DoD aplicables. Los spikes técnicos DEBEN registrar pasos, resultados,
limitaciones y riesgos pendientes; NO DEBEN convertirse silenciosamente en
funcionalidad de producción.

## Restricciones técnicas y de seguridad

- Stack aprobado: Payload CMS + Next.js + TypeScript; PostgreSQL y almacenamiento de
  archivos en el mismo proyecto Supabase; Vercel como hosting inicial.
- Payload se encarga de autenticación, roles, colecciones y migraciones de base de
  datos. No se usa Supabase Auth.
- Usar el pooler de base de datos de Supabase para consultas de la aplicación y una
  conexión directa para migraciones Payload. Mantener desactivada la Data API
  automática de Supabase para tablas Payload; si no se puede desactivar, mantener RLS
  activo y evitar permisos públicos.
- Guardar referencias privadas, propuestas de IA y maquetas en Storage privado. Solo
  imágenes aprobadas del catálogo pueden ser públicas. Límites aprobados para el
  prototipo: 10 MB, JPEG/PNG/WebP, enlaces firmados por 15 minutos y limpieza de
  propuestas de IA no aprobadas después de 30 días; validar compatibilidad en el spike
  de Sprint 0.
- Para cargas privadas, Payload debe autorizar y emitir un permiso firmado acotado; el
  spike probará el envío directo de bytes desde el navegador a Supabase Storage para
  evitar que pasen por funciones de Vercel. La viabilidad y el alcance del permiso
  deben validarse antes de tratar el flujo como implementable.
- HU-14 y HU-31 usan un adaptador de proveedor IA intercambiable. HU-26/27 usan solo
  enlaces wa.me. El alcance de notificaciones automáticas de HU-28 requiere aprobación
  del cliente.
- RNF-15 requiere control de versiones remoto. RNF-16 requiere un plan aprobado de
  respaldo externo para PostgreSQL y objetos Storage; un repositorio Git no es un
  respaldo de datos.
- El alcance del producto incluye HU-01 a HU-29 y HU-31 (Could, aprobada por el
  cliente el 2026-10-22). HU-30 es Won't Have. Pagos y checkout quedan fuera del
  alcance.

## Flujo de desarrollo y controles de calidad

- Antes de ingresar una HU de producto a un sprint, verificar todos los elementos del
  DoR: redacción estándar de rol/necesidad/propósito; objetivo y alcance claros;
  criterios de aceptación documentados; dependencias identificadas y comunicadas; y
  ningún bloqueo abierto que impida comenzar.
- Una HU de producto solo está Done cuando sus endpoints, interfaces y lógica de
  negocio están implementados y probados; pasan las pruebas unitarias y de
  integración; se valida la experiencia de usuario; y el código está versionado,
  documentado y desplegado en el entorno correspondiente.
- Sprint 0 no entrega HUs de producto. La evidencia de sus spikes y tareas técnicas
  no marca una HU de producto como Done.
- Las ramas y commits DEBEN incluir los IDs HU/RF/RNF aplicables o indicar que son
  preparación técnica de Sprint 0. Quienes revisen DEBEN comprobar la trazabilidad
  antes de integrar cambios.
- Biome es la herramienta seleccionada para lint y formato; Vitest y Playwright son
  las herramientas seleccionadas para pruebas. Esta base documental y de dependencias
  no agrega ni ejecuta una suite de pruebas.
- Todo cambio al stack aprobado, las restricciones de seguridad o el alcance requiere
  una decisión registrada en specs/000-sprint0/clarifications.md antes de
  implementarse.

## Gobierno del proyecto

Esta constitución rige el trabajo del repositorio y complementa las fuentes del
proyecto; no reemplaza el Project Charter, el Acta de Inicio ni el backlog aprobado
en Notion. Todo cambio requiere una propuesta documentada, revisión de impacto sobre
las especificaciones vigentes y aprobación del equipo. Los cambios de versión siguen
versionado semántico: MAJOR para cambios de gobierno incompatibles, MINOR para
principios nuevos o ampliados sustancialmente y PATCH para aclaraciones y ajustes de
redacción. Cada pull request DEBE revisar el cumplimiento de esta constitución y
actualizar las especificaciones afectadas. Los cinco integrantes ratificaron la
versión 0.1.0 el 2026-10-22. La decisión C-12 sustituye ESLint/Prettier por Biome y
se registra en esta revisión 0.1.1; fue aprobada por el usuario el 2026-10-22.

**Versión**: 0.1.1 | **Ratificación base**: 0.1.0, 2026-10-22 | **Última modificación**: 2026-10-22
