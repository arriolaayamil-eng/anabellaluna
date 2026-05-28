Stack MERN: El proyecto es una web app moderna basada en MongoDB, Express, React y Node.js. Todas las tecnologías deben mantenerse actualizadas y alineadas con las mejores prácticas.

Calidad de Código: El código debe ser limpio, legible, modular y sin deuda técnica. No se toleran atajos ni “workarounds” que comprometan la escalabilidad.

Estilo Profesional: Sigue principios SOLID, patrones de diseño y arquitectura limpia. Cada módulo debe ser mantenible y extensible.

Documentación: Cada módulo, función crítica y flujo debe estar documentado. Mantén comentarios claros y actualizados.

Testing: Pruebas unitarias y de integración son obligatorias. La cobertura debe ser alta y las pruebas deben reflejar casos reales.

Performance: Optimiza tanto el frontend como el backend para tiempos de respuesta mínimos. Usa herramientas de profiling y no dejes cuellos de botella.

Seguridad: Aplica prácticas de seguridad actuales. Protege endpoints, datos y autenticación.

Actualización Continua: Mantén dependencias al día. Revisa actualizaciones de librerías y frameworks periódicamente.

UX/UI: La interfaz debe ser moderna, fluida y accesible. Prioriza diseño responsivo y experiencia de usuario intuitiva.

Despliegue y CI/CD: Automatiza pipelines de integración continua y despliegue continuo. Todo commit en main debe ser desplegable.

Escalabilidad: Diseña la app para escalar horizontalmente. Estructura el código y la base de datos pensando en crecimiento.

Logs y Monitoreo: Asegúrate de que existan logs claros y monitoreo activo. La observabilidad es clave.

Responsabilidad Profesional: Piensa como un desarrollador profesional: sin excusas, sin atajos, sin deuda, siempre con visión a largo plazo.

Innovación: Siempre busca soluciones modernas y mejores prácticas. No te quedes con lo básico.

---

## Checklist obligatorio antes de commit/push

### 0. Versionado visible en Admin y CRM

- Cada cambio debe quedar visible en el sidebar de Admin y CRM con la version generada por Git.
- Cambios menores: mantener `app-version.json` con `"major": 1`; la version se muestra como `v1.<numero total de commits>`.
- Cambios mayores: subir `app-version.json` a `"major": 2`, luego `3`, y asi sucesivamente.
- `npm start` y `npm run build` en `admin/` o `agents/` regeneran automaticamente `admin/src/config/appVersion.js` y `agents/src/config/appVersion.js`.
- Si se necesita regenerar manualmente antes de commitear, ejecutar `node scripts/write-app-version.js` desde la raiz del repo.

### 1. ESLint — Errores comunes a evitar

- **`quote-props`**: No usar comillas en propiedades de objetos a menos que sea estrictamente necesario (ej: `baños: value` en vez de `'baños': value`).
- **`react/jsx-indent`**: Al envolver JSX en fragmentos (`<>...</>`), condicionales (`{cond && (...)}`), o cualquier wrapper, **re-indentar todo el contenido interior** con +2 espacios respecto al tag padre. Nunca dejar contenido al mismo nivel de indentación que el wrapper.
- **`react/jsx-wrap-multilines`**: Los paréntesis alrededor de JSX multi-línea deben estar en líneas separadas:
  ```jsx
  // ✅ Correcto
  {formStep === 1 && (
    <>
      <div>...</div>
    </>
  )}

  // ❌ Incorrecto
  {formStep === 1 && (<>
    <div>...</div>
  </>)}
  ```
- **`react/jsx-closing-tag-location`**: El tag de cierre debe coincidir con la indentación del tag de apertura.
- **`no-unused-vars`**: Es un ERROR (no warning). Nunca dejar variables o imports sin usar. Nunca remover comentarios `eslint-disable` sin verificar que la regla está desactivada en `.eslintrc.js`.

### 2. Build local obligatorio

Antes de cada `git commit` y `git push`, ejecutar **siempre** los builds locales de ambas apps:

```bash
# En agents/
npm run build

# En admin/
npm run build
```

Ambos builds deben mostrar **"Compiled successfully."** con **cero errores** antes de proceder al push.

### 3. Reglas de indentación JSX

- La base de indentación es **2 espacios** por nivel.
- Cada nivel de anidamiento JSX (`<div>`, `<>`, `<form>`, condicionales) agrega 2 espacios.
- Al mover bloques de JSX dentro de nuevos wrappers (fragmentos, condicionales, componentes), **siempre** re-indentar todo el bloque movido.
- Verificar visualmente que los tags de apertura y cierre estén alineados.

### 4. Proceso de deploy

```bash
cd /var/www/anabella
git pull origin main
cd agents && npm run build
cd ../admin && npm run build
cd ../frontend && npm run build
pm2 restart backend
```
