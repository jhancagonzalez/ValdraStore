# Prendas base para mockups

Diez imágenes base para la personalización del Sprint 2:

- 5 camisetas: negra, blanca, roja, beige y azul.
- 5 hoodies: negro, blanco, rojo, beige y azul.

Todas son fotografías de producto, vista frontal, plano cenital, sin persona, sin
estampado, sin logo y con fondo gris claro. El modelo usado fue
`@cf/black-forest-labs/flux-2-klein-4b` de Cloudflare Workers AI, a 1024×1024.

El archivo `manifest.json` define la ruta de cada combinación. Las claves de color son
`black`, `white`, `red`, `beige` y `blue`; las categorías coinciden con el catálogo:
`camisetas` y `hoodies`.

Estas imágenes son genéricas y no contienen datos de clientes. El mockup generado para
un cliente se guarda aparte, como archivo privado, no se sobrescribe sobre estas bases.
