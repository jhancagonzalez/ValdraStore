# Sprint 2 — Personalización con IA

## Datos del sprint

- **Estado en Notion:** En construcción.
- **Periodo registrado:** 4 al 17 de noviembre de 2026.
- **Objetivo:** convertir la idea del cliente en una propuesta de diseño aprobada y visible sobre la prenda.
- **Alcance:** HU-11 a HU-17; 27 puntos de historia. No se recorta.
- **Prioridad:** 5 Must Have y 2 Should Have.
- **Módulo:** Personalización IA.
- **Fuente de verdad:** [Product Backlog — Valdra Store](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1).
- **Página del sprint:** [🎨 Sprint 2 — Personalización con IA](https://app.notion.com/p/3f6cd0bef36481edb33bf668a9274659).

La página del sprint en Notion está vacía: solo conserva las propiedades y el criterio
general. Los criterios de cada historia se transcriben en [TODO.md](TODO.md) y el plan
de ejecución está en [PLAN.md](PLAN.md).

## Resultado esperado

El recorrido completo debe quedar así:

1. El cliente inicia sesión y elige una prenda, talla y color.
2. Describe su idea y, opcionalmente, adjunta una imagen de referencia.
3. La IA genera una propuesta.
4. El cliente la ve sobre un mockup de la prenda.
5. Puede pedir cambios y recibir una nueva propuesta.
6. Aprueba una propuesta final, que queda registrada para el pedido.

El sprint está «Listo cuando» el cliente completa ese recorrido y el diseño aprobado
queda registrado para el pedido, según la página de Sprint 2.

## Historias y responsables registrados

| HU | Historia | Puntos | Prioridad | Responsable |
| --- | --- | --- | --- | --- |
| HU-11 | Seleccionar prenda, talla y color | 3 | Must Have | Jhancarlos Gonzalez |
| HU-12 | Ingresar la idea de diseño | 2 | Must Have | Jhancarlos Gonzalez |
| HU-13 | Cargar imagen de referencia | 3 | Should Have | Emanuel Giraldo |
| HU-14 | Recibir propuesta generada por IA | 8 | Must Have | Kevin Burgos |
| HU-15 | Ver la propuesta sobre un mockup | 5 | Must Have | Andrés Valencia |
| HU-16 | Solicitar modificaciones | 3 | Should Have | Daniel Cárdenas |
| HU-17 | Aprobar la propuesta final | 3 | Must Have | Emanuel Giraldo |
| **Total** | | **27** | **5 Must · 2 Should** | |

Las asignaciones se consultaron en Notion el 12 de noviembre de 2026. Si cambian allí,
este resumen debe actualizarse; Notion conserva la fuente de verdad.

## Tecnología de IA

- **Proveedor:** Cloudflare Workers AI.
- **Modelo:** `@cf/black-forest-labs/flux-2-klein-4b`.
- **Costo:** cuenta gratuita con 10.000 neuronos por día; sin tarjeta y sin fallback
  pagado. Si se supera la cuota, la petición falla.
- **Cuenta:** cada integrante crea su propia cuenta gratuita y guarda
  `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` en `.env.local`. Para la demo
  desplegada se usa una cuenta de equipo, no el token personal de un integrante.
- **Enfoque de mockup:** se usan 10 prendas base predefinidas: 5 camisetas y 5 hoodies
  en negro, blanco, rojo, beige y azul. El cliente elige prenda/talla/color, describe
  el diseño y Cloudflare genera el mockup completo tomando la base como referencia.
  Las imágenes y el mapa de rutas están en `public/mockups/` (`manifest.json`); la
  hoja de contacto de las diez bases está en
  `sprints/sprint-2/evidence/mockups-contact-sheet.jpg`.
- **No se usa** generación de un diseño aislado ni composición con CSS/Canvas: el
  mockup final sale del modelo a partir de la prenda base.
- **Autenticación:** para crear el mockup el cliente debe tener sesión iniciada; el
  catálogo sigue siendo público.
- **Cuota:** por ahora no se implementa el contador de 3 generaciones por usuario al
  día; se activará más adelante. El límite gratuito de Cloudflare sigue protegiendo el
  costo.
- **Estado visible:** mientras la imagen se genera, la interfaz muestra «Tu diseño se
  está generando…».

## Dependencias críticas

- **HU-14:** la prueba técnica con Cloudflare fue exitosa. Queda registrar la evidencia,
  revisar los términos del modelo y confirmar la política de privacidad con el cliente;
  no se permite fallback pagado.
- **HU-13 depende de C-08:** el flujo de carga privada de clientes no está cerrado.
  El spike validó el flujo de administrador y el acceso anónimo, pero faltan pruebas
  negativas, expiración efectiva, límites y borrado mediante Payload.
- **HU-17 depende de pedidos:** el plugin tiene pedidos desactivados y el módulo de
  pedidos pertenece al Sprint 3. Hay que decidir si se guarda el diseño aprobado con
  un snapshot y se asocia al pedido en Sprint 3.
- **HU-15:** las 10 bases ya están en `public/mockups/` con su manifiesto. Falta
  mapear los colores del catálogo a las claves del manifiesto y validar la fidelidad
  de cada base con el modelo.

## Estado del documento

Este README y el plan son una propuesta de trabajo para revisión del equipo. No
modifican Notion, no marcan historias como terminadas y no agregan criterios de
aceptación nuevos.
