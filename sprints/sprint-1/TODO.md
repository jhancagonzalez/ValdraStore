# TODO — Sprint 1

Las tareas de esta lista transcriben los criterios de aceptación y responsables del
[Product Backlog de Notion](https://app.notion.com/p/4ea53e76abd442718800c1c4aeba29e1),
consultado el 22 de octubre de 2026. Las diez historias figuran como «En construcción».
No se agregan subtareas técnicas que no estén en las fuentes.

## Jhancarlos Gonzalez — Developer Backend

### HU-01 — Registro de cliente · 3 puntos · Must Have · En construcción

Responsable registrado: Jhancarlos Gonzalez.

- [x] El formulario solicita nombre, correo y contraseña, y no permite enviar campos vacíos o con formato inválido.
- [x] Si el correo ya está registrado, el sistema lo informa y no crea una cuenta duplicada.
- [x] Al registrarse correctamente se crea la cuenta con rol cliente y la contraseña queda almacenada de forma protegida.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481469a1bd2b4776f544f).

### HU-02 — Inicio y cierre de sesión · 3 puntos · Must Have · En construcción

Responsable registrado: Jhancarlos Gonzalez.

- [x] Con credenciales válidas el usuario ingresa y es dirigido a la plataforma; con credenciales inválidas ve un mensaje de error sin revelar cuál dato falló.
- [x] Al cerrar sesión se invalida la sesión y las páginas privadas dejan de ser accesibles.
- [x] Un usuario sin sesión iniciada no puede acceder a las vistas que requieren autenticación.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481999ac1d06bc9215d2b).

### HU-06 — Consultar el catálogo · 3 puntos · Must Have · En construcción

Responsable registrado: Jhancarlos Gonzalez.

- [x] El catálogo lista las prendas disponibles con nombre, imagen y precio.
- [x] El listado es navegable (paginación o desplazamiento) y carga sin errores.
- [x] Las prendas deshabilitadas por el administrador no se muestran al cliente.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481a5adc2d063df72909d).

### HU-07 — Consultar características de una prenda · 2 puntos · Must Have · En construcción

Responsable registrado: Jhancarlos Gonzalez.

- [x] El detalle de la prenda muestra nombre, categoría, tallas, colores, material y precio.
- [x] Al seleccionar una talla o color, la información mostrada corresponde a la opción elegida.
- [x] Desde el detalle el cliente puede volver al catálogo sin perder su posición.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef364817c83dff4b541ad8bfa).

## Kevin Burgos — Developer Full Stack

### HU-03 — Recuperar contraseña · 3 puntos · Should Have · En construcción

Responsable registrado: Kevin Burgos.

- [ ] El usuario solicita la recuperación con su correo registrado y recibe un enlace o código para restablecer la contraseña.
- [ ] El enlace o código tiene vigencia limitada y deja de funcionar después de usarse.
- [ ] La nueva contraseña cumple las reglas de validación y permite iniciar sesión de inmediato.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481f0a554d04cb49aa0fc).

### HU-04 — Consultar y editar información personal · 2 puntos · Could Have · En construcción

Responsable registrado: Kevin Burgos.

- [ ] El usuario ve sus datos personales actuales en su perfil.
- [ ] Puede editar sus datos y los cambios se guardan solo si pasan la validación.
- [ ] Un usuario solo puede ver y modificar su propia información.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481e68e49f1aca0ad75d1).

## Daniel Cárdenas — Developer Backend

### HU-05 — Gestionar roles de usuario · 5 puntos · Must Have · En construcción

Responsable registrado: Daniel Cárdenas.

- [ ] El sistema maneja los roles cliente y administrador y asigna cliente por defecto al registrarse.
- [ ] Un cliente que intente acceder a una función administrativa es rechazado.
- [ ] El administrador puede cambiar el rol de un usuario y el cambio se aplica en su siguiente inicio de sesión.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef364819ba03cdacad51fdbe0).

## Emanuel Giraldo — Product Owner, Developer Frontend

### HU-08 — Visualizar diseños e imágenes de prendas · 3 puntos · Must Have · En construcción

Responsable registrado: Emanuel Giraldo.

- [ ] Cada prenda muestra sus imágenes y diseños asociados sin enlaces rotos.
- [ ] Las imágenes se ven correctamente en computador, tablet y móvil.
- [ ] Si una prenda no tiene imagen, se muestra una imagen por defecto.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481349b7fe87d84e69253).

## Andrés Valencia — Developer Frontend

### HU-09 — Buscar prendas · 2 puntos · Should Have · En construcción

Responsable registrado: Andrés Valencia.

- [ ] El buscador devuelve prendas cuyo nombre o categoría coincide con el término ingresado.
- [ ] La búsqueda no distingue mayúsculas ni tildes.
- [ ] Si no hay resultados, se muestra un mensaje claro en lugar de una página vacía.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481da9336c63283aa20cf).

### HU-10 — Filtrar catálogo · 3 puntos · Could Have · En construcción

Responsable registrado: Andrés Valencia.

- [ ] El cliente puede filtrar por categoría, talla, color y precio.
- [ ] Los filtros se pueden combinar y el resultado cumple todos los criterios aplicados.
- [ ] El cliente puede limpiar los filtros y volver al listado completo.

[Historia en Notion](https://app.notion.com/p/3f6cd0bef36481148e06f0610988acc5).
