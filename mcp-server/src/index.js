#!/usr/bin/env node
/**
 * Anabella Luna — MCP Server
 *
 * Exposes all CRM/ERP data and operations as MCP tools.
 * Can be used with:
 *   - Claude Desktop (stdio transport)
 *   - Backend chat endpoint (programmatic MCP client)
 *   - Any MCP-compatible client
 *
 * Transport: stdio (default) or SSE via --sse flag
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { db } = require('./db');

// Tool registrations
const { registerClienteTools } = require('./tools/clientes');
const { registerPropiedadTools } = require('./tools/propiedades');
const { registerCitaTools } = require('./tools/citas');
const { registerOperacionTools } = require('./tools/operaciones');
const { registerTareaTools } = require('./tools/tareas');
const { registerMetricasTools } = require('./tools/metricas');
const { registerDocumentoTools } = require('./tools/documentos');
const { registerAutomationTools } = require('./tools/automations');
const { registerContratoTools } = require('./tools/contratos');
const { registerReporteTools } = require('./tools/reportes');
const { registerMensajeTools } = require('./tools/mensajes');
const { registerAdminTools } = require('./tools/admin');

async function main() {
  // Connect to MongoDB
  const { connect } = require('./db');
  await connect();

  // Create MCP server
  const server = new McpServer({
    name: 'anabella-crm',
    version: '1.0.0',
    description: 'Anabella Luna CRM/ERP — Full system access for AI agents. Manages clients, properties, appointments, operations, tasks, notifications and metrics for a real estate agency in Argentina.',
  });

  // Register all tools
  registerClienteTools(server);
  registerPropiedadTools(server);
  registerCitaTools(server);
  registerOperacionTools(server);
  registerTareaTools(server);
  registerMetricasTools(server);
  registerDocumentoTools(server);
  registerAutomationTools(server);
  registerContratoTools(server);
  registerReporteTools(server);
  registerMensajeTools(server);
  registerAdminTools(server);

  // Start with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Anabella CRM server running (stdio)');
}

main().catch((err) => {
  console.error('[MCP] Fatal error:', err);
  process.exit(1);
});
