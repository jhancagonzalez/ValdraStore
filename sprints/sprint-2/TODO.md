# TODO — Sprint 2

Criterios transcritos del [Product Backlog de Notion](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1), consultado el 12 de noviembre de 2026. Las siete historias figuran como «En construcción». Este documento no agrega criterios nuevos.

## Resumen de responsables

| HU | Historia | Puntos | Prioridad | Responsable | Estado |
| --- | --- | --- | --- | --- | --- |
| HU-11 | Seleccionar prenda, talla y color | 3 | Must Have | Jhancarlos Gonzalez | En construcción |
| HU-12 | Ingresar una idea de diseño | 2 | Must Have | Jhancarlos Gonzalez | En construcción |
| HU-13 | Cargar imagen de referencia | 3 | Should Have | Emanuel Giraldo | En construcción |
| HU-14 | Recibir una propuesta generada por IA | 8 | Must Have | Kevin Burgos | En construcción |
| HU-15 | Ver la propuesta sobre un mockup | 5 | Must Have | Andrés Valencia | En construcción |
| HU-16 | Solicitar modificaciones | 3 | Should Have | Daniel Cárdenas | En validación (PR a `integracion`) |
| HU-17 | Aprobar la propuesta final | 3 | Must Have | Emanuel Giraldo | En construcción |
| **Total** | | **27** | **5 Must · 2 Should** | | |

Las asignaciones se consultaron en Notion el 12 de noviembre de 2026. Si cambian allí,
Notion conserva la fuente de verdad y este resumen debe actualizarse.

## Decisiones de esta fase

- Se mantienen las 7 HU y los 27 puntos; no se recorta el alcance.
- Crear el mockup exige sesión de cliente; el catálogo sigue público.
- La cuota de 3 generaciones por usuario al día no se implementa por ahora.
- La idea de diseño no puede enviarse vacía.
- La imagen de referencia es una imagen JPEG/PNG/WebP de hasta 10 MB.
- Mientras se genera, la interfaz muestra «Tu diseño se está generando…».
- Cada integrante trabaja en su rama y abre un PR a `integracion`.
- Las propuestas y su historial (HU-16) viven solo en el navegador; recargar la página
  los borra.
- Las peticiones del personalizador pasan por normas de uso antes de gastar cuota: reglas en
  `src/lib/design-guard.ts` (navegador y servidor) y moderación con Llama Guard 3 en el
  servidor. El color de la prenda se elige con la base, no se le pide a la IA.

## Jhancarlos Gonzalez — Scrum Master, Developer Backend

### HU-11 — Seleccionar prenda, talla y color · 3 puntos · Must Have

Responsable registrado en Notion: Jhancarlos Gonzalez.

- [ ] El cliente puede elegir una prenda del catálogo para personalizar.
- [ ] Debe seleccionar talla y color antes de continuar al siguiente paso.
- [ ] La selección queda guardada durante todo el proceso de personalización.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481a78ef0c2e48f5e96e8).

### HU-12 — Ingresar una idea de diseño · 2 puntos · Must Have

Responsable registrado en Notion: Jhancarlos Gonzalez.

- [ ] El cliente dispone de un campo para describir su idea de diseño y enviarla.
- [ ] No se puede enviar una descripción vacía; se informa el motivo.
- [ ] La idea enviada queda asociada a la prenda, talla y color seleccionados.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481c79971c6d45b15b480).

> **Ajustes de UI/UX hechos en la rama de HU-16 (Daniel Cárdenas, 2026-11-14).** Durante
> la prueba de HU-16 se encontró que el flujo de idea era difícil de entender: el botón
> «Personalizar» quedaba bloqueado sin explicación visible, los errores aparecían fuera
> de la vista y la página parecía quedarse cargando. Se ajustó: aviso visible en la
> barra (talla y sesión), avisos destacados con acción junto al botón de enviar, panel de
> progreso con tiempo y «Cancelar», límite de 200 s por petición y normas de uso antes de
> generar. Afecta el criterio 2 («se informa el motivo»). Los criterios de HU-12 los
> verifica y marca su responsable. Detalle en `evidence/HU-16.md`.

## Emanuel Giraldo — Product Owner, Developer Frontend

### HU-13 — Cargar imagen de referencia · 3 puntos · Should Have

Responsable registrado en Notion: Emanuel Giraldo.

- [ ] El cliente puede cargar una imagen en formato y tamaño permitidos.
- [ ] Si el archivo no es válido, el sistema lo rechaza con un mensaje claro.
- [ ] La imagen cargada queda disponible como entrada para la generación con IA.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481a9b15de96e3dac18a1).

### HU-17 — Aprobar la propuesta final · 3 puntos · Must Have

Responsable registrado en Notion: Emanuel Giraldo.

- [ ] El cliente puede aprobar una propuesta, y el sistema le pide confirmarlo.
- [ ] Al aprobar, el diseño final queda registrado y asociado al pedido.
- [ ] Un diseño aprobado ya no puede modificarse sin iniciar una nueva personalización.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef364814f96edd0d59bbde170).

## Kevin Burgos — Developer Full Stack

### HU-14 — Recibir una propuesta generada por IA · 8 puntos · Must Have

Responsable registrado en Notion: Kevin Burgos.

- [ ] El sistema envía la descripción (y la imagen, si existe) al servicio de IA y devuelve una propuesta de diseño.
- [ ] Mientras la IA procesa, se informa al cliente que la propuesta está en curso.
- [ ] Si el servicio de IA falla o no responde, se muestra un mensaje de error y el cliente puede reintentar.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481f5997dd67dc712b3ce).

## Andrés Valencia — Developer Frontend

### HU-15 — Ver la propuesta sobre un mockup · 5 puntos · Must Have

Responsable registrado en Notion: Andrés Valencia.

- [ ] La propuesta generada se muestra aplicada sobre la prenda, talla y color elegidos.
- [ ] El mockup se ve completo y legible en computador y móvil.
- [ ] El cliente puede ver la propuesta antes de aprobarla o pedir cambios.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef3648138bccbda70f4425177).

## Daniel Cárdenas — Developer Backend

### HU-16 — Solicitar modificaciones · 3 puntos · Should Have

Responsable registrado en Notion: Daniel Cárdenas.

- [x] El cliente puede escribir qué cambios desea sobre la propuesta.
- [x] Al enviar la solicitud se genera una nueva propuesta que se muestra en el mockup.
- [x] Se conserva el historial de propuestas del proceso para poder comparar.

Verificado el 2026-11-14 en escritorio y móvil. Evidencia en
[`evidence/HU-16.md`](evidence/HU-16.md).

[Historia en Notion](https://app.notion.com/p/3f6cd0bef364815a88bdd22ffe85bf52).

## Checklist de cierre por historia

Una historia no se marca como terminada hasta cumplir sus tres criterios y dejar evidencia:

- [ ] Criterios de aceptación verificados.
- [ ] Pruebas unitarias o de integración cuando aplique.
- [ ] Prueba manual en navegador (escritorio y móvil).
- [ ] Control de acceso por propietario y validación en servidor.
- [ ] Migración revisada y aplicada, si cambia el esquema.
- [ ] Evidencia registrada en `sprints/sprint-2/` y estado actualizado en Notion.

No se declaran criterios cumplidos por tener la pantalla o el endpoint creados.
