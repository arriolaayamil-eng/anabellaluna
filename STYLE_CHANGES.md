# Style Unification — Admin (ERP) & Agents (CRM)

## Overview

All pages in both the **Admin (ERP)** and **Agents (CRM)** frontends have been updated to use a unified visual design system based on the `DashboardEjecutivo.jsx` reference page.

---

## Design Tokens

Shared design tokens files were created to centralize styling definitions:

- `admin/src/config/designTokens.js`
- `agents/src/config/designTokens.js`

These export a `useDesignTokens()` hook providing:
- `pageClass` — unified page container
- `cardClass` / `cardSmall` — card styles with border, rounded-2xl, hover effects
- `text.*` — typography classes (heading, subheading, value, label, muted, body)
- `actionBtn.*` — primary, secondary, danger button presets
- `chartColors` — consistent chart color palette
- `inputClass` — form input styling
- `modalOverlay` / `modalContainer` — modal patterns
- `trendBadge()` — KPI trend chips

---

## Changes Applied

### 1. Page Container
**Before:** `m-2 md:m-10 mt-24 p-2 md:p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl`
**After:** `min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg`

### 2. Card Base
**Before:** `rounded-xl shadow-md p-6 bg-white dark:bg-secondary-dark-bg transition transform hover:scale-105`
**After:** `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`

### 3. KPI Cards
**Before:** Gradient top bar + gradient icon background + large icon
**After:** Left border accent color + tinted icon background + trend badge chip

### 4. Page Headers
**Before:** `<Header category="..." title="..." />` component
**After:** Inline header with icon, title (text-lg font-semibold), and subtitle (text-sm)

### 5. Action Buttons
**Before:** `px-6 py-3 bg-blue-500 text-white rounded-lg`
**After:** `px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm hover:shadow-md`

---

## Pages Updated

### Admin (ERP) — Main Pages
| Page | File | Changes |
|------|------|---------|
| Dashboard Ejecutivo | `DashboardEjecutivo.jsx` | Reference page (already styled) |
| Propiedades | `Propiedades.jsx` | Container, cardBase, KPIs, header, buttons |
| Clientes CRM | `ClientesCRM.jsx` | Container, cardBase, KPIs, header, buttons |
| Agentes | `Agentes.jsx` | Container, cardBase, KPIs, header, buttons |
| Ventas | `Ventas.jsx` | Container, cardBase, KPIs, header, buttons |
| Recompensas | `Recompensas.jsx` | Container, header, KPIs with left-accent |
| Integraciones | `Integraciones.jsx` | Container, header, card styling |
| Mensajería | `Mensajeria.jsx` | Container, cardBase, header, stat cards, buttons |
| Reportes | `ReportesReal.jsx` | Container, header (loading + main states) |
| Citas | `Citas.jsx` | Container, cardBase, KPIs, header, buttons |

### Admin (ERP) — Secondary Pages
| Page | File |
|------|------|
| Configuración | `Configuracion.jsx` |
| Mi Perfil | `MiPerfil.jsx` |
| Automatización | `Automatizacion.jsx` |
| Campañas | `Campanas.jsx` |
| Email Marketing | `EmailMarketing.jsx` |
| Analytics Marketing | `AnalyticsMarketing.jsx` |
| Workflows | `Workflows.jsx` |
| Tareas | `Tareas.jsx` |
| Roles y Permisos | `RolesPermisos.jsx` |
| Calendar, Kanban, Editor, ColorPicker | Utility pages |
| Customers, Employees, Orders | Grid pages |
| Charts (Area, Bar, ColorMapping, Financial, Line, Pie, Pyramid, Stacked) | Chart pages |

### Agents (CRM) — Main Pages
| Page | File | Changes |
|------|------|---------|
| Dashboard Ejecutivo | `DashboardEjecutivo.jsx` | Container, cardBase, KPIs with left-accent, header |
| Agent Dashboard | `AgentDashboard.jsx` | Container, cardBase, KPIs with left-accent, header |
| Propiedades | `Propiedades.jsx` | Container, cardBase, KPIs, header, buttons |
| Clientes CRM | `ClientesCRM.jsx` | Container, cardBase, header |
| Ventas | `Ventas.jsx` | Container, cardBase, header |
| Citas | `Citas.jsx` | Container, cardBase, header |
| Agentes | `Agentes.jsx` | Container, cardBase, header |
| Recompensas | `Recompensas.jsx` | Container, cardBase, header |
| Reportes | `Reportes.jsx` | Container, cardBase, header (loading + main) |
| Integraciones | `Integraciones.jsx` | Container, header, card styling |

### Agents (CRM) — Secondary Pages
| Page | File |
|------|------|
| Configuración | `Configuracion.jsx` |
| Mi Perfil | `MiPerfil.jsx` |
| Automatización | `Automatizacion.jsx` |
| Fechas Importantes | `FechasImportantes.jsx` |
| Consultas | `Consultas.jsx` |
| Campañas | `Campanas.jsx` |
| Email Marketing | `EmailMarketing.jsx` |
| Analytics Marketing | `AnalyticsMarketing.jsx` |
| Workflows | `Workflows.jsx` |
| Tareas | `Tareas.jsx` |
| Roles y Permisos | `RolesPermisos.jsx` |
| Calendar, Kanban, Editor, ColorPicker | Utility pages |
| Customers, Employees, Orders | Grid pages |
| Charts (Area, Bar, ColorMapping, Financial, Line, Pie, Pyramid, Stacked) | Chart pages |

---

## What Was NOT Changed
- No data structures or backend logic modified
- No API calls or business logic changed
- `LoginAgente.jsx` login page retains its own design
- Syncfusion component internals untouched (only wrapper containers updated)

---

## Color Palette Reference
| Token | Light | Dark |
|-------|-------|------|
| Page background | `bg-gray-50` | `bg-main-dark-bg` |
| Card background | `bg-white` | `bg-secondary-dark-bg` |
| Card border | `border-gray-100` | `border-gray-700/50` |
| Card hover border | — | `border-indigo-500/30` |
| Heading text | `text-gray-900` | `text-white` |
| Subtext | `text-gray-500` | `text-gray-400` |
| Body text | `text-gray-600` | `text-gray-300` |

## KPI Accent Colors
| Gradient Class | Hex Color |
|----------------|-----------|
| `from-blue-500 to-blue-600` | `#3b82f6` |
| `from-emerald-500 to-emerald-600` | `#10b981` |
| `from-violet-500 to-violet-600` | `#8b5cf6` |
| `from-amber-500 to-amber-600` | `#f59e0b` |
| `from-red-500 to-red-600` | `#ef4444` |
| `from-purple-500 to-purple-600` | `#8b5cf6` |
| `from-orange-500 to-orange-600` | `#f59e0b` |
