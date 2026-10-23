# Especificación: Preparación técnica del Sprint 0

**Rama**: docs/RNF-14-RNF-15-RNF-16-sprint-0-foundation

**Creada**: 2026-10-22

**Estado**: Borrador

**Entrada**: Preparar documentación, herramientas y evidencia técnica para iniciar el Sprint 1 del prototipo Valdra Store.

## Contexto y límites

Valdra Store demostrará un flujo completo de cuenta, catálogo, personalización con
IA, pedido y seguimiento. Sprint 0 prepara el repositorio y la base técnica; no
implementa módulos de producto ni crea historias de producto adicionales.

El alcance confirmado comprende HU-01 a HU-29 asociadas a RF-1 a RF-29 y RNF-1 a
RNF-16, además de HU-31 (prioridad Could, aprobación del cliente confirmada el
2026-10-22). HU-30 está en Won't Have. No hay HU de pago ni checkout, por lo que
quedan fuera del alcance.

El stack aprobado es Payload CMS + Next.js + TypeScript, PostgreSQL y Storage en el
mismo proyecto Supabase, y Vercel como hosting inicial. Payload gestiona autenticación,
roles y migraciones. Supabase Auth no se utiliza. La arquitectura documenta tres
capas lógicas según RNF-14. El equipo aprobó una aplicación integrada Next.js + Payload,
sin un servicio API desplegable separado. Git remoto cubre control de versiones
(RNF-15); los respaldos de base y archivos deben definirse por separado (RNF-16).

## Clarificaciones

### Sesión 2026-10-22

- Q: ¿Apruebas que el scaffold sea una sola aplicación Next.js con Payload integrado, manteniendo las tres capas lógicas y sin un servicio API separado? → A: Sí; una aplicación integrada Next.js + Payload, tres capas lógicas y sin servicio API separado.
- Q: ¿Cómo se usará Vercel Hobby? → A: Solo como hosting gratuito de la demo académica no comercial; no se contratarán servicios pagos. Esta decisión está resuelta y no bloquea el inicio del desarrollo.
- Q: C-12: ¿Qué herramienta apruebas para lint y formato en lugar de ESLint 9 y Prettier? → A: Biome para lint y formato. Se fijó `@biomejs/biome` 2.6.2, con configuración y comandos pnpm; `pnpm check` terminó correctamente sobre los dos archivos compatibles presentes.
- Q: ¿Qué proveedor gratuito se utilizará para IA? → A: El usuario eligió OpenRouter como plataforma, con presupuesto máximo de USD 0 y máximo futuro de 3 generaciones por usuario al día. Tras revisar la discrepancia del catálogo, el usuario decidió mantener USD 0 y dejar la generación de imágenes desactivada hasta hallar un endpoint realmente gratuito (decisión aprobada el 2026-10-22). No invocar endpoints de pago. La disponibilidad de un endpoint gratuito sigue siendo una validación técnica abierta, no una aprobación de presupuesto.
- Q: ¿Qué mecanismo se usará para HU-28 con WhatsApp? → A: Alexander Guerrero aprobó el 2026-10-23 que el administrador abra un enlace wa.me con un mensaje prellenado y lo envíe manualmente; no hay envío automático ni WhatsApp Business.
- Q: ¿Qué moneda usa el catálogo? → A: COP, aprobada el 2026-10-22 y configurada como única moneda. No se cargan precios en el scaffold.
- Q: ¿Cómo se ejecutan y cifran los respaldos semanales en Drive? → A: Continúa pendiente por decisión del solicitante; no asumir modalidad, cifrado ni ruta padre.

## Escenarios de usuario y pruebas

Las historias siguientes son paquetes técnicos de Sprint 0, no nuevas HU del backlog.

### Historia de usuario 1: Base documental y reproducible (Prioridad: P1)

Como equipo de desarrollo, necesitamos una arquitectura y configuración base
documentadas para poder iniciar el Sprint 1 con decisiones compartidas.

**Motivo de prioridad**: Las decisiones de arquitectura, seguridad y dependencias
desbloquean el trabajo de los cinco integrantes y reducen retrabajo.

**Prueba independiente**: El equipo puede leer el repositorio, instalar las dependencias
con pnpm y explicar las tres capas, el flujo de acceso, las integraciones externas y
los pendientes de aprobación sin depender de una explicación oral.

**Escenarios de aceptación**:

1. **Given** el repositorio inicial, **When** un integrante sigue README.md,
   AGENTS.md y docs/architecture.md, **Then** identifica stack, arquitectura,
   comandos disponibles, reglas de seguridad y decisiones abiertas.
2. **Given** el manifiesto y pnpm-lock.yaml, **When** un integrante instala las
   dependencias con una versión de Node compatible, **Then** obtiene las mismas
   versiones registradas y no requiere Supabase Auth ni una API separada.
3. **Given** una rama o commit técnico de Sprint 0, **When** se revisa su mensaje,
   **Then** incluye los IDs RNF relacionados o identifica explícitamente la tarea
   técnica.

---

### Historia de usuario 2: Spike de integración mínima (Prioridad: P1)

Como equipo de desarrollo, necesitamos validar los riesgos centrales de Payload y
Supabase antes de diseñar las colecciones de producto para Sprint 1.

**Motivo de prioridad**: La conexión, el Storage privado y los permisos afectan a
usuarios, catálogo, personalización y pedidos; un bloqueo temprano permite ajustar
el plan antes de comprometer HU.

**Prueba independiente**: El spike de dos días registra pasos reproducibles y evidencia
de los cinco criterios de validación enumerados abajo. Es una prueba técnica temporal;
no representa implementación de módulos.

**Escenarios de aceptación**:

1. **Given** credenciales aprobadas del proyecto indicado, **When** Payload abre una
   conexión de aplicación y ejecuta una migración controlada usando Supavisor Session
   Pooler IPv4 (puerto 5432), **Then** ambos usos funcionan sin exponer credenciales ni
   depender de IPv6.
2. **Given** un bucket privado y una sesión válida de Payload, **When** Payload autoriza
   la carga y emite un permiso de carga firmado y acotado, **Then** el navegador envía
   los bytes directamente a Supabase Storage sin pasarlos por Vercel; el archivo queda
   privado y el spike valida lectura firmada y rechazo a usuarios no autorizados.
   También se registra si @payloadcms/storage-s3 admite el flujo requerido.
3. **Given** la colección de prueba del spike, **When** un administrador crea una
   prenda con tallas y colores, **Then** Payload persiste y presenta ambas variantes.
4. **Given** dos cuentas de prueba, **When** una tiene rol administrador y la otra
   cliente, **Then** solo la primera ejecuta acciones administrativas.
5. **Given** un pedido de prueba, **When** se define y persiste un estado de pedido
   propio, **Then** el estado puede consultarse en Payload sin depender de un estado
   externo predeterminado.

### Casos límite

- La referencia Supabase no coincide o el Session Pooler no está habilitado: registrar
  bloqueo, no migrar otro proyecto ni activar complementos IPv4 pagos.
- Supabase Storage no soporta un requisito del adaptador S3 o de la carga directa
  firmada: conservar privados los archivos y registrar la brecha; no cambiar proveedor
  ni hacer pasar los bytes por Vercel sin aprobación.
- Los enlaces firmados no respetan permisos de Payload: el spike falla y no se
  habilitan archivos privados mediante enlaces públicos.
- La generación de IA supera el límite efectivo de Vercel: diseñar trabajo asíncrono
  con estado y consulta periódica antes de implementar HU-14.
- El proveedor de IA no responde, limita solicitudes o cobraría reintentos: no elegir
  proveedor ni ejecutar solicitudes pagas sin las aprobaciones C-01 y C-03.
- wa.me no permite notificaciones automáticas: HU-28 solo puede usar el enlace con
  mensaje prellenado que el administrador envía manualmente, aprobado por el cliente.
  No sustituirlo por automatización.
- Si los límites aprobados para el prototipo exceden las capacidades del adaptador o
  Storage, registrar la brecha en el spike; no cambiarlos silenciosamente.

## Requisitos

Los identificadores S0-REQ son requisitos de preparación de esta especificación, no
los RF del Project Charter.

### Requisitos funcionales

- **S0-REQ-01**: El repositorio DEBE documentar stack, arquitectura de tres capas,
  estructura objetivo y comandos base en español.
- **S0-REQ-02**: El proyecto DEBE usar Payload para autenticación, roles,
  administración, colecciones y migraciones; no debe usar Supabase Auth.
- **S0-REQ-03**: El proyecto DEBE conectar PostgreSQL de Supabase por Supavisor Session
  Pooler IPv4 (puerto 5432) tanto para la aplicación como para migraciones Payload,
  para no depender de soporte IPv6 en las redes del equipo.
- **S0-REQ-04**: El proyecto DEBE mantener las tablas Payload fuera de la API
  automática de datos de Supabase o protegerlas con RLS activo y sin grants públicos.
- **S0-REQ-05**: Las referencias, propuestas IA y mockups DEBEN ser privados por
  defecto. Payload debe autorizar la carga y emitir un permiso firmado para que el
  navegador envíe los bytes directamente a Supabase Storage sin pasar por Vercel; el
  spike validará el flujo. La lectura privada usa acceso Payload y URLs firmadas de
  15 minutos; solo las imágenes del catálogo pueden ser públicas.
- **S0-REQ-06**: HU-14 y HU-31 DEBEN depender de un adaptador IA intercambiable con
  manejo de errores, reintentos acotados, máximo aprobado futuro de 3 generaciones por
  usuario al día y estado «procesando» visible. OpenRouter está elegido como plataforma
  de acceso; por decisión aprobada el presupuesto es USD 0 y la generación debe
  permanecer desactivada hasta verificar un endpoint de imágenes realmente gratuito.
  No se permiten llamadas a modelos pagados ni fallback pagado.
- **S0-REQ-07**: HU-26 y HU-27 DEBEN usar enlaces wa.me inicialmente. Para HU-28,
  el administrador DEBE abrir el mensaje wa.me prellenado y enviarlo manualmente,
  conforme a la aprobación del cliente del 2026-10-22. No enviar mensajes automáticamente.
- **S0-REQ-08**: El spike de dos días DEBE validar conexión, carga directa firmada y
  lectura privada de Storage, variantes de prenda, separación de roles y estado propio
  de pedido.
- **S0-REQ-09**: El repositorio DEBE conservar lockfile pnpm y trazabilidad HU/RF/RNF
  en ramas y commits; Biome 2.6.2 DEBE quedar fijado y documentado como herramienta
  de lint y formato, con `biome.json` y comandos pnpm configurados antes del scaffold.
- **S0-REQ-10**: La disponibilidad de un endpoint de IA realmente gratuito y detalles
  operativos de respaldos DEBEN permanecer visibles como pendientes hasta
  tener decisión documentada. La moneda COP y la alternativa manual de HU-28 están
  decididas. La conexión
  Supabase, Data API/RLS y compatibilidad Storage deben validarse en el spike. Los
  límites de imágenes aprobados para el prototipo también deben validarse técnicamente.
- **S0-REQ-11**: El Sprint 0 DEBE preparar RNF-14, RNF-15 y RNF-16 sin implementar
  funcionalidades de los módulos ni pagos/checkout.

### Entidades clave

- Registro de spike: evidencia de configuración, pasos, resultado, errores y riesgos;
  no constituye una entidad de producto.
- Datos de prueba de prenda, cuenta/rol y pedido: datos desechables usados para validar
  el spike; no fijan el modelo de producción.

## Criterios de éxito

### Resultados medibles

- **S0-SC-001**: README, arquitectura, AGENTS, constitución, especificación, plan,
  tareas y clarificaciones existen en las rutas del Spec Kit inicializado.
- **S0-SC-002**: pnpm-lock.yaml registra versiones exactas de las dependencias base
  aprobadas; la instalación se completa con una versión Node compatible con Payload.
- **S0-SC-003**: El informe del spike contiene resultado y evidencia para los cinco
  criterios de integración; cada fallo tiene impacto y siguiente acción documentados.
- **S0-SC-004**: Las decisiones con costo, privacidad o alcance pendientes aparecen
  como abiertas con aprobador identificado; no se han activado integraciones de pago.
- **S0-SC-005**: No se agregan código de módulos, historias de producto nuevas,
  checkout ni credenciales al repositorio durante la preparación documental.

## Suposiciones

- Payload se integra dentro de Next.js en una sola aplicación, aprobado por el equipo
  el 2026-10-22; la arquitectura conserva tres capas lógicas sin exigir tres servicios.
- El link Supabase proporcionado por el equipo es el destino que debe validarse en el
  spike. El repositorio no almacena contraseñas ni cadenas de conexión.
- Los 29 RF del Charter se trazan a HU-01–HU-29; HU-31 también forma parte del alcance
  tras aprobación del cliente confirmada el 2026-10-22.
- La compatibilidad de S3 y disponibilidad de backups no se consideran probadas por
  la mera selección del stack. Vercel está decidido como hosting gratuito para la
  demo y sus límites se revisan antes del despliegue, sin bloquear el desarrollo.
