# Plan de trabajo — Sprint 2

> **Actualización (12-nov-2026):** el reparto de responsables está sincronizado con
> Notion. El enfoque técnico queda definido: **Cloudflare Workers AI** con
> `@cf/black-forest-labs/flux-2-klein-4b`, **prendas base predefinidas** y generación
> del **mockup completo** sobre la base. No se genera un diseño aislado ni se usa
> composición CSS/Canvas (overlay).

## 1. Lectura del sprint

El Sprint 2 va del **4 al 17 de noviembre de 2026**. El alcance registrado en Notion es
**HU-11 a HU-17: 27 puntos**, con **5 Must Have y 2 Should Have**. El objetivo es que el
cliente recorra:

**selección → idea → referencia opcional → propuesta de IA → mockup → ajustes → aprobación**

La página de Sprint 2 en Notion está vacía; el alcance y los criterios se tomaron de las
siete historias del backlog. Todas figuran como **«En construcción»**.

Al 12 de noviembre el sprint ya está en su segunda semana y no hay una rama de Sprint 2
en el repositorio. Quedan **6 días calendario y 4 días hábiles** si no se trabaja el fin
de semana. Es un sprint corto para 27 puntos. El bloqueo técnico de C-01 se redujo con
la prueba exitosa de Cloudflare Workers AI, pero aún hay que registrar la evidencia y
confirmar privacidad y términos del modelo.

## 2. Estrategia

1. **Cloudflare como proveedor.** Usar `@cf/black-forest-labs/flux-2-klein-4b` con una
   cuenta gratuita. Cada integrante configura su propio `CLOUDFLARE_ACCOUNT_ID` y
   `CLOUDFLARE_API_TOKEN` en `.env.local`; la demo desplegada usa una cuenta de equipo.
2. **Prendas base predefinidas.** Usar 5 camisetas y 5 hoodies en negro, blanco, rojo,
   beige y azul, con el mismo encuadre, fondo e iluminación. El cliente elige una base
   y el modelo genera el mockup completo con el diseño descrito. No se genera un diseño
   aislado ni se compone con overlay.
3. **Alcance completo.** Se mantienen las 7 HU y los 27 puntos; no se recorta el
   alcance. Must primero es solo el orden de riesgo: HU-11, HU-12, HU-14, HU-15 y HU-17
   (21 puntos) se atienden antes, pero HU-13 y HU-16 también son compromiso del sprint.
4. **No simular IA como si fuera real.** Un mock puede probar el flujo, pero no cumple
   HU-14. Si Cloudflare falla o no hay cuota, la historia queda «En validación» o
   bloqueada, no «Hecha».
5. **Cero gasto.** No usar modelos pagados, no hacer fallback pagado y no enviar
   imágenes privadas a un proveedor sin revisar su política de datos.

## 3. Reparto propuesto

Se conservan los responsables de Notion. La columna «Apoyo» indica con quién se coordina
la tarea, no una reasignación.

| Persona | Rol | Historias primarias | Puntos | Apoyo / tareas transversales |
| --- | --- | --- | --- | --- |
| Jhancarlos Gonzalez | Scrum Master, Backend | HU-11, HU-12 | 5 | Modelo de datos, selección, idea, cuota de IA, seguridad e integración |
| Kevin Burgos | Full Stack | HU-14 | 8 | Adaptador `AiProvider`, estados de procesamiento, reintentos, integración con mockup |
| Daniel Cárdenas | Backend | HU-16 | 3 | Revisiones, historial, RLS, migración y limpieza de propuestas |
| Emanuel Giraldo | PO, Frontend | HU-13, HU-17 | 6 | Carga privada, aprobación, validación de aceptación y demo |
| Andrés Valencia | Frontend | HU-15 | 5 | Mockup responsive, historial visual y apoyo a HU-11/HU-17 |

**Reequilibrio si hay bloqueo:** si el proveedor de IA no se aprueba el viernes 13,
Kevin pasa a apoyar HU-13/HU-15 y HU-14 queda con el adaptador y el mock; si Storage no
está listo, Emanuel y Daniel se reparten la carga privada y QA. Cualquier cambio de
responsable se registra en Notion.

## 4. Secuencia y cronograma

| Día | Foco | Entregable | Responsable |
| --- | --- | --- | --- |
| Jue 12 | Decisiones y base | D2/D4; modelo de datos congelado; ramas; HU-11 y HU-12 | Todos / Jhancarlos |
| Vie 13 | Carga y adaptador | HU-13 en su punto de decisión; `CloudflareAiProvider` y mock; prendas base | Emanuel, Kevin (Daniel apoya) |
| Sáb 14 | IA y mockup | Generación con Cloudflare sobre las bases; HU-15 | Kevin, Andrés |
| Dom 15 | Ajustes y aprobación | HU-16 y HU-17; historial y confirmación | Daniel, Emanuel (Jhancarlos apoya) |
| Lun 16 | Integración y QA | E2E, seguridad, responsive, evidencias, correcciones | Todos |
| Mar 17 | Revisión y cierre | Demo al PO, Notion actualizado, acta de cierre | Emanuel / Jhancarlos |

El fin de semana es **buffer**, no una dependencia del plan. El alcance se mantiene
completo; si el equipo no trabaja sábado y domingo, el riesgo de tiempo se compensa con
apoyo entre integrantes y revisiones diarias, no recortando historias.

## 5. Desglose técnico por historia

| ID | HU | Tareas técnicas | Responsable |
| --- | --- | --- | --- |
| S2-T01 | HU-11 | Acción «Personalizar» desde el detalle; crear borrador de personalización; guardar producto, variante y opciones; exigir talla y color; recuperar el borrador; manejar producto sin variantes | Jhancarlos / Emanuel |
| S2-T02 | HU-12 | Campo de idea; validación de vacío en servidor; guardar idea asociada a la selección; resumen editable; pruebas | Jhancarlos |
| S2-T03 | HU-13 | Colección privada de referencias; bucket privado; carga directa firmada; vista previa; límites 10 MB/JPEG/PNG/WebP; reemplazo y borrado; errores | Emanuel / Daniel |
| S2-T04 | HU-14 | Contrato `AiProvider`; `MockAiProvider`; `CloudflareAiProvider` con `flux-2-klein-4b`; prompt + prenda base; mensaje «Tu diseño se está generando…»; reintentos acotados; errores; persistencia de la propuesta. La cuota se implementa después. | Kevin / Jhancarlos |
| S2-T05 | HU-15 | 5 camisetas + 5 hoodies ya definidas; mapa `categoría + color` (manifest); envío de la base a Cloudflare; visualización del mockup completo; responsive; estados de carga y error; texto alternativo | Andrés / Emanuel |
| S2-T06 | HU-16 | Formulario de cambios; nueva versión de propuesta; historial ordenado; comparación; cuota; pruebas | Daniel / Jhancarlos |
| S2-T07 | HU-17 | Confirmación de aprobación; bloqueo de cambios posteriores; snapshot del diseño; punto de extensión para el pedido (Sprint 3); auditoría | Emanuel / Jhancarlos |
| S2-T08 | Transversal | RLS y privilegios revocados; acceso por propietario; secretos de servidor (Cloudflare y Storage); limpieza a 30 días; pruebas negativas | Jhancarlos / Daniel |
| S2-T09 | Transversal | QA de flujo, responsive, accesibilidad, errores, datos sintéticos y evidencias | Andrés / Emanuel |
| S2-T10 | Transversal | Documentación, PRs, trazabilidad y actualización de Notion | Jhancarlos |

## 6. Modelo de datos propuesto

Propuesta para revisar antes de crear la migración. No está aprobada ni aplicada.

### `customizations`

Borrador y estado del proceso de personalización.

- `customer` — relación con `customers`, obligatoria.
- `product` — relación con `products`, obligatoria.
- `variant` — relación con `variants`, obligatoria.
- `selectedOptions` — snapshot de talla y color.
- `idea` — texto del cliente.
- `referenceImage` — relación con el medio privado de referencia.
- `status` — `draft`, `generating`, `proposal_ready`, `revision_requested`, `approved`, `failed`.
- `approvedProposal` — relación con la propuesta aprobada.
- `approvedAt` — fecha de aprobación.
- Sin campo `order` en Sprint 2: la colección de pedidos aún no existe. El diseño
  aprobado queda con un punto de extensión para asociarlo en Sprint 3.

### `design-proposals`

Historial de propuestas; una fila por versión.

- `customization` — relación con `customizations`.
- `version` — número consecutivo.
- `prompt` — idea y cambios enviados al proveedor.
- `provider` / `model` — trazabilidad del proveedor efectivo.
- `image` — relación con el medio privado de la propuesta.
- `mockup` — relación con el mockup generado o compuesto.
- `status` — `processing`, `ready`, `failed`.
- `error` — mensaje seguro para el cliente; sin secretos ni respuestas crudas.
- `createdAt` / `completedAt`.

### `customization-media`

Colección de carga privada para referencias, propuestas y mockups.

- `customer` — propietario.
- `kind` — `reference`, `proposal`, `mockup`.
- `alt` — texto alternativo.
- Límites: 10 MB, JPEG/PNG/WebP, URLs firmadas de 15 minutos.
- Lectura solo del propietario o administrador; nunca pública.

### Prendas base

Mapa `prenda + color → imagen base` en `public/mockups/manifest.json`. Las categorías
son `camisetas` y `hoodies`; las claves de color son `black`, `white`, `red`, `beige` y
`blue`. Si más adelante se quiere administrar desde Payload, se crea una colección
`mockup-bases` con `garment`, `color`, `image` y `active`; no se implementan ambas.

### Cuota de IA

La cuota aprobada **a futuro** es de **3 generaciones por usuario al día**. Por ahora no
se implementa; se deja documentada para cuando se active. Cuando se active, debe
aplicarse en servidor, no en el navegador. Opciones:

- contar propuestas creadas por cliente y día; o
- una tabla `ai-generation-usage` con `customer`, `window_start` y `hits`.

Recomendación futura: tabla dedicada con transacción, porque los reintentos y las
revisiones también consumen cuota y no deben depender de filas que luego se borran.

### Reglas de acceso

- Un cliente solo ve y modifica sus propias personalizaciones y medios.
- Un administrador puede leer y moderar, pero no cambiar una aprobación sin dejar rastro.
- Las propuestas y los medios privados nunca se leen con la Data API de Supabase.
- Cuando se active la persistencia (Sprint 3), las escrituras de propuestas las hará el
  servidor, no el navegador.
- RLS activo y privilegios revocados para `anon`, `authenticated`, `service_role` y `PUBLIC`.

### Propuesta en el navegador (decisión del 2026-11-13)

Para no consumir espacio en la base de datos, la propuesta generada y la selección se
mantienen solo en el estado del navegador. El resultado se puede descargar y se advierte
antes de salir o recargar. No se crean colecciones ni migraciones de personalizaciones
en este sprint; la persistencia y la asociación con pedidos se retoman en el Sprint 3.

## 7. IA y mockup: enfoque elegido

### Proveedor

- **Cloudflare Workers AI**, modelo `@cf/black-forest-labs/flux-2-klein-4b`.
- Cuenta gratuita con **10.000 neuronos por día**; sin tarjeta y sin fallback pagado.
- El modelo recibe texto e imagen de referencia y devuelve una imagen en Base64.
- **Cada integrante** crea su cuenta gratuita y guarda `CLOUDFLARE_ACCOUNT_ID` y
  `CLOUDFLARE_API_TOKEN` en `.env.local`. No se comparten tokens personales.
- La demo desplegada usa una cuenta de equipo; las claves van en Vercel, no en el cliente.
- Política de Cloudflare: retención cero y sin entrenamiento con el contenido de
  Workers AI, sujeta a los términos del modelo de Black Forest Labs.

### Prendas base predefinidas

El mockup no se dibuja con CSS ni se superpone un PNG sobre una foto. Se parte de una
**prenda base ya preparada** y el modelo genera la imagen completa con el diseño.

Set inicial ya definido:

- 5 camisetas: negra, blanca, roja, beige y azul.
- 5 hoodies: negro, blanco, rojo, beige y azul.
- Mismo encuadre, fondo neutro, iluminación y escala.
- Una imagen por combinación prenda + color.

Las diez imágenes están en `public/mockups/` y el mapa de rutas en
`public/mockups/manifest.json`. Las categorías del manifiesto son `camisetas` y
`hoodies`, y las claves de color son `black`, `white`, `red`, `beige` y `blue`.

### Flujo

1. El cliente inicia sesión y elige prenda, talla y color.
2. El sistema resuelve la prenda base correspondiente.
3. El cliente describe el diseño.
4. El servidor envía a Cloudflare el prompt y la base seleccionada como `input_image`.
5. El modelo devuelve el mockup completo.
6. El mockup se guarda como archivo privado y se muestra con URL firmada.
7. El cliente pide cambios o aprueba.

No hay una etapa separada de “generar solo el diseño” ni una etapa de overlay. El
mockup final es la salida del modelo sobre la prenda base.

### Cuota y costo

- **Por ahora no se implementa el contador de 3 generaciones por usuario al día.**
  La cuota se deja para una fase posterior; el límite gratuito de Cloudflare sigue
  evitando un cobro.
- Cloudflare permite aproximadamente 80–170 imágenes diarias según modelo y pasos;
  con 5–10 usuarios y varias propuestas, la cuota gratuita alcanza para la demo.
- Si la cuota gratuita se agota, se muestra un error; no se cambia a un modelo pagado.

### Riesgo de fidelidad

La prueba con una imagen de referencia mostró que el modelo puede cambiar la forma de
la prenda. Con bases predefinidas el punto de partida es consistente, pero hay que
probar cada base y ajustar el prompt. Si la fidelidad no alcanza, se corrige la base o
el prompt; **no se cambia silenciosamente a overlay**.

## 8. Riesgos

| Riesgo | Impacto | Mitigación | Responsable |
| --- | --- | --- | --- |
| Cuota gratuita de Cloudflare agotada | HU-14 bloqueada temporalmente | Contador de 3/día por usuario; error claro; no pagar | Kevin / Jhancarlos |
| Calidad o fidelidad del mockup con la base | HU-15 parcial | Probar cada base, ajustar prompt y encuadre; no cambiar a overlay sin decisión | Andrés / Emanuel |
| Enviar imágenes privadas sin política aprobada | Incumplimiento de privacidad | Usar datos sintéticos hasta aprobación; bloquear imágenes reales | Jhancarlos |
| Storage privado de clientes sin validar (C-08) | HU-13 bloqueada | Cerrar pruebas negativas antes de habilitar; si no, mover a Sprint 3 | Emanuel / Daniel |
| 27 puntos en 4 días hábiles | Sprint incompleto | Mantener alcance; priorizar Must, apoyar Should y revisar avance a diario | Emanuel / equipo |
| Catálogo con colores o categorías sin base | HU-15 no puede mostrar el mockup | Mapear solo combinaciones disponibles; si falta, mostrar un mensaje claro y no permitir personalizar | Andrés / Emanuel |
| Pedidos desactivados | HU-17 no puede asociar a un pedido real | Guardar snapshot y dejar punto de extensión; asociar en Sprint 3 | Emanuel / Jhancarlos |
| Vercel Hobby limita el cuerpo a 4,5 MB | Carga de 10 MB falla si pasa por el servidor | Carga directa firmada desde el navegador | Daniel |
| Generación asíncrona > 300 s | Función cortada | Texto síncrono; imagen asíncrona con estado y polling | Kevin |
| Provider devuelve contenido inapropiado | Mala experiencia / riesgo de marca | Validación básica y revisión del PO; no publicar automáticamente | Kevin / Emanuel |
| Datos de prueba en Supabase compartida | Contaminación | Datos sintéticos identificables y limpieza al cerrar | Daniel |
| Cuota no implementada en esta fase | Abuso o agotamiento de la cuota gratuita | Activar el contador de 3/día más adelante; el límite de Cloudflare evita cobro | Kevin / Jhancarlos |

## 9. Decisiones

### Resueltas

**D1. Proveedor de IA.**
Se usará **Cloudflare Workers AI** con `@cf/black-forest-labs/flux-2-klein-4b`, cuenta
gratuita y sin fallback pagado. La prueba técnica devolvió una imagen 1024×1024.
**Valida:** Jhancarlos; **ejecuta:** Kevin.

**D3. Definición del mockup.**
Se usan **prendas base predefinidas** y el modelo genera el **mockup completo** sobre la
base. No se genera un diseño aislado ni se usa overlay. **Decide:** Emanuel; **ejecuta:**
Andrés.

**D6. Autenticación.**
Crear el mockup exige sesión de cliente; el catálogo sigue público. **Decide:** Emanuel.

**D7. Cuota.**
Por ahora no se implementa el contador de 3 generaciones por usuario al día. Se activará
más adelante; el límite gratuito de Cloudflare evita un cobro. **Decide:** Jhancarlos.

**D8. Idea de diseño.**
No se puede enviar vacía; la interfaz informa el motivo. No se define un máximo por
ahora. **Decide:** Jhancarlos.

**D9. Imagen de referencia.**
Se acepta una imagen JPEG/PNG/WebP de hasta 10 MB, reemplazable mientras el borrador no
esté aprobado. **Decide:** Emanuel / Daniel.

**D14. Estrategia de ramas.**
Cada integrante trabaja en su rama y abre un Pull Request a `integracion`; no se hacen
commits directos a las ramas permanentes. **Decide:** Jhancarlos.

**D5. Alcance.**
No se recorta: se mantienen las 7 HU y los 27 puntos. El riesgo de tiempo se gestiona
con apoyo entre integrantes y checkpoints diarios. **Decide:** Emanuel / equipo.

### Bloqueantes

**D2. Privacidad de las imágenes de referencia.**
¿Se autoriza enviar imágenes de clientes al proveedor efectivo? Cloudflare declara
retención cero y no entrenamiento para Workers AI, pero deben revisarse los términos del
modelo y la política con el cliente. Mientras no haya respuesta, solo datos sintéticos.
**Recomendación:** no enviar imágenes reales en Sprint 2; usar imágenes sintéticas para
la demo. **Decide:** cliente / Jhancarlos.

**D4. Asociación al pedido en HU-17.**
Los pedidos están desactivados y pertenecen al Sprint 3. ¿Se acepta guardar el diseño
aprobado con un snapshot inmutable y asociarlo al pedido en Sprint 3? **Recomendación:**
sí; no crear una colección de pedidos en Sprint 2. **Decide:** Emanuel / Jhancarlos.

### No bloqueantes, pero necesarias antes de implementar

**D10. Comportamiento asíncrono.** ¿La generación se espera en la misma petición o se
consulta por estado? **Recomendación:** generación síncrona con el mensaje «Tu diseño se
está generando…»; si el proveedor tarda más de 60 s, pasar a estado con polling.

**D11. Inmutabilidad de la aprobación.** ¿Un administrador puede reabrir un diseño
aprobado? **Recomendación:** no; se inicia una personalización nueva y se conserva el
historial.

**D12. Despliegue de la demo.** ¿Se publica en Vercel Hobby con Cloudflare? ¿Quién
configura la cuenta de equipo y las variables? **Recomendación:** usar Cloudflare con
una cuenta de equipo; `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` solo en Vercel,
nunca tokens personales en el cliente.

**D13. Datos de prueba.** ¿Se pueden crear clientes, productos y propuestas sintéticas
en la base compartida? ¿Quién limpia? **Recomendación:** prefijo `sprint2-` y limpieza
al cierre.



## 10. DoR, DoD y evidencias

### Definition of Ready

- Los criterios de aceptación están claros y sin contradicciones.
- D2 y D4 están resueltas o tienen una decisión explícita de bloquear la historia.
- El modelo de datos y las reglas de acceso están revisados.
- Las prendas base y la cuenta de Cloudflare están identificadas y configuradas.
- La historia no depende de una funcionalidad que pertenece a otro sprint sin un plan
  de contingencia.

### Definition of Done

- Criterios de aceptación verificados en servidor y navegador.
- Pruebas unitarias o de integración cuando aplique; `pnpm test`, `pnpm typecheck` y
  `pnpm check` sin errores.
- Control de acceso por propietario y pruebas negativas.
- Migración revisada y aplicada con `DATABASE_URL_MIGRATIONS`; RLS y privilegios
  comprobados.
- Experiencia validada en escritorio y móvil.
- Código versionado, documentado y desplegado en el entorno correspondiente.
- Evidencia en `sprints/sprint-2/` y estado actualizado en Notion.

No se marca una HU como «Hecha» si el proveedor es un mock, si falta la validación de
UX o si el despliegue no existe. En esos casos queda «En validación» o bloqueada.

## 11. Primeras acciones

1. **Hoy:** confirmar D2 y D4; el alcance ya está cerrado en 7 HU y 27 puntos.
2. Congelar el modelo de datos y preparar la migración; no aplicarla sin revisión.
3. Crear las ramas por HU y la rama técnica del modelo de datos.
4. Empezar por HU-11/HU-12, que no dependen de la generación.
5. Cerrar el spike de Storage o decidir que HU-13 pasa a Sprint 3.
6. Cada integrante crea su cuenta de Cloudflare y carga las dos variables en `.env.local`;
   generar y validar el set inicial de prendas base.
7. Implementar `CloudflareAiProvider` y `MockAiProvider`; conectar la generación real
   cuando la privacidad y los términos estén aprobados.
8. Checkpoints: jueves 12 (base + HU-11/12), viernes 13 (go/no-go IA y Storage), lunes
   16 (QA) y martes 17 (revisión y cierre).

## 12. Trazabilidad

- Épica: `SPRINT-2`.
- Historias: `HU-11` a `HU-17`.
- Ramas propuestas:
  - `feat/HU-11-sprint-2-selection`
  - `feat/HU-12-HU-16-sprint-2-design-idea`
  - `feat/HU-13-sprint-2-reference-upload`
  - `feat/HU-14-sprint-2-ai-proposal`
  - `feat/HU-15-sprint-2-mockup`
  - `feat/HU-17-sprint-2-approval`
  - `branch/SPRINT-2-data-model` para la migración compartida
- Los PR deben incluir `SPRINT-2` y los IDs de las HU; no se atribuyen RF/RNF que no
  estén confirmados en la fuente.
