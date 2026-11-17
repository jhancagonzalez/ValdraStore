# HU-16 — Prueba de conservación: pandas y árboles

**Estado final:** integrado en el código local por petición posterior del usuario.
La sección «Integración y limpieza final» al final de este informe describe el
resultado vigente; las secciones de spike documentan las etapas previas.

Fecha: 15 de noviembre de 2026. Prueba solicitada y autorizada por el usuario en
esta conversación. Alcance: comparar alternativas con datos sintéticos; no integrar
el flujo en producción ni cambiar las decisiones generales de privacidad o costo.

## Ejecución real

Se ejecutaron tres generaciones con el modelo existente
`@cf/black-forest-labs/flux-2-klein-4b`, sin reintentos ni fallback:

1. Dos pandas impresos sobre la camiseta base negra.
2. Edición de ese mockup para agregar tres árboles debajo, pidiendo conservar pandas
   y camiseta. La salida borró los pandas, produjo dos árboles y cambió la camiseta.
3. Tres árboles aislados en fondo blanco, para probar una capa adicional.

El programa comparó después dos composiciones: recortar la respuesta de edición
dentro de una máscara, y quitar el fondo de los árboles aislados para superponerlos
sobre el original. Se revisaron visualmente los resultados.

## Qué fue manual y qué fue automático

- El operador redactó los prompts de prueba, eligió la zona inferior después de ver
  dónde habían quedado los pandas y lanzó las etapas. La zona se fijó en el script.
- Cloudflare generó las tres imágenes. El script quitó el fondo claro conectado al
  borde, redujo el halo, ajustó la escala, compuso las imágenes y midió las diferencias.
- No se implementaron interpretación automática de peticiones, detección de pandas,
  selección inteligente de máscaras, integración con la pantalla ni deformación por
  pliegues. No es un editor automático general terminado.
- La capa probada contiene solo los árboles nuevos. No se extrajo ni se reconstruyó
  un estampado completo editable a partir de la fotografía de los pandas.

## Resultados

Zona autorizada en una imagen de 1024 × 1024: izquierda 317, arriba 594,
ancho 389, alto 225 píxeles. Los pandas quedan fuera de esa zona.

| Variante | Píxeles cambiados fuera de la zona | Resultado visual |
| --- | ---: | --- |
| Edición directa completa | 960.912 de 961.051 | Borra pandas y cambia camiseta |
| Edición limitada por máscara | 0 | Conserva pandas, pero deja parche de tela y árboles cortados |
| Árboles como capa independiente | 0 | Conserva pandas y camiseta; añade tres árboles sin parche rectangular |

La métrica compara píxeles RGB decodificados, sin tolerancia. El valor de la edición
directa no distingue recompresión de cambios semánticos; el borrado de pandas se
confirmó visualmente. Ambas composiciones tienen aserciones que exigen cero cambios
exteriores y algún cambio interior.

La capa independiente es la mejor de estas variantes para **añadir elementos en
espacio libre**. No demuestra que cualquier petición pueda resolverse así. Cambiar
la expresión de un panda, sustituir una parte de él, solapar árboles con sus patas o
armonizar estilos requiere otra estrategia y validación. El recorte de fondo solo
cubre fondo claro; no segmenta fondos complejos. Aún pueden aparecer halos finos y
el nuevo dibujo no adapta automáticamente textura, perspectiva ni pliegues.

## Flujo de producto propuesto

Para una adición, el cliente marca la zona en la pantalla existente y escribe el
cambio. El servidor genera únicamente el elemento nuevo y compone su capa en esa
zona sobre la versión anterior; devuelve una versión nueva al historial. Requiere
implementar clasificación de la petición, manejo de fondos no recortables y pruebas
de estilo/escala. Una solicitud que modifica elementos existentes debe tener un
camino distinto; no se transforma silenciosamente en una adición.

Esta propuesta aún no está conectada a la aplicación y no marca HU-16 como terminada.
C-17 y la política de datos siguen pendientes; solo se enviaron imágenes sintéticas.

## Reproducción y comprobaciones

Script: `scripts/test-local-edit.mjs`. Etapas:

```powershell
node scripts/test-local-edit.mjs original
node scripts/test-local-edit.mjs edit
node scripts/test-local-edit.mjs trees
node scripts/test-local-edit.mjs compare
```

Las generaciones existentes se reutilizan sin llamadas. La última etapa es local.
Salidas y métricas: `test-results/HU-16-panda-edit/` (ignorado por Git).
Comparación visual: `comparison.png`. Las credenciales permanecen en `.env.local`;
no se guardan en resultados ni se imprimen respuestas crudas del proveedor.

`pnpm check` se ejecutó y falló con 153 errores y un aviso en el árbol existente,
incluidos problemas de finales de línea en archivos ajenos al spike. No se aplicó
formato global. El script se comprobó por separado con Biome. Las 22 pruebas de
revisión, selección e historial ejecutadas durante el diagnóstico previo pasaron;
no constituyen validación del flujo de producto propuesto.

## Segunda prueba solicitada: balón y cancha

El usuario pidió generar un balón de fútbol y luego añadir una cancha debajo.
Se ejecutaron tres generaciones adicionales de FLUX Klein 4B: mockup original con
balón, edición directa del mockup y cancha aislada. Se conservó la misma estrategia
de comparación y no se conectó a la aplicación.

- La edición directa sustituyó el mockup por una escena con un balón tridimensional
  y una cancha; desapareció la camiseta y el balón ya no era el original.
- El recorte de esa salida preserva el exterior, pero trae un parche de fondo claro.
- La cancha como capa conserva el balón y la camiseta y permite añadir las líneas
  del campo sin reconstruir la tela. Las aserciones verificaron cero diferencias
  fuera del área de composición; dentro cambiaron 72.225 píxeles.
- Zona elegida por el operador tras ver el balón: izquierda 317, arriba 502,
  ancho 389, alto 225, en la imagen de 1024 × 1024. No se detectó automáticamente
  la posición del balón ni se interpretó la petición libre del cliente.
- Se detectó una limitación adicional: el fondo blanco y las líneas blancas de la
  cancha estaban conectados. El recorte por flood fill borraba las marcas. Para
  este caso específico, el script conserva el rectángulo delimitado por píxeles
  verdes, incluidas sus líneas blancas. Este tratamiento se ejecuta por código,
  pero la elección de esta heurística fue una decisión del operador para esta
  prueba; no es segmentación universal ni clasificación automática de solicitudes.
- El nuevo estampado conserva un aspecto plano; no se adapta aún a pliegues y
  perspectiva. El caso demuestra conservación y adición, no un editor completo.

Reproducción: usar las etapas `original`, `edit`, `addition` y `compare` con el
argumento final `soccer`, por ejemplo:

```powershell
node scripts/test-local-edit.mjs original soccer
node scripts/test-local-edit.mjs edit soccer
node scripts/test-local-edit.mjs addition soccer
node scripts/test-local-edit.mjs compare soccer
```

Salidas: `test-results/HU-16-soccer-edit/`. Resultado final: `06-layered-edit.png`;
comparación: `comparison.png`. Se revisaron ambas imágenes visualmente.
Biome sobre el script terminó sin errores. Se repitió `pnpm check` con reporte
resumido: sigue fallando por los mismos 153 errores de formato y un aviso previos.

## Integración y limpieza final

El usuario autorizó integrar el resultado, crear un cliente sintético para la
prueba y retirar el código anterior. Se creó un cliente con rol `customer`
mediante la API de Payload y se inició sesión desde el formulario visible. No se
usaron credenciales del usuario ni se aprobaron diseños o pedidos. El cliente de
prueba permanece disponible en la sesión local; sus credenciales no se versionan.

El flujo vigente es: propuesta inicial → pedir cambios → marcar zona libre →
describir solo el elemento nuevo → generar elemento aislado → recortar fondo
admisible → componer en el servidor → mostrar una versión nueva en el historial.
El original no se envía al generador de la adición. Se conserva en el servidor
para componer el resultado; fuera de la selección sus píxeles permanecen iguales.
Si no se puede separar el fondo o la petición modifica un objeto existente, se
devuelve un error sin regenerar la prenda como fallback. El texto se añade con una
fuente y ya no restaura una porción de tela base.

Se eliminaron la llamada a Stable Diffusion 1.5 Inpainting, los prompts/ramas de
inpainting y rediseño completo de revisiones, el umbral de zona grande, el servicio
de máscara/comparación antiguo y sus pruebas, los recortes de contexto que dejaron
de usarse y la restricción de mangas ligada al modelo retirado. Los modos antiguos
de la API se rechazan con 400 antes de llamar a modelos. La pantalla conserva
generación inicial, texto e historial y ofrece selección libre por arrastre,
movimiento mediante botones y controles de ancho/alto, además de atajos.

### Prueba real con hoodie

En el navegador visible, con sesión del cliente sintético:

1. Se eligió hoodie beige, talla M, y se generó una montaña geométrica azul.
2. Una primera adición colocó el sol debajo del hoodie por una selección incorrecta.
   No se consideró válida y se conservó como versión descartada del historial.
3. Se volvió a la versión original, se eligió «Detalle superior» y se añadió un sol
   amarillo. La versión 3 parte de la versión 1. El usuario validó el resultado en
   pantalla y pidió integrarlo al código.
4. La comparación de los archivos reales de esas dos versiones encontró **6.087
   píxeles modificados dentro** de la selección y **0 fuera**, en 1024 × 1024.
   La montaña y la prenda de la primera propuesta permanecen intactas.

La prueba previa de cancha dentro del flujo real conservó balón y camiseta pero
añadió texto no solicitado. Se reforzó el prompt para excluir letras y rótulos;
la prueba posterior de sol no presentó ese problema. Esto es una mitigación, no
una garantía de adherencia perfecta del modelo a cualquier instrucción.

Archivos locales ignorados por Git: `test-results/HU-16-hoodie-live/original.jpg`,
`revised-corrected.png`, `hoodie-ui.jpg` y `metrics.json`.

### Validación final

- 61 pruebas pasaron en los cinco archivos afectados: adición, texto, historial,
  selección y normas de uso. Incluyen preservación de píxeles, líneas blancas de
  una cancha, fondos complejos rechazados y prevención de parches blancos entre
  elementos separados.
- TypeScript terminó sin errores. Biome en los archivos cambiados terminó sin
  errores. El chequeo global equivalente sigue señalando **141 errores de formato
  preexistentes y un aviso**, fuera de los archivos modificados; no se aplicó un
  formato masivo. El último intento de `pnpm check` no pudo resolver la versión del
  gestor por acceso al registro; por eso también se ejecutó directamente el Biome
  instalado en `node_modules` y se conservó el log local.
- La ruta devolvió 401 sin sesión y 403 con origen ajeno. Con el cliente sintético,
  ambos modos retirados devolvieron 400.
- No se ejecutaron migraciones ni SQL, no se desplegó y no se marcó HU-16 como Done.
  C-17 no queda cerrada. La conservación comprobada corresponde a la primera
  propuesta generada, no a la fidelidad entre esa propuesta y la prenda base.

La posición de un elemento depende de la zona marcada. Puede tapar contenido
existente dentro de ella; no hay segmentación automática de los dibujos originales.
Los recortes de fondo son limitados y no se simulan automáticamente pliegues ni
perspectiva. Cambiar la expresión de un panda, quitar un objeto o rehacer un estilo
completo requiere otra estrategia; este camino no lo presenta como resuelto.
