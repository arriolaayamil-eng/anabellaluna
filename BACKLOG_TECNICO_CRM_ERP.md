# BACKLOG DE TICKETS TÉCNICOS

PROYECTO: REARQUITECTURA CRM / ERP – MENSAJERÍA, AGENDA, AUTOMATIZACIONES

## Ticket 0.1 – Auditoría de arquitectura actual (estado relevado)

### Diagrama de arquitectura actual (alto nivel)

```mermaid
flowchart LR
  subgraph FE[Frontends]
    ERP[ERP Admin\n(admin/)\nReact 17 + Craco]
    CRM[CRM Agentes\n(agents/)\nReact 17 + Craco]
    WEB[Sitio público\n(frontend/)\nVite + React]
  end

  subgraph BE[Backend API\n(backend/)\nNode.js + Express]
    S[server.js]
    AUTH[/auth\n(auth.js)/]
    PUBLIC[/public\n(routes/public.js)/]
    CRMAPI[/crm/*\n(routes/*)/]
    ADMINCFG[/admin/config\n(routes/globalConfig.js)/]
    SCHED[Schedulers in-process\n- initAutomationScheduler()\n- initReportScheduler()]
  end

  subgraph DS[Data & Storage]
    MONGO[(MongoDB\nMongoose models)]
    MINIO[(MinIO\nmedia/documents)]
    CLOUD[(Cloudinary\n(opcional))]
  end

  subgraph EXT[Integraciones externas]
    GOOGLE[Google APIs\nOAuth + Calendar]
  end

  ERP -->|HTTP| AUTH
  ERP -->|HTTP| ADMINCFG
  CRM -->|HTTP| AUTH
  CRM -->|HTTP| CRMAPI
  WEB -->|HTTP| PUBLIC

  S --> AUTH
  S --> PUBLIC
  S --> CRMAPI
  S --> ADMINCFG
  S --> SCHED

  AUTH --> MONGO
  PUBLIC --> MONGO
  CRMAPI --> MONGO

  PUBLIC --> MINIO
  CRMAPI --> MINIO
  CRMAPI --> CLOUD

  CRMAPI --> GOOGLE
  SCHED --> MONGO
  SCHED --> GOOGLE
```

### Componentes principales detectados en el código

- **Backend (Express)**
  - **Entry point**: `backend/server.js`
  - **Auth/JWT**: `backend/auth.js`
  - **CRM API**: `backend/routes/*` montado bajo `/crm/*`
  - **ERP Admin Config**: `backend/routes/globalConfig.js` montado bajo `/admin/config/*`
  - **Public API**: `backend/routes/public.js` montado bajo `/public/*`
  - **Schedulers**: `backend/services/automationScheduler.js`, `backend/services/reportScheduler.js` inicializados en `app.listen()`

- **Persistencia / Modelos Mongo**
  - **Identidades**: `User`, `Agente`
  - **CRM**: `Cliente`, `Propiedad`, `Operacion`, `Tarea`, `Cita`, `Activity`
  - **Mensajería/Notificaciones**: `Message` (chat interno), `Notification` (automatizaciones)
  - **Automatizaciones**: `AutomationRule`, `FechaImportante`
  - **Config global**: `GlobalConfig` (por ej. OAuth)
  - **Auditoría**: `AuditLog` (mínimo)

- **Integraciones**
  - **Google Calendar/OAuth**: `backend/services/googleCalendar.js`
  - **MinIO**: `backend/minio.js` (buckets, put/get/remove, etc.)
  - **Cloudinary**: `backend/cloudinary.js` (opcional)

### Problemas críticos (en base al repo actual)

- **Modelo de identidad inconsistente (User vs Agente) + mezcla de tipos de IDs**
  - **Evidencia**:
    - `User.agenteId` es `ObjectId` ref `Agente` (`backend/models/User.js`).
    - Múltiples entidades guardan `agenteId/agentId` como `String` (ej: `Cliente.agenteId`, `Cita.agenteId`, `AutomationRule.agenteId`, `Notification.agenteId`, `Activity.agenteId`).
    - `Message.senderId/receiverId` son `ObjectId` ref `Agente` (`backend/models/Message.js`), pero los mensajes “ERP” pueden guardar el `User._id` del admin como `senderId` (ver `backend/routes/messages.js`, `getUserFromToken()` + `/send` + `/broadcast`).
  - **Impacto**:
    - Poblado (`populate`) y queries frágiles.
    - Scoping por agente difícil de asegurar y fácil de romper.

- **JWT payload vs consumo en rutas: campos esperados no coinciden**
  - **Evidencia**:
    - Token incluye `{ sub, username, role, agenteId }` (`backend/auth.js`).
    - Hay rutas que esperan `req.user.id` o `req.user._id` (ej: `backend/routes/crm.js` y `backend/routes/reports.js`).
  - **Impacto**:
    - Contadores/summary pueden dar 0 o valores incorrectos.
    - Riesgo de fallas silenciosas en permisos/filters.

- **Permisos y scoping duplicados (sin middleware centralizado)**
  - **Evidencia**:
    - `agentScopeId(req)` está duplicado en muchas rutas (`clientes.js`, `propiedades.js`, `citas.js`, `tareas.js`, `activities.js`, `automations.js`, `notifications.js`, etc.).
    - Algunos endpoints usan `requireRole('admin')`, otros no, y otros validan a mano.
  - **Impacto**:
    - Alto riesgo de “endpoint olvidado” sin scoping.
    - Dificulta evolucionar roles/permisos sin regresiones.

- **Inconsistencias de nombres/campos entre modelos y consultas**
  - **Evidencia**:
    - `Propiedad` usa `status` (enum) pero hay consultas que usan `estado` (ej: `backend/routes/crm.js`).
    - `Cita.estado` usa valores `Programada/Completada/Cancelada`, pero hay filtros usando `cancelada` en minúscula (`backend/routes/crm.js`).
    - En métricas de agentes, se agregan actividades por `$tipo` pero el modelo usa `type` (`backend/routes/agentes.js` vs `backend/models/Activity.js`).
  - **Impacto**:
    - KPIs/estadísticas incorrectas.
    - Bugs de negocio difíciles de detectar.

- **Mensajería fragmentada y no unificada**
  - **Estado actual**:
    - `Message` = chat interno (agente-agente, agente-ERP), con delete permitido (`backend/routes/messages.js`).
    - `Activity` = eventos/consultas (incluye web enquiries / visits) (`backend/routes/public.js` y `backend/routes/activities.js`).
    - `Notification` = automatizaciones y recordatorios (scheduler) (`backend/routes/notifications.js`, `backend/services/automationScheduler.js`).
  - **Impacto**:
    - Duplicación de UI/queries/conceptos.
    - Difícil “multicanal” (WhatsApp/email/sms) sin un Hub.

- **Agenda fragmentada (Cita vs Activity vs Tarea)**
  - **Estado actual**:
    - `Cita` sirve para agenda y además intenta sincronizar con Google Calendar (`backend/routes/citas.js`).
    - `Activity` guarda eventos/acciones (primer contacto, enquiry, visit_scheduled, etc.) y dispara automatizaciones.
    - `Tarea` gestiona Kanban y recordatorios.
  - **Impacto**:
    - No existe una entidad única de “Event/Agenda”.
    - ERP/CRM no pueden tener una vista consolidada sólida.

- **Schedulers corriendo dentro del proceso del API**
  - **Evidencia**:
    - `initAutomationScheduler()` y `initReportScheduler()` se inicializan al levantar el servidor (`backend/server.js`).
  - **Impacto**:
    - Si se escala horizontalmente (2+ instancias), hay duplicación de ejecuciones.
    - Falta de locking/idempotencia global.

- **Manejo de errores silencioso en integraciones**
  - **Evidencia**:
    - En `backend/routes/citas.js` se atrapan errores de Google Calendar y se ignoran (`catch (e) { }`).
  - **Impacto**:
    - Fallas invisibles y difíciles de monitorear.

### Propuesta de arquitectura objetivo (alto nivel)

```mermaid
flowchart LR
  subgraph FE[Frontends]
    ERP[ERP Admin\n(admin/)]
    CRM[CRM Agentes\n(agents/)]
    WEB[Sitio público\n(frontend/)]
  end

  subgraph BE[Backend - Arquitectura objetivo]
    RBAC[Auth + RBAC\n(scope por rol/tenant)]
    MSG[Message Hub\n(multicanal + log inmutable)]
    EVT[Event/Agenda Hub\n(Event = visita/llamada/seguimiento/recordatorio)]
    AUTO[Automation Engine\n(reglas + templates + programación)]
    INTEG[Integrations\n(Google/WhatsApp/Email/SMS)]
    FILES[Media\n(MinIO)]
    ANALYTICS[Analytics/Reports\n(ERP)]
  end

  subgraph WORKERS[Workers]
    SCHED[Scheduler Worker\n(ejecución programada)]
  end

  MONGO[(MongoDB)]
  MINIO[(MinIO)]
  GOOGLE[Google Calendar]
  WHATSAPP[WhatsApp Business API]

  ERP --> RBAC
  CRM --> RBAC
  WEB --> RBAC

  ERP --> MSG
  CRM --> MSG
  WEB --> MSG

  ERP --> EVT
  CRM --> EVT

  AUTO --> MSG
  AUTO --> EVT
  SCHED --> AUTO

  MSG --> INTEG
  EVT --> INTEG
  INTEG --> GOOGLE
  INTEG --> WHATSAPP

  RBAC --> MONGO
  MSG --> MONGO
  EVT --> MONGO
  AUTO --> MONGO
  ANALYTICS --> MONGO

  FILES --> MINIO
```

### Principios de diseño propuestos (para guiar todos los tickets)

- **RBAC centralizado**
  - Un único middleware para:
    - Autenticación
    - Autorización por rol
    - Scoping por `agenteId` para CRM
    - Acceso global para admin ERP

- **Entidades canónicas**
  - `User` = identidad de autenticación.
  - `Agente` = perfil CRM.
  - `Message` (Hub) = mensajes multicanal, inmutables.
  - `Event` = agenda unificada.

- **Separación mensaje vs evento**
  - Mensajes (comunicación) != Eventos (agenda/acciones).

- **Schedulers fuera del API**
  - Worker dedicado o job runner.
  - Idempotencia (por clave natural: cliente+evento+periodo).

---

## Issues (fuente de verdad para Jira/GitHub)

### TICKET 0.1 – Auditoría de arquitectura actual

- **Objetivo**
  - Relevar estado actual del CRM y ERP para detectar acoplamientos indebidos, flujos incorrectos y duplicación de lógica.

- **Alcance**
  - Mapear arquitectura actual (backend + CRM + ERP + sitio público) y sus dependencias.
  - Identificar problemas críticos con evidencia en el código.
  - Proponer arquitectura objetivo (módulos y límites).

- **Criterios de aceptación**
  - Existe un diagrama Mermaid de arquitectura actual.
  - Existe una lista de problemas críticos priorizados.
  - Existe un diagrama Mermaid de arquitectura objetivo.

- **Dependencias**
  - Ninguna.

### TICKET 0.2 – Definición de roles y permisos

- **Objetivo**
  - Normalizar control de acceso entre CRM (agentes) y ERP (admin).

- **Alcance**
  - Definir roles (`agent`, `admin`, `user` público) y permisos por módulo.
  - Implementar middleware centralizado de scoping y autorización.
  - Asegurar regla “Agente: solo ve sus datos” en todas las rutas CRM.

- **Criterios de aceptación**
  - Todas las rutas bajo `/crm/*` aplican scoping por `agenteId` para rol `agent`.
  - Rol `admin` puede acceder a datos globales (sin scoping) en endpoints permitidos.
  - Existe una matriz de permisos (documentada) que cubre CRM/ERP.
  - Hay tests mínimos para:
    - agente no puede leer datos de otro agente
    - admin puede leer global

- **Dependencias**
  - Ticket 0.1.

---

### TICKET 1.1 – Message Hub central

- **Objetivo**
  - Crear un módulo único de mensajería multicanal.

- **Alcance**
  - Definir modelo `Message` nuevo/canónico con:
    - tipificación por canal (interno, web, whatsapp, email, sms, sistema)
    - asociación a cliente/agente/sistema
    - log inmutable (sin delete físico)
  - Crear endpoints CRUD/consulta necesarios para CRM/ERP.

- **Criterios de aceptación**
  - Existe un modelo `Message` que soporta canales y asociaciones.
  - No existe delete físico de mensajes (solo soft-delete o tombstone, según definición).
  - ERP y CRM pueden listar conversaciones/mensajes con filtros por canal/cliente/agente.

- **Dependencias**
  - Ticket 0.2.

### TICKET 1.2 – Migración de mensajes existentes

- **Objetivo**
  - Reclasificar mensajes actuales al nuevo Message Hub.

- **Alcance**
  - Migrar (o mapear) mensajes de:
    - mensajes entre agentes
    - agente ↔ ERP
    - web (usuarios logueados)
    - web (usuarios no logueados)
  - Definir estrategia de compatibilidad (lectura dual o script de migración).

- **Criterios de aceptación**
  - Existe un plan de migración y/o script ejecutable.
  - Mensajes antiguos quedan accesibles desde el Hub (mismo historial o redirección).
  - No se rompe el chat actual durante la transición.

- **Dependencias**
  - Ticket 1.1.

### TICKET 1.3 – Separación mensajes vs eventos

- **Objetivo**
  - Eliminar visitas programadas del sistema de mensajes.

- **Alcance**
  - Definir la frontera entre:
    - Comunicación (Message Hub)
    - Agenda/Eventos (Event)
  - Migrar cualquier “visita/agenda” que esté modelada como mensaje.

- **Criterios de aceptación**
  - No existen “visitas/eventos” persistidos como mensajes.
  - La agenda se representa en un modelo de eventos (ver Ticket 2.1).

- **Dependencias**
  - Ticket 1.1.
  - Ticket 0.2.

---

### TICKET 2.1 – Modelo de eventos de agenda

- **Objetivo**
  - Crear entidad `Event` desacoplada de mensajes.

- **Alcance**
  - Modelar `Event` con tipos:
    - Visita
    - Llamada
    - Seguimiento
    - Recordatorio automático
  - Relacionar Event con cliente/agente/propiedad cuando aplique.

- **Criterios de aceptación**
  - Existe un modelo `Event` y endpoints base (CRUD) con RBAC.
  - Se puede consultar por agente, por rango de fechas y por tipo.

- **Dependencias**
  - Ticket 0.2.
  - Ticket 1.3.

### TICKET 2.2 – Agenda CRM (agentes)

- **Objetivo**
  - Vista individual de agenda por agente.

- **Alcance**
  - UI de CRM para:
    - ver solo eventos propios
    - consumir eventos generados por automatizaciones
    - CRUD limitado según permisos

- **Criterios de aceptación**
  - Un agente solo visualiza y modifica sus eventos.
  - Se visualizan eventos automáticos/recordatorios cuando corresponda.

- **Dependencias**
  - Ticket 2.1.
  - Ticket 0.2.

### TICKET 2.3 – Agenda ERP (admin)

- **Objetivo**
  - Vista global consolidada de agenda.

- **Alcance**
  - UI ERP para:
    - ver eventos de todos los agentes
    - filtrar por agente
    - estadísticas básicas
  - Preparar exportación futura.

- **Criterios de aceptación**
  - Admin puede ver agenda global.
  - Existen filtros por agente y rango de fechas.
  - Existen estadísticas mínimas definidas.

- **Dependencias**
  - Ticket 2.1.
  - Ticket 0.2.

### TICKET 2.4 – Sincronización con Google Calendar

- **Objetivo**
  - Sincronizar eventos internos con calendarios externos.

- **Alcance**
  - Definir reglas de sincronización Event ↔ Google Calendar (create/update/delete).
  - Reutilizar credenciales OAuth centralizadas (config ERP) y tokens por agente.

- **Criterios de aceptación**
  - Un evento creado/actualizado en el CRM se refleja en Google Calendar (si el agente conectó su cuenta).
  - La sincronización es idempotente y tolera reintentos.

- **Dependencias**
  - Ticket 2.1.
  - Ticket 0.2.

---

### TICKET 3.1 – Extensión del modelo Cliente

- **Objetivo**
  - Extender el modelo Cliente con campos para segmentación.

- **Alcance**
  - Campos:
    - Género
    - Fecha nacimiento
    - Estado parental
    - Tiene hijos
    - Profesión
    - Preferencias de contacto

- **Criterios de aceptación**
  - Modelo y endpoints soportan todos los campos.
  - CRM permite cargar/editar los campos.

- **Dependencias**
  - Ticket 0.2.

### TICKET 3.2 – Dropdown dinámico de profesiones

- **Objetivo**
  - Profesiones configurables desde ERP y usables por automatizaciones.

- **Alcance**
  - CRUD de catálogo de profesiones desde ERP.
  - Consumo del catálogo desde CRM (dropdown).

- **Criterios de aceptación**
  - ERP puede crear/editar/eliminar profesiones.
  - CRM usa lista dinámica (sin hardcode).
  - Automatizaciones pueden filtrar por profesión.

- **Dependencias**
  - Ticket 3.1.
  - Ticket 0.2.

### TICKET 3.3 – Refactor formulario “Nuevo Cliente”

- **Objetivo**
  - Mejorar UX y validaciones del formulario.

- **Alcance**
  - Definir campos obligatorios vs opcionales.
  - Validaciones consistentes.

- **Criterios de aceptación**
  - UX clara con secciones.
  - Validaciones implementadas y testeadas.

- **Dependencias**
  - Ticket 3.1.
  - Ticket 3.2.

---

### TICKET 4.1 – Integración calendario oficial Argentina

- **Objetivo**
  - Fechas oficiales sin hardcode y con actualización anual automática.

- **Alcance**
  - Definir fuente oficial (API/dataset) y mecanismo de actualización.
  - Persistir/actualizar en `FechaImportante`.

- **Criterios de aceptación**
  - No hay hardcode de fechas en el código runtime.
  - El sistema puede recalcular/actualizar por año automáticamente.

- **Dependencias**
  - Ticket 0.1.

### TICKET 4.2 – Motor de reglas de automatización

- **Objetivo**
  - Motor para ejecutar automatizaciones con condiciones/segmentación.

- **Alcance**
  - Condiciones por:
    - Profesión
    - Género
    - Estado parental
    - Tipo de cliente

- **Criterios de aceptación**
  - Reglas soportan condiciones y se ejecutan de forma determinística.
  - Existe trazabilidad mínima (por qué disparó / por qué no disparó).

- **Dependencias**
  - Ticket 3.1.

### TICKET 4.3 – Plantillas dinámicas de mensajes

- **Objetivo**
  - Variables, versionado y gestión desde ERP.

- **Alcance**
  - Definir templates con variables.
  - Versionado.
  - UI de gestión en ERP.

- **Criterios de aceptación**
  - Templates se renderizan con variables.
  - Cambios quedan versionados.
  - ERP administra templates.

- **Dependencias**
  - Ticket 1.1.
  - Ticket 0.2.

---

### TICKET 5.1 – Integración WhatsApp Business API

- **Objetivo**
  - Integrar WhatsApp Business API con configuración desde ERP.

- **Alcance**
  - Variables de entorno cifradas.
  - Webhooks.
  - Configuración desde ERP.

- **Criterios de aceptación**
  - Existe conexión funcional con WhatsApp Business API.
  - Webhooks reciben y procesan eventos.
  - Secrets no quedan expuestos en frontend.

- **Dependencias**
  - Ticket 0.2.

### TICKET 5.2 – Canal WhatsApp en Message Hub

- **Objetivo**
  - WhatsApp como canal nativo dentro del Hub.

- **Alcance**
  - Persistencia de mensajes entrantes/salientes WhatsApp en el Hub.
  - Asociación mensaje ↔ cliente ↔ agente.

- **Criterios de aceptación**
  - Mensajes WhatsApp aparecen en el Hub con metadata adecuada.
  - Se puede consultar historial por cliente.

- **Dependencias**
  - Ticket 1.1.
  - Ticket 5.1.

### TICKET 5.3 – Pestaña WhatsApp en CRM

- **Objetivo**
  - UI para visualizar chats y enviar mensajes.

- **Alcance**
  - Visualización de hilos.
  - Envío manual.
  - Visualizar mensajes automáticos.

- **Criterios de aceptación**
  - CRM muestra chats por cliente.
  - Agente puede enviar mensaje manual.
  - Se distinguen mensajes automáticos.

- **Dependencias**
  - Ticket 5.2.
  - Ticket 0.2.

### TICKET 5.4 – WhatsApp Web embebido (opcional)

- **Objetivo**
  - Instancia embebida con QR y sesión persistente.

- **Alcance**
  - Evaluación técnica y prototipo.
  - Advertencia de consumo.

- **Criterios de aceptación**
  - Prototipo funcional o decisión documentada de no implementarlo.

- **Dependencias**
  - Ticket 5.1.

---

### TICKET 6.1 – Envío automático de mensajes

- **Objetivo**
  - Automatizaciones → WhatsApp sin login del agente.

- **Alcance**
  - Integrar motor de automatizaciones con canal WhatsApp.
  - Logs completos.

- **Criterios de aceptación**
  - Regla activa dispara envío WhatsApp.
  - Queda registro (Message Hub + auditoría mínima) del envío.

- **Dependencias**
  - Ticket 4.2.
  - Ticket 5.2.

### TICKET 6.2 – Prevención de duplicados

- **Objetivo**
  - Evitar repetir saludos y mensajes en automatizaciones.

- **Alcance**
  - Control por evento + cliente + año.

- **Criterios de aceptación**
  - El sistema no envía duplicados bajo las mismas condiciones.
  - Existe clave de idempotencia documentada.

- **Dependencias**
  - Ticket 6.1.

---

### TICKET 7.1 – Dashboard de mensajería (ERP)

- **Objetivo**
  - KPIs de mensajería por canal, respuestas y conversión.

- **Alcance**
  - KPIs:
    - mensajes por canal
    - respuestas
    - conversión

- **Criterios de aceptación**
  - ERP muestra KPIs definidos y filtros básicos.

- **Dependencias**
  - Ticket 1.1.

### TICKET 7.2 – Dashboard de agenda (ERP)

- **Objetivo**
  - KPIs de agenda.

- **Alcance**
  - KPIs:
    - visitas por agente
    - efectividad
    - carga operativa

- **Criterios de aceptación**
  - ERP muestra KPIs definidos y filtros por agente.

- **Dependencias**
  - Ticket 2.1.

---

### TICKET 8.1 – Auditoría de recursos servidor

- **Objetivo**
  - Medir CPU/RAM y escalabilidad, incluyendo evaluación WhatsApp Web vs API.

- **Alcance**
  - Relevamiento de consumo en escenarios típicos.
  - Recomendación de arquitectura de despliegue.

- **Criterios de aceptación**
  - Informe con métricas y recomendaciones.

- **Dependencias**
  - Ticket 0.1.

### TICKET 8.2 – Logging y auditoría

- **Objetivo**
  - Logging consistente para acciones críticas, eventos automáticos y accesos admin.

- **Alcance**
  - Auditoría de:
    - acciones críticas
    - automatizaciones
    - accesos admin

- **Criterios de aceptación**
  - Existe un esquema de auditoría y endpoints/consultas mínimas.
  - Se registran acciones críticas definidas.

- **Dependencias**
  - Ticket 0.2.

---

### TICKET 9.1 – Documentación técnica

- **Objetivo**
  - Documentar arquitectura, flujos y variables de entorno.

- **Alcance**
  - Arquitectura
  - Flujos
  - Variables de entorno

- **Criterios de aceptación**
  - Documentación actualizada y usable por handoff.

- **Dependencias**
  - Tickets 0.1 a 8.2.

### TICKET 9.2 – Checklist de despliegue

- **Objetivo**
  - Deploy seguro con rollback y monitoreo inicial.

- **Alcance**
  - Pasos de deploy
  - Rollback
  - Monitoreo inicial

- **Criterios de aceptación**
  - Checklist reproducible y probado en un deploy.

- **Dependencias**
  - Ticket 9.1.
