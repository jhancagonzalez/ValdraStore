---
name: Valdra Store
description: Tienda de ropa editorial, monocroma y de alto contraste.
colors:
  ink: "#0d0d0d"
  ink-soft: "#333333"
  muted: "#6f6f6f"
  muted-soft: "#8a8a8a"
  paper: "#ffffff"
  paper-soft: "#f4f4f2"
  line: "#e5e5e2"
  line-strong: "#8a8a86"
  danger: "#9c1c12"
  danger-bg: "#fdf2f0"
  danger-line: "#e9c8c4"
  success: "#1d5c3a"
  success-bg: "#f1f7f3"
  success-line: "#c6ddcd"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 7vw, 5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  display-sm:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 11vw, 3.25rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  lead:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.3
  search:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.2vw, 1.125rem)"
    fontWeight: 400
    letterSpacing: "-0.01em"
  price:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  price-lg:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
  small:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  caption:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: 1.5
  label:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.14em"
  micro:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.14em"
rounded:
  none: "0"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 26px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "#2b2b2b"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 26px"
    height: "46px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "46px"
  product-card:
    backgroundColor: "{colors.paper-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  option-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "44px"
---

# Design System: Valdra Store

## Overview

**Creative North Star: "The Editorial Rail"**

La tienda se comporta como una galería: pared blanca, prenda al centro y tipografía como único ornamento. No hay color de marca, ni sombras, ni superficies elevadas; la jerarquía se construye con escala tipográfica, espacio en blanco y líneas de un píxel. El resultado debe sentirse como una tienda de ropa contemporánea de gama alta, no como un panel de administración ni como una landing generada.

La composición es asimétrica y respira: titulares alineados a la izquierda, rejillas que crecen con el viewport, sidebar de filtros de 232 px y una única columna de contenido centrada a 1240 px. Cada pantalla tiene un solo gesto visual fuerte —el titular del hero, la imagen del producto, el contador del catálogo— y el resto se mantiene en silencio.

La referencia emocional es el catálogo impreso: portada tipográfica, fichas de producto con la imagen mandando, precios discretos y micro-etiquetas en mayúscula que ordenan sin competir. Todo lo interactivo se reconoce por forma y posición, nunca por color.

**Key Characteristics:**
- Monocromo estricto: blanco, tinta y grises; el color solo aparece en estados de error o éxito.
- Cero radio de esquina, cero sombras, cero degradados.
- Tipografía grande con tracking negativo y micro-etiquetas en mayúscula con tracking amplio.
- Imágenes 3:4 como unidad de composición del catálogo.
- Líneas de 1 px y espacio negativo como único sistema de separación.

## Colors

Paleta neutra de alto contraste: un negro casi puro sobre blanco, con dos grises para jerarquía secundaria y un gris de línea que se oscurece cuando debe leerse como control.

### Primary
- **Ink** (#0d0d0d): texto principal, botones sólidos, chips seleccionados, bordes de foco y fondo del botón primario. Es el único "color de marca".
- **Ink Soft** (#333333): navegación y texto secundario que debe seguir leyéndose con fuerza.

### Neutral
- **Paper** (#ffffff): fondo de página, de campos y de botones secundarios.
- **Paper Soft** (#f4f4f2): fondo de imágenes de producto, miniaturas y placeholders; nunca se usa como tarjeta con borde.
- **Muted** (#6f6f6f): descripciones, etiquetas, metadatos y texto de apoyo. 5.02:1 sobre blanco.
- **Muted Soft** (#8a8a8a): estados hover de bordes y texto deshabilitado.
- **Line** (#e5e5e2): separadores horizontales, bordes de sección y hairlines decorativas.
- **Line Strong** (#8a8a86): borde de controles (inputs, selects, chips, botón secundario). 3.4:1 sobre blanco para no depender del relleno.

### Named Rules
**The Ink-Only Rule.** El color saturado está prohibido en la interfaz. La única excepción son los estados semánticos de error (`#9c1c12` sobre `#fdf2f0`) y éxito (`#1d5c3a` sobre `#f1f7f3`).

**The Readable Border Rule.** Un borde que identifica un control nunca baja de 3:1 contra el fondo. `Line` es decorativo; `Line Strong` es funcional.

## Typography

**Display Font:** Space Grotesk (con `system-ui, sans-serif` de respaldo)
**Body Font:** Space Grotesk (misma familia, un solo registro)

**Character:** Una grotesca geométrica con detalles abiertos. En tamaños grandes y tracking negativo se vuelve editorial; en 11 px con tracking amplio funciona como etiqueta de catálogo.

### Hierarchy
- **Display** (500, `clamp(2.6rem, 7vw, 5rem)`, 0.98): titular del hero, máximo 15 caracteres por línea, `text-wrap: balance`.
- **Display Small** (500, `clamp(2.25rem, 11vw, 3.25rem)`, 0.98): el mismo titular por debajo de 640 px.
- **Headline** (500, `clamp(1.75rem, 3.2vw, 2.75rem)`, 1.05): títulos de página y nombre de producto en el detalle.
- **Title** (500, 15 px, 1.3): nombre de prenda en la tarjeta del catálogo.
- **Body** (400, 16 px, 1.6): párrafos y descripciones, entre 46 y 75 caracteres por línea.
- **Lead** (400, 17 px, 1.6): entradilla del hero, un punto por encima del cuerpo para separarla sin gritar.
- **Search** (400, `clamp(16px, 1.2vw, 18px)`, tracking -0.01em): único campo que sube de 16 px, para dar peso editorial al buscador.
- **Price** (600, 14 px en tarjeta; 500, 20 px en detalle): el precio siempre se lee como dato, nunca como titular.
- **Small** (400, 13 px): ayudas, resúmenes de variante y enlaces de formulario.
- **Caption** (400, 12 px): pies de galería y mensajes de error de campo.
- **Label** (500, 11 px, tracking 0.14em, mayúsculas): etiquetas de formulario, navegación, categorías y contadores.
- **Micro** (500, 10 px, tracking 0.14em, mayúsculas): badges sobre imagen y pie de página.

### Named Rules
**The Two-Tracking Rule.** El tracking solo tiene dos valores: negativo y apretado en display (`-0.035em`), amplio en etiquetas (`0.14em`). No existe un punto intermedio.

**The No-Gradient-Text Rule.** El énfasis se logra con tamaño y peso. El texto nunca lleva degradado ni contorno.

## Layout

Contenedor máximo de 1240 px con gutter de 24 px (18 px por debajo de 640 px). Header sticky de 64 px con hairline inferior; en móvil se parte en dos filas (marca arriba, navegación abajo) y pasa a unos 100 px.

El catálogo usa una rejilla de dos columnas: sidebar de filtros de 232 px a la izquierda y resultados fluidos, con separación de `clamp(32px, 4vw, 56px)`. La búsqueda ocupa una fila completa sobre la rejilla, subrayada por una línea de 1 px que abarca input y botón. La sidebar es sticky bajo el header y se apila encima de los resultados por debajo de 860 px.

La rejilla de producto es `repeat(auto-fill, minmax(260px, 1fr))` con separación de 40 px entre filas y 24 px entre columnas; las imágenes mantienen 3:4 fijas para que no haya saltos de layout. El detalle usa dos columnas (`1.15fr / 0.85fr`) con el panel de metadatos sticky; se apila a una columna por debajo de 900 px.

Ritmo vertical: 24 px entre título y subtítulo, 32–48 px antes de la búsqueda, 40 px entre bloques, 64 px antes de la paginación. Los formularios respiran con 20 px entre campos y 32 px hasta el botón.

### Named Rules
**The One-Column Rule.** Cada pantalla tiene una sola columna de lectura. Nada se reparte en dos columnas de contenido salvo el detalle de producto y su rejilla de catálogo.

## Elevation & Depth

El sistema es plano. No hay `box-shadow`, ni `backdrop-filter`, ni superficies elevadas. La profundidad se comunica con tres recursos: la línea de 1 px que separa bloques, el cambio de superficie (`Paper` frente a `Paper Soft`) y el espacio negativo. El único movimiento de profundidad es el zoom de 3.5 % de la imagen de producto al hover, con una curva `cubic-bezier(0.22, 1, 0.36, 1)`.

### Named Rules
**The Flat-By-Default Rule.** Si un elemento necesita una sombra para distinguirse, el problema es de jerarquía o de espaciado, no de profundidad.

## Shapes

Todo es rectangular. El radio es 0 en botones, campos, tarjetas, chips y badges. Los bordes son de 1 px; el único borde de 2 px es el anillo de foco (`outline`), con 3 px de separación. Las imágenes usan 3:4 (catálogo, detalle y miniaturas) y se recortan con `object-fit: cover`. No hay círculos, píldoras ni cápsulas.

## Components

### Buttons
- **Shape:** rectángulo, radio 0, altura mínima 46 px, padding 0 26 px.
- **Primary:** fondo `Ink`, texto `Paper`, 11 px/600 con tracking 0.14em en mayúsculas.
- **Hover / Focus:** el primario pasa a `#2b2b2b`; el foco usa el anillo global de 2 px con offset 3 px.
- **Secondary:** fondo transparente, borde `Line Strong`, texto `Ink`; al hover el borde pasa a `Ink`.
- **Disabled:** opacidad 0.45 y cursor `not-allowed`.

### Chips (variantes de talla y color)
- **Style:** borde `Line Strong`, radio 0, altura 44 px, texto 11 px en mayúscula.
- **State:** seleccionado invierte a fondo `Ink` y texto `Paper`; el hover solo oscurece el borde. `aria-pressed` es obligatorio.

### Cards / Containers
- **Corner Style:** 0.
- **Background:** sin fondo de tarjeta; la imagen vive sobre `Paper Soft`.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** ninguno; la separación la da el espacio.
- **Internal Padding:** la información arranca 14 px debajo de la imagen.

### Inputs / Fields
- **Style:** altura 46 px, borde 1 px `Line Strong`, fondo `Paper`, radio 0, texto 16 px (evita el zoom de iOS).
- **Focus:** borde `Ink` más el anillo global de foco; nunca se elimina el outline.
- **Error:** borde `Danger` y mensaje a 12 px; el bloque de error usa fondo `#fdf2f0`.

### Navigation
- **Style:** 11 px, mayúsculas, tracking 0.14em, color `Ink Soft`; el CTA "Crear cuenta" es un botón sólido `Ink`.
- **Hover / Focus:** subrayado con offset 0.5em; foco con anillo global.
- **Mobile:** dos filas, marca arriba y enlaces distribuidos abajo, con hairline superior.

### Catalog Search
Barra completa de 50 px con regla inferior de 1 px que abarca input y botón; el input crece con el contenedor y usa 16–18 px, el botón "Buscar" mide 112 px y comparte altura. El foco del contenedor oscurece la regla.

### Filter Sidebar
Columna de 232 px con título "Filtros" en 11 px y hairline inferior, campos apilados a 20 px, precios mínimo/máximo emparejados en tablet y móvil, y acciones separadas por otra hairline. Es sticky y se apila arriba de los resultados por debajo de 860 px.

### Marquee (portada)
Banda de borde a borde con hairlines superior e inferior, 12 px en mayúscula con tracking 0.16em y separadores tipográficos "✦". Seis copias del mismo grupo se desplazan 32 s en bucle lineal (desplazamiento del 50 % del ancho); solo la primera copia es accesible y el resto va `aria-hidden` con `tabIndex={-1}`. Se pausa al hover o al enfocar y se detiene con `prefers-reduced-motion`.

### Footer
Hairline superior y tres columnas: marca con una nota de una línea, navegación (catálogo, cuenta, términos) e Instagram en el extremo. Debajo, una fila legal separada por otra hairline con el copyright y la etiqueta "Prototipo académico". En móvil pasa a una columna y la fila legal se mantiene a dos extremos.

### Route progress
Línea fija de 2 px en el borde superior, en `Ink`, con un segmento del 32 % que recorre el ancho en 1.1 s. Se activa al pulsar un enlace interno o al enviar un formulario GET y se apaga cuando la ruta termina de cargar; con `prefers-reduced-motion` el segmento ocupa el 100 % y no se anima. Nunca bloquea clics (`pointer-events: none`) y es `aria-hidden`.

## Do's and Don'ts

### Do:
- **Do** usar `Ink` sobre `Paper` como combinación por defecto; cualquier otro par debe justificar su contraste.
- **Do** mantener las imágenes en 3:4 y `object-fit: cover`.
- **Do** reservar las mayúsculas con tracking para etiquetas de 11 px o menos.
- **Do** separar bloques con hairlines de 1 px y espacio, no con tarjetas.
- **Do** conservar el anillo de foco de 2 px en todos los controles, incluidos los que tienen borde propio.

### Don't:
- **Don't** introducir degradados, sombras, glassmorphism ni animaciones de entrada por sección.
- **Don't** usar color de acento para marcar selección, hover o marca; la selección se invierte a negro.
- **Don't** redondear esquinas ni convertir botones en píldoras.
- **Don't** poner una etiqueta pequeña encima de un titular (kicker); el titular se sostiene solo.
- **Don't** reducir el borde de un control por debajo de 3:1 de contraste.
- **Don't** cambiar los textos de interfaz a inglés: la tienda habla español.
