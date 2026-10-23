# Guía de inicio para el equipo

## Qué contiene el repositorio

Valdra Store es un prototipo académico para demostrar el flujo cuenta → catálogo →
personalización → pedido → seguimiento. La entrega objetivo es el 15 de diciembre de
2026. El Sprint 1 está en construcción y cubre HU-01 a HU-10: registro, sesión,
perfil, roles, catálogo, detalle, imágenes, búsqueda y filtros.

El repositorio ya tiene el scaffold de Next.js + Payload, autenticación base, roles
separados, Ecommerce configurado en COP y conexión a PostgreSQL/Storage de Supabase.
Las funciones de las historias del Sprint 1 todavía deben implementarse según sus
criterios de aceptación en Notion.

## Reparto actual del Sprint 1

Estas asignaciones se copiaron del backlog de Notion. Notion sigue siendo la fuente
de verdad si cambian los responsables o estados.

| Responsable | Rol | Historias |
| --- | --- | --- |
| Jhancarlos Gonzalez | Scrum Master, Developer Backend | HU-01, HU-02, HU-06, HU-07 |
| Kevin Burgos | Developer Full Stack | HU-03, HU-04 |
| Daniel Cárdenas | Developer Backend | HU-05 |
| Emanuel Giraldo | Product Owner, Developer Frontend | HU-08 |
| Andrés Valencia | Developer Frontend | HU-09, HU-10 |

Consulta [TODO.md](../sprints/sprint-1/TODO.md) para criterios de aceptación y
[Notion](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1) para el estado
vigente.

## Stack aprobado

- **Presentación:** Next.js, React y TypeScript.
- **Lógica de negocio:** Payload CMS integrado en Next.js; rutas, servicios y hooks.
- **Datos:** PostgreSQL alojado en Supabase. Payload administra las migraciones.
- **Archivos:** Supabase Storage por el adaptador S3 de Payload. El bucket de prueba
  es privado; el flujo de carga y previsualización ya fue comprobado con una imagen
  de prueba. La configuración de almacenamiento para otras colecciones debe validarse
  según sus historias.
- **Calidad:** Biome y TypeScript.
- **Paquetes:** pnpm workspaces.
- **Moneda del catálogo:** COP.
- **IA:** generación de imágenes desactivada; USD 0. No conectar un modelo hasta que
  el equipo apruebe un servicio realmente gratuito y su política de datos.
- **Pagos:** fuera del alcance actual; ninguna HU los solicita.

Supabase Auth no se usa. La autenticación y los permisos pertenecen a Payload.
WhatsApp Business tampoco está integrado; para las historias aprobadas se usa
`wa.me`.

## Requisitos locales

- Node.js `24.22.1`.
- pnpm `11.25.0`.
- Git y acceso al repositorio GitHub.
- Acceso individual a las variables que cada persona necesite. No todas las tareas
  requieren acceso a claves de base de datos o Storage.

Verifica las versiones:

```powershell
node --version
pnpm --version
```

## Clonar, instalar y ejecutar

Desde PowerShell:

```powershell
git clone https://github.com/jhancagonzalez/ValdraStore.git
cd ValdraStore
git switch main
git pull origin main
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Edita `.env.local` con los valores que el responsable te entregue por un canal
seguro. No subas ese archivo ni lo pegues en GitHub, Notion, Teams, WhatsApp o este
documento. `.env.local` está ignorado por Git.

Después:

```powershell
pnpm dev
```

Abre:

- Aplicación: <http://localhost:3000>
- Administración de Payload: <http://localhost:3000/admin>
- API de Payload: <http://localhost:3000/api>

Chequeos antes de entregar una rama:

```powershell
pnpm check
pnpm typecheck
```

`pnpm build` compila la aplicación; `pnpm start` la ejecuta después del build.
Consulta [desarrollo.md](desarrollo.md) para más detalle de instalación, TLS y
migraciones.

## Variables de entorno

Completa las variables según `.env.example`:

| Variable | Uso |
| --- | --- |
| `PAYLOAD_SECRET` | Secreto local de Payload. Genera uno con el comando de `docs/desarrollo.md`; no lo subas a Git. |
| `DATABASE_URL` | Conexión de la aplicación al Session Pooler IPv4 de Supabase, puerto 5432, con `sslmode=verify-full` y el certificado CA local. |
| `DATABASE_URL_MIGRATIONS` | Conexión que usan únicamente los comandos de migración. Déjala sin configurar si no tienes asignada esa responsabilidad. |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3000` en desarrollo local. |
| `ALLOW_ADMIN_BOOTSTRAP` | Déjala en `false`: ya existe un administrador. El modo inicial solo se habilita localmente si la colección está vacía. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Acceso privilegiado a Supabase Storage para las tareas que lo necesiten. No ponerlos en el navegador ni usar prefijo `NEXT_PUBLIC_`. |
| `S3_REGION`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_FORCE_PATH_STYLE` | Configuración del adaptador S3; los valores no secretos están descritos en `.env.example`. |

Usa el **Session Pooler IPv4**; no uses la conexión directa IPv6. No compartas la
clave `service_role`: el proyecto no la necesita para el flujo de Payload. La URL de
migraciones y las claves S3 tienen permisos amplios; entrégalas solo a quien las
necesite para una tarea aprobada. Usa un gestor de contraseñas o un canal privado con
acceso restringido; nunca las incluyas en un archivo Markdown, commits, capturas ni
mensajes grupales.

Cada integrante debe tener su propia cuenta de administrador de Payload. No compartan
el usuario administrador existente. Un administrador puede crear cuentas individuales
desde la colección **Administradores**. El registro de clientes aún no está habilitado;
se implementará en las historias correspondientes.

## Base de datos y migraciones

El proyecto Supabase `pfvhzecrervwtsetspqq` ya tiene las migraciones base
`20261023_165324` y `20261023_174312` aplicadas. **No ejecutes migraciones al clonar ni
para iniciar la app.** `pnpm dev` no altera el esquema.

Si una historia requiere un cambio de esquema:

1. Crea una rama y genera la migración con `pnpm payload:migrate:create`.
2. Revisa el diff de la migración y confirma que corresponde al alcance aprobado.
3. Pide revisión al integrador antes de aplicar cambios en Supabase.
4. Solo el responsable autorizado aplica `pnpm payload:migrate` con
   `DATABASE_URL_MIGRATIONS` y verifica RLS/permisos después.

No uses Supabase CLI para migrar el esquema de Payload y no cambies tablas a mano.

## Git y colaboración

La base de Sprint 0 se publica ahora en `main` por decisión del responsable para que
el equipo pueda iniciar. Las ramas permanentes `develop` e `integracion` pueden no
tener todavía esta actualización; antes de crear una rama desde ellas, comprueba que
incluyan el commit actual de `main`. Si siguen atrasadas, inicia temporalmente desde
`main` y coordina con el integrador cómo sincronizarlas.

Para cada historia, usa una rama como `feat/HU-01-customer-registration`. Para una
tarea técnica, usa `branch/SPRINT-1-descripcion`. Incluye HU/RF/RNF confirmados en
ramas y commits. El flujo del equipo está descrito en
[git-workflow.md](git-workflow.md): PR hacia `integracion`, luego `develop` y al final
`main`. No hagas commits directos a las ramas permanentes durante el desarrollo normal.

## Seguridad y alcance

- No uses imágenes reales de clientes en pruebas técnicas; usa archivos de prueba.
- Referencias, propuestas de IA y mockups serán privados y usarán URLs temporales.
- Solo imágenes del catálogo pueden ser públicas cuando la historia lo defina.
- No añadas llamadas de IA, pagos ni WhatsApp Business por iniciativa propia; respeta
  las decisiones y criterios aprobados en Notion.
- Revisa `AGENTS.md`, `docs/architecture.md` y la historia de Notion antes de empezar.
