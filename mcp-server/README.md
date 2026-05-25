# Anabella Luna — MCP Server

MCP (Model Context Protocol) server que expone todo el CRM/ERP inmobiliario como herramientas para AI agents.

## Tools disponibles (20)

### Clientes
- `search_clientes` — Buscar clientes por nombre, email, teléfono, dirección
- `get_cliente_detail` — Ficha completa (datos + propiedades + operaciones + citas + actividades)
- `create_cliente` — Crear nuevo cliente
- `update_cliente` — Actualizar campos de un cliente

### Propiedades
- `search_propiedades` — Buscar con filtros (estado, precio, publicación, destacada)
- `get_propiedad_detail` — Detalle completo (datos + dueño + operaciones + citas)
- `update_propiedad` — Actualizar campos

### Agenda / Citas
- `list_citas` — Listar citas con filtros por fecha, estado, cliente, propiedad
- `create_cita` — Agendar nueva cita
- `update_cita` — Modificar cita existente
- `cancel_cita` — Cancelar cita

### Operaciones
- `list_operaciones` — Listar ventas, alquileres, reservas
- `get_operacion_detail` — Detalle con comisiones

### Tareas
- `list_tareas` — Listar tareas con filtros
- `create_tarea` — Crear nueva tarea
- `update_tarea_status` — Cambiar estado

### Métricas & Sistema
- `get_dashboard_metrics` — KPIs consolidados del período
- `list_notifications` — Notificaciones del agente
- `log_activity` — Registrar actividad en timeline
- `list_agentes` — Listar agentes del sistema

## Setup

```bash
cd mcp-server
npm install
```

## Uso con Claude Desktop

Agregar a `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "anabella-crm": {
      "command": "node",
      "args": ["<ruta>/mcp-server/src/index.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/anabella"
      }
    }
  }
}
```

## Uso desde el Backend

El backend usa este MCP server internamente via stdio transport + Anthropic API:

```
POST /ai/chat
{
  "message": "¿Qué citas tengo mañana?",
  "conversationId": "optional-id"
}
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Connection string de MongoDB |
| `ANTHROPIC_API_KEY` | API key de Anthropic (solo para el backend) |
| `ANTHROPIC_MODEL` | Modelo a usar (default: claude-sonnet-4-20250514) |
