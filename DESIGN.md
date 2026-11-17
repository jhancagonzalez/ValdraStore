---
name: Valdra Store
description: Tienda de ropa editorial monocroma, con controles redondeados y mucho espacio en blanco.
colors:
  paper: "#ffffff"
  paper-soft: "#f4f4f4"
  paper-deep: "#e9e9e9"
  ink: "#111111"
  ink-soft: "#333333"
  muted: "#6b6b6b"
  muted-soft: "#8a8a8a"
  line: "#e6e6e6"
  line-strong: "#8a8a8a"
  danger: "#9c1c12"
  success: "#1d5c3a"
typography:
  hero:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6.2vw, 5.6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.065em"
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 4.8vw, 4rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.05em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  pill: "999px"
  media: "12px"
  card: "20px"
  hero: "28px"
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
    rounded: "{rounded.pill}"
    padding: "0 30px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.paper-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 30px"
    height: "48px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "12px"
    padding: "0 14px"
    height: "50px"
  product-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "9px"
  hero-card:
    backgroundColor: "{colors.paper-soft}"
    rounded: "{rounded.hero}"
    padding: "clamp(22px, 4vw, 56px)"
---

# Design System: Valdra Store

## Overview

**North Star: "Editorial limpio"**

La tienda se lee como una revista de moda: una sola idea visual por pantalla, imágenes grandes, mucho blanco y tipografía geométrica como estructura. La referencia compositiva es el comercio editorial contemporáneo (COS, Arket, Everlane, Acne Studios, Uniqlo), no un dashboard ni una landing promocional.

El color no es un recurso de marca. Toda la interfaz es negro, blanco y grises; el color aparece solo dentro de las fotografías de producto. La jerarquía se resuelve con escala, peso, espacio y líneas de un píxel, no con acentos cromáticos.

**Reglas base**

- Un solo acento visual: la tinta (`ink`). No hay color de marca ni degradados.
- Tarjetas e imágenes redondeadas, sombras muy suaves, bordes finos.
- Titulares en Space Grotesk 600/700 con tracking negativo; nunca serif.
- Micro-etiquetas en mayúscula y tracking amplio para contexto, no para párrafos.
- Botones tipo píldora, mínimo 48 px de alto y 44 px de área táctil.
- Mucho espacio negativo; una sección no compite con la siguiente.

## Colors

| Token | Valor | Uso |
| --- | --- | --- |
| Paper | `#ffffff` | Fondo de página y tarjetas |
| Paper soft | `#f4f4f4` | Superficie de la hero, imágenes, tarjetas secundarias |
| Paper deep | `#e9e9e9` | Bordes de imagen y hover de controles suaves |
| Ink | `#111111` | Texto principal, botones sólidos, selección |
| Ink soft | `#333333` | Texto de apoyo fuerte |
| Muted | `#6b6b6b` | Metadatos, descripciones, placeholders |
| Line | `#e6e6e6` | Hairlines decorativas |
| Line strong | `#8a8a8a` | Bordes de controles (3.4:1 mínimo) |

Los estados semánticos (`danger`, `success`) son la única excepción y solo aparecen en errores, confirmaciones o avisos. No se usan como decoración.

## Typography

**Familia única:** Space Grotesk (400/500/600/700).

- **Hero:** 600/700, `clamp(3rem, 6.2vw, 5.6rem)`, línea 0.9, tracking `-0.065em`.
- **Display:** 600, `clamp(2.4rem, 4.8vw, 4rem)`, línea 0.98.
- **Título de tarjeta:** 600, 14–16 px, tracking ligeramente negativo.
- **Cuerpo:** 400, 16 px, línea 1.55; máximo 60–70 caracteres por línea.
- **Etiqueta:** 600, 9–10 px, mayúscula, tracking 0.12–0.18em.
- **Precio:** 600, cifras tabulares.

No se usa serif, itálica decorativa ni texto con degradado.

## Layout

- Ancho máximo 1280 px; gutter fluido `clamp(20px, 4vw, 56px)`.
- Header sticky de 72 px: marca a la izquierda, navegación centrada, lupa, cuenta y menú a la derecha. En móvil, 64 px con logo a la izquierda y acciones a la derecha.
- Barra inferior fija solo en móvil (≤760 px): Inicio, Catálogo, Personalizar, Cuenta/Ingresar; 60 px por destino y padding inferior para no tapar contenido.
- Home: hero en tarjeta grande gris con texto a la izquierda, imagen de banner a la derecha en un marco 16:9 común y dots de carrusel; después catálogo en grid de 4 columnas (2 en móvil), cómo funciona y CTA final en tarjeta negra. Los banners son `imagen_banner1.png` e `imagen_banner2.png` en la raíz del proyecto y se importan estáticamente.
- Catálogo: header editorial, pills de categoría, selector de orden, filtros avanzados plegables, grid de 4 columnas en escritorio y 2 en móvil. La búsqueda vive en la lupa del header.
- Detalle: dos columnas (`1.12fr / 0.88fr`), galería sticky, panel de información y CTA de personalización; una columna por debajo de 900 px.
- Personalizador: stepper de círculos y líneas, tarjeta de imagen con flechas y miniaturas, panel derecho con swatches, tallas, filas de opciones y CTA; se apila en móvil.

## Shapes & Elevation

- `--radius-pill: 999px` en botones, chips y swatches.
- `--radius-sm: 12px` en inputs.
- `--radius: 18px` en cajas de información y diálogos.
- `--radius-card: 20px` en tarjetas de producto y bloques.
- `--radius-hero: 28px` en la hero y el CTA final.
- `--radius-media: 12px` en imágenes dentro de tarjetas.
- Sombras: `0 8px 24px -18px rgb(17 17 17 / .25)` y variantes; nunca sombras duras ni glassmorphism.

## Components

### Buttons

Píldora, altura mínima 48 px, padding horizontal 30 px, texto 14 px/500 en caja baja (no mayúsculas forzadas). Primario: fondo tinta y texto blanco, sombra suave. Secundario: fondo gris claro y texto tinta. Focus visible con anillo de 2 px; sobre fondo negro, anillo blanco.

### Inputs

Alto 50 px, radio 12 px, borde `line-strong`, fondo blanco, texto 16 px. Focus con borde tinta y outline visible. Errores con borde y mensaje semántico junto al campo.

### Product cards

Tarjeta blanca con borde `line`, radio 20 px y padding 9 px. Imagen 3:4 sobre `paper-soft`, radio 12 px. Nombre en 14–16 px/600, precio 12 px/600 a la derecha. En hover se muestra una segunda imagen si existe y una píldora “Ver prenda”. No hay iconos de favorito ni bolsa.

### Category pills

Píldoras con icono SVG de línea, 44 px de alto. Activas en tinta con texto blanco. En móvil hacen scroll horizontal; nunca provocan scroll de página.

### Personalizer

- Stepper con círculos de 34 px y líneas de 1 px; paso actual invertido.
- Tarjeta de imagen con radio 28 px exterior y flechas circulares de 48 px.
- Swatches de 44 px con punto de color real del producto.
- Filas de opción con icono circular, título y descripción, chevron a la derecha.
- CTA principal “Continuar: Diseñar →” a ancho completo del panel.

## Motion

- Transiciones de 150–250 ms; curva `cubic-bezier(0.22, 1, 0.36, 1)`.
- Hover y focus solo cambian color, borde, sombra o `transform` corto; nunca alteran el layout.
- `prefers-reduced-motion`: sin carrusel automático, sin desplazamientos y con transiciones desactivadas.
- Microinteracciones: hover de botones, reveal de secciones, thumb elástico en tabs (React Bits `RubberSegment`) y marca de estado de generación.

## Accessibility

- Contraste mínimo 4.5:1 en texto y 3:1 en bordes de control.
- Foco visible en todos los controles, incluidos los que están sobre fondo negro.
- Áreas táctiles de 44 px mínimo; iconos con `aria-label` y estado `aria-pressed`/`aria-current` cuando aplica.
- Diálogos con foco atrapado y retorno; formularios con errores junto al campo y `role="alert"`.
- Toasts con `aria-live="polite"`, sin robar foco, con cierre de 44 px.
- Imágenes con `next/image`, dimensiones o `fill` y `sizes` para evitar CLS.

## Do's and Don'ts

**Do**

- Usar tinta sobre papel como combinación por defecto.
- Mantener imágenes 3:4 en catálogo y 1:1 en el personalizador.
- Reservar mayúsculas con tracking para etiquetas de 10 px o menos.
- Separar bloques con hairlines y espacio, sin bordes dobles.
- Mantener una única acción primaria por pantalla.

**Don't**

- No introducir acentos cromáticos, degradados, glassmorphism ni sombras duras.
- No usar serif, itálicas decorativas ni titulares en caja alta.
- No devolver esquinas rectas a botones, chips o tarjetas.
- No poner corazones, bolsas, favoritos ni buscadores muertos en el header.
- No cambiar los textos visibles a inglés: la tienda habla español.
