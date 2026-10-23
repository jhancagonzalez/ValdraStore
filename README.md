# Valdra Store

Prototipo web para personalizar y gestionar prendas con inteligencia artificial. El flujo objetivo es cuenta → catálogo → personalización → pedido → seguimiento. La entrega del proyecto está prevista para el 15 de diciembre de 2026.

## Estado

El Sprint 1 está «En construcción» en el backlog. Su carpeta local registra las diez
historias, sus criterios de aceptación y responsables. Ya existe el scaffold integrado
Next.js + Payload, con autenticación base, roles separados y el plugin oficial
Ecommerce configurado para el catálogo en COP. Las migraciones base de Payload ya se
aplicaron a Supabase; las historias funcionales del Sprint 1 siguen pendientes.
Consulta la [guía para el equipo](docs/guia-inicio-equipo.md) y la guía para
[instalar, configurar y levantar el proyecto](docs/desarrollo.md).

## Stack aprobado

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Presentación | Next.js + React + TypeScript | Pantallas de cliente y panel administrativo de Payload |
| Lógica de negocio | Payload CMS sobre Next.js | Servicios, hooks, autenticación Payload y permisos por rol |
| Datos | PostgreSQL alojado en Supabase | Colecciones de Payload y persistencia relacional |
| Archivos | Supabase Storage vía adaptador S3 de Payload | Medios privados y medios públicos del catálogo |
| Hosting inicial | Vercel Hobby gratuito | Alojamiento de la demo no comercial; no contratar servicios pagos |
| Gestor de paquetes | pnpm | Instalación reproducible con lockfile |

Supabase se usa únicamente para PostgreSQL y almacenamiento de archivos. La autenticación y autorización pertenecen a Payload. Las migraciones de esquema también las gestiona Payload.

## Alcance

El alcance aprobado comprende HU-01 a HU-29 y HU-31 (prioridad Could, aprobada por el cliente el 22 de octubre de 2026). HU-30 está clasificada Won't. No se implementará un flujo de pago ni checkout, porque no hay historias que los soliciten.

## Documentación principal

- AGENTS.md: instrucciones para agentes y contribuyentes.
- docs/architecture.md: stack, capas y límites de seguridad.
- [docs/git-workflow.md](docs/git-workflow.md): ramas de trabajo e integración.
- specs/000-sprint0/: constitución, especificación, plan, tareas y clarificaciones de preparación.
- [sprints/sprint-1/README.md](sprints/sprint-1/README.md): objetivo y responsables; [TODO](sprints/sprint-1/TODO.md) con criterios de aceptación.

## Requisitos locales

- Node.js `24.22.1` y pnpm `11.25.0`.
- Variables locales en `.env.local`, excluidas de Git. `DATABASE_URL` y
  `DATABASE_URL_MIGRATIONS` usan el Session pooler IPv4 de Supabase; no se incluyen
  credenciales en este repositorio.
- Biome 2.6.2 está seleccionado y configurado para lint y formato. Consultar
  `specs/000-sprint0/clarifications.md` para las decisiones aún abiertas.

## Comandos

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
```

Luego abre `http://localhost:3000` o `http://localhost:3000/admin`. Completa
`.env.local` antes del primer arranque. Las migraciones base ya están aplicadas;
solo el responsable autorizado aplica migraciones nuevas después de revisar el diff.
Consulta [docs/desarrollo.md](docs/desarrollo.md) para todos los pasos. Los comandos
`pnpm lint`, `pnpm format`, `pnpm format:check` y `pnpm check` usan Biome.
