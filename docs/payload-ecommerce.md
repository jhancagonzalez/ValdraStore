# Plugin oficial Ecommerce de Payload

## Estado de integración

- `@payloadcms/plugin-ecommerce@3.91.0` está fijado a la misma versión de Payload.
- El plugin está registrado en `payload.config.ts` mediante
  `src/plugins/ecommerce.ts`.
- Se habilitan las colecciones de productos y variantes para el catálogo inicial.
- El plugin usa `customers` como colección de clientes, con autenticación propia de
  Payload. El panel está restringido a la colección `admins`.
- La moneda predeterminada y única configurada es COP, con cero decimales para su
  presentación. No se han cargado productos ni precios.
- Carritos, direcciones, inventario, pedidos del plugin, transacciones y métodos de
  pago están desactivados. No se implementan checkout ni pagos.
- Payload mantiene `push: false`; la integración no crea ni modifica tablas hasta
  generar, revisar y aplicar una migración explícita.

## Capas y acceso

El plugin forma parte de la capa de lógica de Payload. Las páginas Next.js no reciben
acceso directo a PostgreSQL. El acceso de escritura al catálogo exige rol de
administrador; la lectura pública queda limitada a productos publicados. Los
controles se definen en servidor y el navegador no decide roles.

Las colecciones base de autenticación son `admins` y `customers`. La creación de
clientes permanece desactivada en este scaffold hasta implementar el flujo de la HU
correspondiente. El rol de administrador se asigna en el servidor; la creación del
primer administrador se permite únicamente en desarrollo local, con una variable
explícita y mientras no exista uno.

## Moneda COP

La configuración del plugin declara `COP`, nombre «Peso colombiano», símbolo `$` y
cero decimales de visualización. La cantidad de decimales sigue el dato CLDR usado
habitualmente para presentar COP. Esto no agrega una política de precios, impuestos o
pagos; el catálogo aún no tiene registros.

## Referencias oficiales

- [Plugin Ecommerce de Payload](https://payloadcms.com/docs/ecommerce/plugin)
- [Introducción a Ecommerce en Payload](https://payloadcms.com/docs/ecommerce/overview)
- [Opciones avanzadas del plugin](https://payloadcms.com/docs/ecommerce/advanced)
- [Instalación de Payload en Next.js](https://payloadcms.com/docs/getting-started/installation)
- [Unicode CLDR: datos de monedas](https://github.com/unicode-cldr/cldr-core/blob/master/supplemental/currencyData.json)

Para instalar dependencias, configurar Supabase localmente, revisar/aplicar
migraciones y ejecutar la app, sigue [docs/desarrollo.md](desarrollo.md).
