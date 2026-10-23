# Flujo de ramas de Valdra Store

## Ramas permanentes

- `main`: versión estable que se conserva lista para una entrega.
- `develop`: trabajo consolidado para la siguiente entrega.
- `integracion`: integración activa del equipo antes de consolidar en `develop`.

No hacer commits directos a `main`, `develop` ni `integracion`. Integrar mediante
Pull Requests para que el equipo pueda revisar los cambios.

## Ramas de trabajo

Crear cada tarea desde `integracion` y subirla al repositorio remoto:

- `feat/HU-XX-descripcion-corta`: cambio de una historia de usuario.
- `branch/SPRINT-1-descripcion-corta`: trabajo técnico sin una HU específica.

Usar identificadores de código en inglés y agregar los IDs HU/RF/RNF confirmados en
la rama y los commits. Para trabajo técnico, usar `SPRINT-0` o `SPRINT-1` como
trazabilidad; no atribuir requisitos sin verificar su fuente.

## Camino de integración

```text
feat/* o branch/*  ->  integracion  ->  develop  ->  main
```

1. Abrir un Pull Request de la rama de trabajo hacia `integracion`.
2. Revisar y corregir observaciones antes de integrar.
3. Cuando el conjunto esté integrado y verificado, abrir un Pull Request de
   `integracion` hacia `develop`.
4. Al preparar una entrega estable, abrir un Pull Request de `develop` hacia `main`.

Antes de solicitar revisión, ejecutar los chequeos configurados en el proyecto:
`pnpm check` y `pnpm typecheck`. Añadir otros comandos cuando la historia o tarea
aprobada lo requiera.

## Ejemplos

```powershell
git switch integracion
git pull
git switch -c feat/HU-01-customer-account
```

```powershell
git switch integracion
git pull
git switch -c branch/SPRINT-1-payload-access-roles
```

El propietario del repositorio debe configurar en GitHub las reglas de protección y
revisión de Pull Requests si quiere que la plataforma impida técnicamente los pushes
directos. Este documento define el flujo de trabajo; no activa esas reglas.
