---
description: Pre-push ESLint check — run before every git push to catch lint errors
---

## Pre-push ESLint verification

**ALWAYS run this workflow before pushing any changes that touch `agents/src` or `admin/src` files.**

### Steps

1. Build the affected frontend(s) locally to catch ESLint errors:

// turbo
```bash
cd agents && npx craco build 2>&1 | Select-String -Pattern "error|warning|Failed|Compiled"
```

// turbo
```bash
cd admin && npx craco build 2>&1 | Select-String -Pattern "error|warning|Failed|Compiled"
```

2. If **any** ESLint errors appear, fix them **before** committing.

3. Common ESLint pitfalls to watch for:
   - **`no-unused-vars`**: This is an ERROR in `react-app` config. Never leave declared-but-unused variables. Remove them or prefix with `_` if destructured.
   - **`consistent-return`**: Every code path in a function must return or none must.
   - **`no-undef`**: Verify all imports exist.
   - After removing `eslint-disable` comments, verify the underlying rule is actually turned off in `.eslintrc.js`.

4. Only after a clean `Compiled successfully.` with zero errors, proceed to commit and push.

### Key rule
> **Never push code that hasn't passed a local `npm run build` / `npx craco build` first.**

---

## Metadata Enrichment Rule (MANDATORY)

**Every time we create or modify code that persists data** (citas, operaciones, clientes, propiedades, notifications, etc.):

1. Always enrich the `metadata` object with **all relevant IDs** (`clienteId`, `propiedadId`, `agenteId`/`agenteNombre`, `inmobiliariaId`/`inmobiliariaNombre`).
2. Always include both the **display name** and the **MongoDB `_id`** for proper relational tracking.
3. Include **timestamps**, **source** field (e.g. `admin_manual`, `agent_crm`, `automation`), and any contextual data useful for metrics.
4. This enables metrics dashboards, KPIs, automation rules, and triggers to measure activity correctly without needing to do reverse lookups.
5. Never store just display names — always pair them with their entity ID.
