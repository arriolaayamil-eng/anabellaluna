/**
 * MCP Chat Service — Replaces the old orchestrator.
 *
 * Uses Anthropic API directly with tool_use.
 * Tools are provided by the MCP Server (spawned as child process).
 * Supports streaming and conversation history.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

const AIConversation = require('../../models/AIConversation');
const AIMessage      = require('../../models/AIMessage');

// ── Singleton MCP Client ──────────────────────────────────────────────────────

let mcpClient = null;
let mcpTransport = null;
let availableTools = [];

const MCP_SERVER_PATH = path.resolve(__dirname, '../../..', 'mcp-server', 'src', 'index.js');

async function ensureMCPConnection() {
  if (mcpClient) return mcpClient;

  mcpTransport = new StdioClientTransport({
    command: 'node',
    args: [MCP_SERVER_PATH],
    env: { ...process.env },
  });

  mcpClient = new Client({ name: 'anabella-backend', version: '1.0.0' });
  await mcpClient.connect(mcpTransport);

  // Cache available tools
  const toolsResponse = await mcpClient.listTools();
  availableTools = (toolsResponse.tools || []).map((t) => ({
    name: t.name,
    description: t.description || '',
    input_schema: t.inputSchema || { type: 'object', properties: {} },
  }));

  console.log(`[AI/MCP] Connected. ${availableTools.length} tools available.`);
  return mcpClient;
}

async function disconnectMCP() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    mcpTransport = null;
    availableTools = [];
  }
}

// ── Anthropic Client ──────────────────────────────────────────────────────────

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey });
}

// ── System Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(context = {}) {
  const tz = process.env.DEFAULT_TIMEZONE || 'America/Argentina/Buenos_Aires';
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz });

  return `Sos el Copilot AI de Anabella Luna, asistente integral del CRM/ERP inmobiliario.
Hoy es ${today}. Zona horaria: ${tz}.

Tenés acceso COMPLETO al sistema mediante tools. Podés:

📋 CRM (Agentes):
- Buscar, crear y modificar clientes
- Buscar, consultar y modificar propiedades
- Agendar, modificar y cancelar citas (agenda/calendario)
- Crear y gestionar tareas
- Listar y gestionar operaciones (ventas, alquileres, reservas)
- Registrar actividades (llamadas, emails, visitas)
- Consultar notificaciones y recordatorios
- Gestionar documentos y carpetas
- Plantillas de contratos
- Automatizaciones (reglas, fechas importantes)
- Mensajes internos

📊 ERP (Admin):
- Gestión de agentes (crear, editar, activar/desactivar)
- Reservas del sitio público (aprobar/rechazar)
- Mensajes de contacto del sitio público
- Blog CMS (posts)
- Reportes: ventas, rendimiento agentes, analytics propiedades/clientes
- Sistema de recompensas/gamificación
- Log de auditoría
- Configuración inmobiliaria
- KPIs y métricas del dashboard

REGLAS CRÍTICAS:
- SIEMPRE usá tools para obtener datos reales. NUNCA inventes ni asumas datos.
- Antes de crear/modificar/cancelar algo, explicá brevemente qué vas a hacer.
- Las fechas del usuario en lenguaje natural ("mañana a las 10") convertílas a ISO 8601.
- Presentá resultados de forma clara, resumida y formateada. NUNCA vuelques JSON crudo.
- Para montos incluí siempre la moneda (ARS/USD).
- Para fechas usá formato natural argentino (ej: "martes 28/05 a las 14:30").
- Respondé siempre en español rioplatense, claro y profesional.
- Si hay un error en una tool, informá al usuario de forma amigable.
- Podés hacer múltiples consultas en secuencia para obtener información completa.

CONTEXTO:
- Plataforma: Anabella Luna (inmobiliaria argentina)
- Monedas: ARS / USD
${context.agenteId ? `- Agente actual ID: ${context.agenteId} (usá este ID para filtrar datos por agente)` : '- Acceso admin (sin scoping por agente, ves todo el sistema)'}
${context.agenteName ? `- Agente: ${context.agenteName}` : ''}`;
}

// ── Main Chat Function ────────────────────────────────────────────────────────

const MAX_TOOL_ROUNDS = 10;

async function chat({ conversationId, userMessage, userId, agenteId, agenteName }) {
  // 1. Ensure MCP connection
  await ensureMCPConnection();

  // 2. Load or create conversation
  let conversation = await AIConversation.findById(conversationId);
  if (!conversation) {
    conversation = await AIConversation.create({
      userId,
      agenteId: agenteId || '',
      title: userMessage.slice(0, 60),
      contextType: 'general',
    });
  }

  // 3. Save user message
  await AIMessage.create({
    conversationId: conversation._id,
    role: 'user',
    content: userMessage,
    userId,
  });

  // 4. Load history
  const history = await AIMessage.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  // Build messages for Anthropic
  const messages = history.map((m) => {
    if (m.role === 'user') return { role: 'user', content: m.content };
    if (m.role === 'assistant') {
      if (m.toolCalls && m.toolCalls.length > 0) {
        return { role: 'assistant', content: m.toolCalls };
      }
      return { role: 'assistant', content: m.content || '' };
    }
    if (m.role === 'tool_result') {
      return { role: 'user', content: m.toolResults || [] };
    }
    return { role: m.role === 'system' ? 'user' : m.role, content: m.content || '' };
  }).filter((m) => m.content && (typeof m.content === 'string' ? m.content.trim() : true));

  // 5. Anthropic API call with tool loop
  const anthropic = getAnthropicClient();
  const systemPrompt = buildSystemPrompt({ agenteId, agenteName });

  let currentMessages = [...messages];
  let finalResponse = '';
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: currentMessages,
      tools: availableTools,
    });

    // Check if we have tool_use blocks
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const textBlocks = response.content.filter((b) => b.type === 'text');

    if (toolUseBlocks.length === 0) {
      // No tool calls — final response
      finalResponse = textBlocks.map((b) => b.text).join('\n');
      break;
    }

    // Save assistant message with tool calls
    await AIMessage.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: textBlocks.map((b) => b.text).join('\n'),
      toolCalls: response.content,
      userId,
    });

    // Add assistant message to context
    currentMessages.push({ role: 'assistant', content: response.content });

    // Execute tool calls via MCP
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      try {
        const result = await mcpClient.callTool({
          name: toolUse.name,
          arguments: toolUse.input || {},
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result.content || [{ type: 'text', text: 'OK' }],
          is_error: result.isError || false,
        });
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          is_error: true,
        });
      }
    }

    // Save tool results
    await AIMessage.create({
      conversationId: conversation._id,
      role: 'tool_result',
      content: '',
      toolResults,
      userId,
    });

    // Add tool results to messages
    currentMessages.push({ role: 'user', content: toolResults });
  }

  // 6. Save final assistant response
  await AIMessage.create({
    conversationId: conversation._id,
    role: 'assistant',
    content: finalResponse,
    userId,
  });

  // 7. Update conversation
  await AIConversation.findByIdAndUpdate(conversation._id, {
    $set: { lastMessageAt: new Date(), messageCount: (conversation.messageCount || 0) + 2 },
  });

  return {
    conversationId: conversation._id,
    response: finalResponse,
    toolRounds: rounds,
  };
}

module.exports = { chat, ensureMCPConnection, disconnectMCP, buildSystemPrompt };
