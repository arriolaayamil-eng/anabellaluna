/**
 * MCP Chat Service — Agentic chat con tool loop completo.
 *
 * USA providerAbstraction (OpenRouter) como LLM.
 * Tools provistos por el MCP Server (proceso hijo via stdio).
 * Formato de tools: OpenAI-compatible (tool_calls / tool role).
 *
 * Estrategia de historial:
 *   - Se guardan TODOS los mensajes en MongoDB (persistencia total).
 *   - Para el contexto del LLM: últimos 5 mensajes + resumen comprimido (summary)
 *     de los anteriores (hasta 20 turnos anteriores al resumen).
 *   - Así el contexto nunca explota pero el AI recuerda conversaciones largas.
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

const { chatCompletion } = require('./providerAbstraction');
const AIConversation    = require('../../models/AIConversation');
const AIMessage         = require('../../models/AIMessage');

// ── Singleton MCP Client ──────────────────────────────────────────────────────

let mcpClient    = null;
let mcpTransport = null;
let availableTools = [];

const MCP_SERVER_PATH = path.resolve(__dirname, '../../..', 'mcp-server', 'src', 'index.js');

async function ensureMCPConnection() {
  if (mcpClient) return mcpClient;

  mcpTransport = new StdioClientTransport({
    command: 'node',
    args:    [MCP_SERVER_PATH],
    env:     { ...process.env },
  });

  mcpClient = new Client({ name: 'anabella-backend', version: '1.0.0' });
  await mcpClient.connect(mcpTransport);

  // Convertir tools MCP → formato OpenAI function-calling
  const toolsResponse = await mcpClient.listTools();
  availableTools = (toolsResponse.tools || []).map((t) => ({
    type: 'function',
    function: {
      name:        t.name,
      description: t.description || '',
      parameters:  t.inputSchema || { type: 'object', properties: {} },
    },
  }));

  console.log(`[AI/MCP] Connected. ${availableTools.length} tools available.`);
  return mcpClient;
}

async function disconnectMCP() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient    = null;
    mcpTransport = null;
    availableTools = [];
  }
}

// ── System Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(context = {}) {
  const tz    = process.env.DEFAULT_TIMEZONE || 'America/Argentina/Buenos_Aires';
  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
  });

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

// ── History helpers ───────────────────────────────────────────────────────────

const RECENT_MSGS   = 5;   // mensajes recientes que se pasan íntegros al LLM
const SUMMARY_MSGS  = 20;  // mensajes anteriores que se comprimen en el summary
const MAX_TOOL_ROUNDS = 10;

/**
 * Construye el array de mensajes para el LLM:
 *   [system] + (summary si existe) + últimos RECENT_MSGS user/assistant
 */
async function _buildContextMessages(conversation, systemPrompt) {
  const allHistory = await AIMessage.find({
    conversationId: conversation._id,
    role: { $in: ['user', 'assistant'] },
  })
    .sort({ createdAt: 1 })
    .lean();

  const recentMsgs = allHistory.slice(-RECENT_MSGS);
  const messages   = [{ role: 'system', content: systemPrompt }];

  if (conversation.summary) {
    messages.push({
      role:    'system',
      content: `Resumen de la conversación anterior:\n${conversation.summary}`,
    });
  }

  for (const m of recentMsgs) {
    messages.push({ role: m.role, content: m.content || '' });
  }

  return { messages, totalCount: allHistory.length };
}

/**
 * Si la conversación tiene más de RECENT_MSGS + SUMMARY_MSGS mensajes sin resumir,
 * genera un nuevo resumen con el LLM y lo guarda en la conversación.
 */
async function _maybeSummarize(conversation, userId, agenteId) {
  const count = await AIMessage.countDocuments({
    conversationId: conversation._id,
    role: { $in: ['user', 'assistant'] },
  });

  // Resumir si hay más de RECENT_MSGS + SUMMARY_MSGS mensajes
  if (count <= RECENT_MSGS + SUMMARY_MSGS) return;

  // Obtener los mensajes que van a ser "comprimidos" (todos menos los últimos RECENT_MSGS)
  const toSummarize = await AIMessage.find({
    conversationId: conversation._id,
    role: { $in: ['user', 'assistant'] },
  })
    .sort({ createdAt: 1 })
    .limit(count - RECENT_MSGS)
    .lean();

  const convoText = toSummarize
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
    .join('\n');

  try {
    const summaryResult = await chatCompletion({
      messages: [
        { role: 'system', content: 'Sos un asistente que resume conversaciones en español. Sé conciso y preserva los datos clave (nombres, IDs, decisiones tomadas, propiedades mencionadas).' },
        { role: 'user',   content: `Resumí esta conversación en máximo 300 palabras:\n\n${convoText}` },
      ],
      userId,
      agenteId,
      conversationId: conversation._id,
    });

    const summary = summaryResult.choices[0]?.message?.content || '';
    if (summary) {
      await AIConversation.findByIdAndUpdate(conversation._id, { $set: { summary } });
    }
  } catch {
    // Si falla el resumen no bloqueamos el chat
  }
}

// ── Main Chat Function ────────────────────────────────────────────────────────

async function chat({ conversationId, userMessage, userId, agenteId, agenteName, permissions }) {
  // 1. Conectar MCP server (tools del CRM/ERP)
  await ensureMCPConnection();

  // 2. Cargar o crear conversación
  let conversation = await AIConversation.findById(conversationId);
  if (!conversation) {
    conversation = await AIConversation.create({
      userId,
      agenteId:    agenteId || '',
      title:       userMessage.slice(0, 60),
      contextType: 'general',
    });
  }

  // 3. Guardar mensaje del usuario en DB (persistencia)
  await AIMessage.create({
    conversationId: conversation._id,
    role:    'user',
    content: userMessage,
    userId,
  });

  // 4. Construir contexto: system + summary (si existe) + últimos 5 mensajes
  const systemPrompt = buildSystemPrompt({ agenteId, agenteName });
  const { messages: currentMessages } = await _buildContextMessages(conversation, systemPrompt);

  let finalResponse = '';
  let rounds        = 0;
  let lastProvider  = '';
  let totalTokens   = 0;

  // 5. Loop LLM → tools (formato OpenAI)
  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const llmResult = await chatCompletion({
      messages: currentMessages,
      tools:    availableTools,
      userId,
      agenteId,
      conversationId: conversation._id,
    });

    lastProvider  = llmResult.provider || '';
    totalTokens  += llmResult.usage?.total_tokens || 0;

    const choice       = llmResult.choices[0];
    const assistantMsg = choice.message;
    const finishReason = choice.finish_reason;

    // Sin tool calls → respuesta final
    if (!assistantMsg.tool_calls || !assistantMsg.tool_calls.length ||
        finishReason === 'stop' || finishReason === 'length') {
      finalResponse = assistantMsg.content || '';
      break;
    }

    // Agregar assistant (con tool_calls) al contexto en memoria
    currentMessages.push({
      role:       'assistant',
      content:    assistantMsg.content || null,
      tool_calls: assistantMsg.tool_calls,
    });

    // Guardar en DB el mensaje del assistant con tool_calls
    await AIMessage.create({
      conversationId: conversation._id,
      role:      'assistant',
      content:   assistantMsg.content || '',
      toolCalls: assistantMsg.tool_calls,
      provider:  lastProvider,
      userId,
    });

    // Ejecutar cada tool via MCP
    for (const toolCall of assistantMsg.tool_calls) {
      let toolResultContent;
      try {
        const args   = JSON.parse(toolCall.function.arguments || '{}');
        const result = await mcpClient.callTool({
          name:      toolCall.function.name,
          arguments: args,
        });
        const text = Array.isArray(result.content)
          ? result.content.map((c) => c.text || '').join('\n')
          : JSON.stringify(result);
        toolResultContent = result.isError ? `Error: ${text}` : text;
      } catch (err) {
        toolResultContent = `Error ejecutando ${toolCall.function.name}: ${err.message}`;
      }

      // Agregar tool result al contexto (formato OpenAI)
      currentMessages.push({
        role:         'tool',
        tool_call_id: toolCall.id,
        content:      toolResultContent,
      });
    }

    // Guardar tool results en DB
    await AIMessage.create({
      conversationId: conversation._id,
      role:        'tool_result',
      content:     '',
      toolResults: assistantMsg.tool_calls.map((tc) => ({
        tool_call_id: tc.id,
        name:         tc.function.name,
        content:      currentMessages.find(
          (m) => m.role === 'tool' && m.tool_call_id === tc.id
        )?.content || '',
      })),
      userId,
    });

    // Si el LLM terminó con tool_calls pero no hay más rondas, forzar respuesta final
    if (rounds >= MAX_TOOL_ROUNDS) {
      finalResponse = 'Alcancé el límite de operaciones. Por favor, reformulá tu consulta.';
    }
  }

  // 6. Guardar respuesta final del assistant
  const savedAssistant = await AIMessage.create({
    conversationId: conversation._id,
    role:       'assistant',
    content:    finalResponse,
    provider:   lastProvider,
    tokensUsed: totalTokens,
    userId,
  });

  // 7. Actualizar conversación
  await AIConversation.findByIdAndUpdate(conversation._id, {
    $set: { lastMessageAt: new Date() },
    $inc: { messageCount: 2, totalTokensUsed: totalTokens },
  });

  // 8. Auto-summarize si la conversación creció mucho (no bloqueante)
  _maybeSummarize(conversation, userId, agenteId).catch(() => {});

  return {
    conversationId:     conversation._id,
    assistantMessageId: savedAssistant._id,
    content:            finalResponse,
    response:           finalResponse,
    provider:           lastProvider,
    toolRounds:         rounds,
    usage:              { total_tokens: totalTokens },
  };
}

module.exports = { chat, ensureMCPConnection, disconnectMCP, buildSystemPrompt };
