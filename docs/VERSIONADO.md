# Versionado de Admin y CRM

La version visible de la aplicacion se muestra siempre en el sidebar de `admin` y `agents`/CRM.

## Regla

- Cambios menores: `v1.<numero total de commits>`.
- Cambios mayores: subir el mayor en `app-version.json` (`2`, `3`, etc.).

## Generacion

El archivo `scripts/write-app-version.js` toma el mayor desde `app-version.json` y el numero de commit desde Git:

```bash
node scripts/write-app-version.js
```

Tambien se ejecuta automaticamente antes de `npm start` y `npm run build` dentro de `admin/` y `agents/`.

Los archivos generados son:

- `admin/src/config/appVersion.js`
- `agents/src/config/appVersion.js`

No editarlos a mano; para un cambio mayor, editar solo `app-version.json`.
