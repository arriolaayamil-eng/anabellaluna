/**
 * MCP Tools — Predicciones y recomendaciones P2.
 *
 * Estas tools son read-only: calculan scores y recomendaciones heurísticas
 * usando datos reales del CRM/ERP, sin modificar la base.
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerPrediccionTools(server) {
  const Cliente = () => getModel('Cliente');
  const Propiedad = () => getModel('Propiedad');
  const Operacion = () => getModel('Operacion');
  const Cita = () => getModel('Cita');
  const Tarea = () => getModel('Tarea');
  const Activity = () => getModel('Activity');
  const ClientInteraction = () => getModel('ClientInteraction');
  const PropertyView = () => getModel('PropertyView');
  const CampaignMetrics = () => getModel('CampaignMetrics');

  const safeLimit = (limit, fallback = 10) => Math.min(Math.max(Number(limit) || fallback, 1), 50);
  const daysAgo = (days) => new Date(Date.now() - Number(days) * 86400000);
  const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Math.round(value), min), max);
  const ageDays = (date) => {
    if (!date) return null;
    const time = new Date(date).getTime();
    if (Number.isNaN(time)) return null;
    return Math.max(0, Math.floor((Date.now() - time) / 86400000));
  };

  async function getClientSignals(clienteId) {
    const since90 = daysAgo(90);
    const since30 = daysAgo(30);
    const [cliente, activities, citas, operaciones, interactions, openTasks] = await Promise.all([
      Cliente().findById(clienteId).lean(),
      Activity().find({ clientId: String(clienteId) }).sort({ createdAt: -1 }).limit(30).lean(),
      Cita().find({ clienteId: String(clienteId) }).sort({ fecha: -1 }).limit(20).lean(),
      Operacion().find({ clienteId: String(clienteId) }).sort({ createdAt: -1 }).limit(10).lean(),
      ClientInteraction().find({ clienteId }).sort({ createdAt: -1 }).limit(30).lean().catch(() => []),
      Tarea().find({
        clienteId: String(clienteId),
        status: { $in: ['pendiente', 'en_progreso', 'en_revision', 'Open', 'InProgress', 'Testing'] },
      }).sort({ dueDate: 1 }).limit(10).lean(),
    ]);

    if (!cliente) return null;

    const recentActivities = activities.filter((a) => new Date(a.createdAt) >= since30).length;
    const recentInteractions = interactions.filter((i) => new Date(i.createdAt) >= since30).length;
    const recentCitas = citas.filter((c) => new Date(c.fecha || c.createdAt) >= since30).length;
    const completedVisits = citas.filter((c) => c.estado === 'Completada' || c.tipo === 'Visita').length;
    const highInterest = interactions.filter((i) => i.nivelInteres === 'alto').length;
    const openOps = operaciones.filter((o) => !['Cerrada', 'Completada', 'Cancelada', 'Finalizada'].includes(o.estado || '')).length;
    const closedOps = operaciones.filter((o) => ['Cerrada', 'Completada', 'Finalizada'].includes(o.estado || '')).length;
    const lastTouch = [
      ...activities.map((a) => a.createdAt),
      ...interactions.map((i) => i.createdAt),
      ...citas.map((c) => c.fecha || c.createdAt),
      ...operaciones.map((o) => o.updatedAt || o.createdAt),
    ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || cliente.updatedAt || cliente.createdAt;
    const daysSinceLastTouch = ageDays(lastTouch);
    const overdueTasks = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const recentOperations = operaciones.filter((o) => new Date(o.createdAt) >= since90).length;

    return {
      cliente,
      activities,
      citas,
      operaciones,
      interactions,
      openTasks,
      signals: {
        recentActivities,
        recentInteractions,
        recentCitas,
        completedVisits,
        highInterest,
        openOps,
        closedOps,
        recentOperations,
        daysSinceLastTouch,
        overdueTasks,
        hasContactData: Boolean(cliente.email || cliente.telefono),
        fidelizado: Boolean(cliente.fidelizado),
      },
    };
  }

  function scoreClient(signals) {
    const factors = [];
    let score = 20;

    if (signals.hasContactData) { score += 10; factors.push('Tiene datos de contacto.'); }
    if (signals.recentActivities > 0) { score += Math.min(signals.recentActivities * 6, 18); factors.push(`Tuvo ${signals.recentActivities} actividades recientes.`); }
    if (signals.recentInteractions > 0) { score += Math.min(signals.recentInteractions * 5, 15); factors.push(`Tuvo ${signals.recentInteractions} interacciones CRM recientes.`); }
    if (signals.recentCitas > 0) { score += Math.min(signals.recentCitas * 8, 16); factors.push(`Tuvo ${signals.recentCitas} citas recientes.`); }
    if (signals.completedVisits > 0) { score += Math.min(signals.completedVisits * 5, 15); factors.push(`Registra ${signals.completedVisits} visita(s).`); }
    if (signals.highInterest > 0) { score += Math.min(signals.highInterest * 10, 20); factors.push('Hay señales de interés alto.'); }
    if (signals.openOps > 0) { score += 18; factors.push('Tiene operación abierta.'); }
    if (signals.closedOps > 0 || signals.fidelizado) { score += 8; factors.push('Tiene historial positivo/fidelización.'); }
    if (signals.daysSinceLastTouch !== null && signals.daysSinceLastTouch > 30) { score -= 20; factors.push(`Sin contacto hace ${signals.daysSinceLastTouch} días.`); }
    else if (signals.daysSinceLastTouch !== null && signals.daysSinceLastTouch > 14) { score -= 10; factors.push(`Contacto algo frío: ${signals.daysSinceLastTouch} días sin novedad.`); }
    if (signals.overdueTasks > 0) { score -= Math.min(signals.overdueTasks * 5, 15); factors.push(`Tiene ${signals.overdueTasks} tarea(s) vencida(s).`); }

    const finalScore = clamp(score);
    const label = finalScore >= 75 ? 'alta' : finalScore >= 45 ? 'media' : 'baja';
    return { score: finalScore, probabilityLabel: label, factors };
  }

  server.tool(
    'predict_cliente_conversion',
    'Predice probabilidad heurística de conversión/cierre de un cliente usando actividad, citas, operaciones, interés y seguimiento.',
    {
      clienteId: z.string().describe('ID del cliente'),
    },
    async ({ clienteId }) => {
      const data = await getClientSignals(clienteId);
      if (!data) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };
      const prediction = scoreClient(data.signals);
      return { content: [{ type: 'text', text: JSON.stringify({ cliente: data.cliente, signals: data.signals, prediction }, null, 2) }] };
    }
  );

  server.tool(
    'score_clientes_prioridad',
    'Rankea clientes por prioridad comercial para decidir a quién contactar primero.',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      limit: z.number().optional(),
    },
    async ({ agenteId, limit }) => {
      const clients = await Cliente().find(agenteId ? { agenteId } : {})
        .select('nombre email telefono agenteId fidelizado createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();

      const ranked = [];
      for (const cliente of clients) {
        const data = await getClientSignals(String(cliente._id));
        if (!data) continue;
        const prediction = scoreClient(data.signals);
        ranked.push({ cliente, signals: data.signals, prediction });
      }

      ranked.sort((a, b) => b.prediction.score - a.prediction.score);
      return { content: [{ type: 'text', text: JSON.stringify({ count: ranked.length, items: ranked.slice(0, safeLimit(limit)) }, null, 2) }] };
    }
  );

  server.tool(
    'recommend_next_action_cliente',
    'Recomienda el próximo paso con un cliente según señales del CRM.',
    {
      clienteId: z.string().describe('ID del cliente'),
    },
    async ({ clienteId }) => {
      const data = await getClientSignals(clienteId);
      if (!data) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };
      const prediction = scoreClient(data.signals);
      const s = data.signals;

      let action = 'recontactar';
      let channel = data.cliente.telefono ? 'whatsapp' : (data.cliente.email ? 'email' : 'nota interna');
      const reasons = [];

      if (s.openOps > 0) {
        action = 'acelerar_cierre';
        reasons.push('Tiene una operación abierta: conviene revisar objeciones, documentación y fecha de cierre.');
      } else if (s.highInterest > 0 || s.completedVisits > 0) {
        action = 'ofrecer_opciones_concretas';
        reasons.push('Hay señales de interés/visitas: conviene enviar 2-3 propiedades concretas o propuesta.');
      } else if (s.daysSinceLastTouch !== null && s.daysSinceLastTouch > 21) {
        action = 'recuperar_cliente_frio';
        reasons.push(`Pasaron ${s.daysSinceLastTouch} días sin contacto.`);
      } else if (s.recentActivities + s.recentInteractions === 0) {
        action = 'calificar_necesidad';
        reasons.push('Faltan señales recientes: conviene confirmar necesidad, presupuesto y zona.');
      } else {
        action = 'seguimiento_suave';
        reasons.push('Tiene movimiento reciente, pero aún no hay señal fuerte de cierre.');
      }

      if (s.overdueTasks > 0) reasons.push('Hay tareas vencidas asociadas; conviene resolverlas antes de crear nuevas.');

      const recommendation = {
        action,
        channel,
        urgency: prediction.score >= 75 || s.openOps > 0 ? 'alta' : prediction.score >= 45 ? 'media' : 'baja',
        suggestedMessage: buildSuggestedClientMessage(data.cliente, action),
        reasons,
      };

      return { content: [{ type: 'text', text: JSON.stringify({ cliente: data.cliente, prediction, signals: s, recommendation }, null, 2) }] };
    }
  );

  function buildSuggestedClientMessage(cliente, action) {
    const name = (cliente.nombre || '').split(' ')[0] || 'como estas';
    if (action === 'acelerar_cierre') return `Hola ${name}, queria saber si pudiste revisar la propuesta y si hay algo que necesites aclarar para avanzar.`;
    if (action === 'ofrecer_opciones_concretas') return `Hola ${name}, estuve revisando opciones que pueden encajar con lo que buscabas. Te paso algunas alternativas y me decis cual te interesa ver?`;
    if (action === 'recuperar_cliente_frio') return `Hola ${name}, como estas? Te escribo para saber si seguis buscando o si cambio algo en lo que necesitas.`;
    return `Hola ${name}, queria confirmar algunos datos para ayudarte mejor: zona, presupuesto y tipo de propiedad que estas buscando.`;
  }

  server.tool(
    'suggest_propiedades_for_cliente',
    'Sugiere propiedades disponibles para un cliente según señales de interés, visitas, operaciones y presupuesto inferido.',
    {
      clienteId: z.string().describe('ID del cliente'),
      limit: z.number().optional(),
    },
    async ({ clienteId, limit }) => {
      const data = await getClientSignals(clienteId);
      if (!data) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };

      const interactedPropertyIds = new Set([
        ...data.citas.map((c) => String(c.propiedadId || '')).filter(Boolean),
        ...data.operaciones.map((o) => String(o.propiedadId || '')).filter(Boolean),
        ...data.interactions.map((i) => String(i.propiedadId || '')).filter(Boolean),
      ]);

      const interestedProps = await Propiedad().find({ _id: { $in: [...interactedPropertyIds] } })
        .select('price moneda metadata address title status agentId')
        .lean();
      const prices = interestedProps.map((p) => Number(p.price)).filter((p) => p > 0);
      const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
      const preferredCurrency = interestedProps.find((p) => p.moneda)?.moneda || 'USD';
      const preferredType = data.interactions.find((i) => i.preferencias?.tipo)?.preferencias?.tipo || '';
      const preferredText = [
        ...data.interactions.map((i) => `${i.descripcion || ''} ${i.preferencias?.detalle || ''}`),
        ...data.activities.map((a) => a.notes || ''),
      ].join(' ').toLowerCase();

      const filter = { status: 'Disponible', published: true };
      if (avgPrice) {
        filter.price = { $gte: avgPrice * 0.75, $lte: avgPrice * 1.25 };
        filter.moneda = preferredCurrency;
      }
      if (data.cliente.agenteId) filter.agentId = data.cliente.agenteId;

      let props = await Propiedad().find(filter)
        .select('title description address price moneda status published featured agentId slug ownerId metadata updatedAt')
        .sort({ featured: -1, updatedAt: -1 })
        .limit(100)
        .lean();
      if (props.length < safeLimit(limit)) {
        props = await Propiedad().find({ status: 'Disponible', published: true })
          .select('title description address price moneda status published featured agentId slug ownerId metadata updatedAt')
          .sort({ featured: -1, updatedAt: -1 })
          .limit(100)
          .lean();
      }

      const suggestions = props
        .filter((p) => !interactedPropertyIds.has(String(p._id)))
        .map((p) => {
          let score = 30;
          const reasons = [];
          if (p.featured) { score += 10; reasons.push('Propiedad destacada.'); }
          if (data.cliente.agenteId && String(p.agentId || '') === String(data.cliente.agenteId)) { score += 10; reasons.push('Pertenece al mismo agente.'); }
          if (avgPrice && p.price) {
            const delta = Math.abs(Number(p.price) - avgPrice) / avgPrice;
            const priceScore = Math.max(0, 25 - delta * 50);
            score += priceScore;
            reasons.push(`Precio cercano al presupuesto inferido (${preferredCurrency} ${Math.round(avgPrice)}).`);
          }
          if (preferredType && `${p.metadata?.tipoPropiedad || p.metadata?.tipo || ''}`.toLowerCase().includes(preferredType.toLowerCase())) {
            score += 12;
            reasons.push('Coincide con tipo de propiedad preferido.');
          }
          const haystack = `${p.title || ''} ${p.description || ''} ${p.address || ''}`.toLowerCase();
          for (const token of ['pileta', 'garage', 'terraza', 'jardin', 'centro', 'playa', 'departamento', 'casa']) {
            if (preferredText.includes(token) && haystack.includes(token)) {
              score += 5;
              reasons.push(`Coincide con preferencia: ${token}.`);
            }
          }
          return { propiedad: p, matchScore: clamp(score), reasons };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, safeLimit(limit));

      return { content: [{ type: 'text', text: JSON.stringify({
        cliente: data.cliente,
        inferredPreferences: { avgPrice, preferredCurrency, preferredType, interactedPropertyIds: [...interactedPropertyIds] },
        count: suggestions.length,
        suggestions,
      }, null, 2) }] };
    }
  );

  server.tool(
    'find_clientes_for_propiedad',
    'Sugiere clientes a quienes ofrecer una propiedad disponible.',
    {
      propiedadId: z.string().describe('ID de la propiedad'),
      limit: z.number().optional(),
    },
    async ({ propiedadId, limit }) => {
      const propiedad = await Propiedad().findById(propiedadId).lean();
      if (!propiedad) return { content: [{ type: 'text', text: 'Propiedad no encontrada' }], isError: true };

      const clients = await Cliente().find(propiedad.agentId ? { agenteId: propiedad.agentId } : {})
        .select('nombre email telefono agenteId fidelizado createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();

      const suggestions = [];
      for (const cliente of clients) {
        const data = await getClientSignals(String(cliente._id));
        if (!data) continue;
        const interestedPropertyIds = new Set([
          ...data.citas.map((c) => String(c.propiedadId || '')).filter(Boolean),
          ...data.operaciones.map((o) => String(o.propiedadId || '')).filter(Boolean),
          ...data.interactions.map((i) => String(i.propiedadId || '')).filter(Boolean),
        ]);
        const previousProps = await Propiedad().find({ _id: { $in: [...interestedPropertyIds] } }).select('price moneda address title metadata').lean();
        const prices = previousProps.map((p) => Number(p.price)).filter((p) => p > 0);
        const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

        let score = scoreClient(data.signals).score * 0.45;
        const reasons = [];
        if (data.signals.openOps > 0) {
          score -= 15;
          reasons.push('Ya tiene una operación abierta; revisar antes de ofrecer.');
        }
        if (avgPrice && propiedad.price) {
          const delta = Math.abs(Number(propiedad.price) - avgPrice) / avgPrice;
          score += Math.max(0, 30 - delta * 60);
          reasons.push(`Precio compatible con intereses previos (promedio ${Math.round(avgPrice)} ${propiedad.moneda}).`);
        }
        if (data.signals.highInterest > 0) {
          score += 12;
          reasons.push('Cliente con interés alto registrado.');
        }
        if (data.signals.daysSinceLastTouch !== null && data.signals.daysSinceLastTouch <= 14) {
          score += 10;
          reasons.push('Cliente activo recientemente.');
        }
        if (cliente.telefono || cliente.email) {
          score += 5;
          reasons.push('Tiene canal de contacto disponible.');
        }

        suggestions.push({ cliente, matchScore: clamp(score), signals: data.signals, reasons });
      }

      suggestions.sort((a, b) => b.matchScore - a.matchScore);
      return { content: [{ type: 'text', text: JSON.stringify({ propiedad, count: suggestions.length, suggestions: suggestions.slice(0, safeLimit(limit)) }, null, 2) }] };
    }
  );

  server.tool(
    'predict_propiedad_sale_time',
    'Estima salud comercial y tiempo probable de salida de una propiedad según precio, antigüedad, views, citas y operaciones.',
    {
      propiedadId: z.string().describe('ID de la propiedad'),
    },
    async ({ propiedadId }) => {
      const propiedad = await Propiedad().findById(propiedadId).lean();
      if (!propiedad) return { content: [{ type: 'text', text: 'Propiedad no encontrada' }], isError: true };

      const since30 = daysAgo(30);
      const sameMarketFilter = {
        status: 'Disponible',
        moneda: propiedad.moneda,
        ...(propiedad.agentId ? { agentId: propiedad.agentId } : {}),
      };
      const [views, citas, activities, ops, marketAgg] = await Promise.all([
        PropertyView().countDocuments({ propertyId: String(propiedad._id), createdAt: { $gte: since30 } }).catch(() => 0),
        Cita().find({ propiedadId: String(propiedad._id) }).sort({ fecha: -1 }).limit(20).lean(),
        Activity().find({ propertyId: String(propiedad._id) }).sort({ createdAt: -1 }).limit(20).lean(),
        Operacion().find({ propiedadId: String(propiedad._id) }).sort({ createdAt: -1 }).limit(10).lean(),
        Propiedad().aggregate([
          { $match: sameMarketFilter },
          { $group: { _id: null, avgPrice: { $avg: '$price' }, count: { $sum: 1 } } },
        ]),
      ]);

      const avgMarketPrice = marketAgg[0]?.avgPrice || null;
      const propertyAge = ageDays(propiedad.createdAt) || 0;
      const daysSinceUpdate = ageDays(propiedad.updatedAt) || 0;
      const recentCitas = citas.filter((c) => new Date(c.fecha || c.createdAt) >= since30).length;
      const recentActivities = activities.filter((a) => new Date(a.createdAt) >= since30).length;
      const openOps = ops.filter((o) => !['Cerrada', 'Completada', 'Cancelada', 'Finalizada'].includes(o.estado || '')).length;

      let health = 50;
      const factors = [];
      if (views > 20) { health += 15; factors.push(`Buenas visualizaciones recientes: ${views}.`); }
      else if (views > 5) { health += 7; factors.push(`Visualizaciones moderadas: ${views}.`); }
      else { health -= 10; factors.push('Pocas visualizaciones recientes.'); }
      if (recentCitas > 0) { health += Math.min(recentCitas * 10, 20); factors.push(`Tuvo ${recentCitas} cita(s) recientes.`); }
      if (recentActivities > 0) { health += Math.min(recentActivities * 4, 12); factors.push(`Tuvo ${recentActivities} actividades recientes.`); }
      if (openOps > 0) { health += 20; factors.push('Tiene operación abierta.'); }
      if (avgMarketPrice && propiedad.price > avgMarketPrice * 1.2) { health -= 18; factors.push('Precio más de 20% arriba del promedio comparable interno.'); }
      if (propertyAge > 120) { health -= 15; factors.push(`Publicación antigua: ${propertyAge} días.`); }
      else if (propertyAge > 60) { health -= 8; factors.push(`Más de ${propertyAge} días en cartera.`); }
      if (daysSinceUpdate > 30) { health -= 8; factors.push(`Sin actualización hace ${daysSinceUpdate} días.`); }
      if (!propiedad.published) { health -= 25; factors.push('No está publicada.'); }

      const healthScore = clamp(health);
      const estimatedDaysToClose = healthScore >= 80 ? '0-30' : healthScore >= 60 ? '30-60' : healthScore >= 40 ? '60-120' : '120+';
      const recommendation = healthScore < 45
        ? 'Revisar precio, mejorar publicación y activar campaña/seguimiento.'
        : healthScore < 65
          ? 'Mantener seguimiento y reforzar difusión.'
          : 'Buen ritmo comercial; priorizar interesados y visitas.';

      return { content: [{ type: 'text', text: JSON.stringify({
        propiedad,
        signals: { views30d: views, recentCitas, recentActivities, openOps, avgMarketPrice, propertyAge, daysSinceUpdate },
        prediction: { healthScore, estimatedDaysToClose, recommendation, factors },
      }, null, 2) }] };
    }
  );

  server.tool(
    'recommend_price_adjustment',
    'Recomienda si conviene ajustar precio de una propiedad según mercado interno y engagement.',
    {
      propiedadId: z.string().describe('ID de la propiedad'),
    },
    async ({ propiedadId }) => {
      const propiedad = await Propiedad().findById(propiedadId).lean();
      if (!propiedad) return { content: [{ type: 'text', text: 'Propiedad no encontrada' }], isError: true };

      const market = await Propiedad().aggregate([
        {
          $match: {
            _id: { $ne: propiedad._id },
            status: 'Disponible',
            moneda: propiedad.moneda,
            price: { $gt: 0 },
          },
        },
        { $group: { _id: null, avgPrice: { $avg: '$price' }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' }, count: { $sum: 1 } } },
      ]);
      const views30d = await PropertyView().countDocuments({ propertyId: String(propiedad._id), createdAt: { $gte: daysAgo(30) } }).catch(() => 0);
      const avgPrice = market[0]?.avgPrice || null;
      const current = Number(propiedad.price) || 0;
      let recommendation = 'mantener';
      let suggestedPrice = current;
      const reasons = [];

      if (!avgPrice || market[0].count < 3) {
        reasons.push('No hay suficientes comparables internos para una recomendación fuerte.');
      } else {
        const delta = (current - avgPrice) / avgPrice;
        if (delta > 0.2 && views30d < 10) {
          recommendation = 'bajar';
          suggestedPrice = Math.round(avgPrice * 1.05);
          reasons.push('Precio alto frente al promedio interno y bajo engagement.');
        } else if (delta < -0.15 && views30d > 20) {
          recommendation = 'evaluar_suba_o_destacar';
          suggestedPrice = Math.round(Math.min(avgPrice * 0.95, current * 1.08));
          reasons.push('Precio bajo frente al mercado y buen engagement.');
        } else {
          reasons.push('Precio razonable frente al promedio interno.');
        }
      }
      if (ageDays(propiedad.updatedAt) > 30) reasons.push('Conviene actualizar descripción/fotos aunque no se cambie precio.');

      return { content: [{ type: 'text', text: JSON.stringify({
        propiedad,
        market: market[0] || null,
        signals: { views30d, daysSinceUpdate: ageDays(propiedad.updatedAt) },
        recommendation: { action: recommendation, currentPrice: current, suggestedPrice, moneda: propiedad.moneda, reasons },
      }, null, 2) }] };
    }
  );

  server.tool(
    'forecast_ventas',
    'Proyecta cierre de ventas/alquileres del período usando run-rate histórico simple.',
    {
      agenteId: z.string().optional(),
      period: z.string().optional().describe('this_month | next_30d | this_year (default this_month)'),
    },
    async ({ agenteId, period }) => {
      const now = new Date();
      let start;
      let end;
      if (period === 'this_year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
      } else if (period === 'next_30d') {
        start = daysAgo(30);
        end = new Date(Date.now() + 30 * 86400000);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
      const elapsedDays = Math.max(1, (now - start) / 86400000);
      const totalDays = Math.max(elapsedDays, (end - start) / 86400000);
      const match = {
        ...(agenteId ? { agenteId } : {}),
        createdAt: { $gte: start, $lte: now },
      };
      const actual = await Operacion().aggregate([
        { $match: match },
        {
          $group: {
            _id: '$moneda',
            count: { $sum: 1 },
            monto: { $sum: '$monto' },
            comisiones: { $sum: '$comisionMonto' },
          },
        },
      ]);
      const forecast = actual.map((row) => ({
        moneda: row._id || 'N/A',
        actualCount: row.count,
        actualMonto: row.monto,
        actualComisiones: row.comisiones,
        projectedCount: Math.round(row.count / elapsedDays * totalDays),
        projectedMonto: Math.round(row.monto / elapsedDays * totalDays),
        projectedComisiones: Math.round(row.comisiones / elapsedDays * totalDays),
      }));

      return { content: [{ type: 'text', text: JSON.stringify({
        period: period || 'this_month',
        range: { start: start.toISOString(), now: now.toISOString(), end: end.toISOString(), elapsedDays: Math.round(elapsedDays), totalDays: Math.round(totalDays) },
        forecast,
        caveat: 'Proyección lineal simple basada en run-rate; no reemplaza criterio comercial.',
      }, null, 2) }] };
    }
  );

  server.tool(
    'get_kpi_anomalies',
    'Detecta anomalías simples comparando últimos 7 días contra los 7 días previos en clientes, operaciones, citas, tareas y marketing.',
    {
      agenteId: z.string().optional(),
    },
    async ({ agenteId }) => {
      const now = new Date();
      const last7 = daysAgo(7);
      const prev14 = daysAgo(14);
      const base = agenteId ? { agenteId } : {};
      const taskBase = agenteId ? { $or: [{ agenteId }, { assigneeId: agenteId }, { creatorId: agenteId }] } : {};

      const [currClientes, prevClientes, currOps, prevOps, currCitas, prevCitas, currTasks, prevTasks, currMarketing, prevMarketing] = await Promise.all([
        Cliente().countDocuments({ ...base, createdAt: { $gte: last7, $lte: now } }),
        Cliente().countDocuments({ ...base, createdAt: { $gte: prev14, $lt: last7 } }),
        Operacion().countDocuments({ ...base, createdAt: { $gte: last7, $lte: now } }),
        Operacion().countDocuments({ ...base, createdAt: { $gte: prev14, $lt: last7 } }),
        Cita().countDocuments({ ...base, fecha: { $gte: last7, $lte: now } }),
        Cita().countDocuments({ ...base, fecha: { $gte: prev14, $lt: last7 } }),
        Tarea().countDocuments({ ...taskBase, createdAt: { $gte: last7, $lte: now } }),
        Tarea().countDocuments({ ...taskBase, createdAt: { $gte: prev14, $lt: last7 } }),
        CampaignMetrics().aggregate([{ $match: { ...base, date: { $gte: last7, $lte: now } } }, { $group: { _id: null, leads: { $sum: '$leads' }, spend: { $sum: '$spend' }, clicks: { $sum: '$clicks' } } }]).catch(() => []),
        CampaignMetrics().aggregate([{ $match: { ...base, date: { $gte: prev14, $lt: last7 } } }, { $group: { _id: null, leads: { $sum: '$leads' }, spend: { $sum: '$spend' }, clicks: { $sum: '$clicks' } } }]).catch(() => []),
      ]);

      const metrics = [
        { name: 'clientes_nuevos', current: currClientes, previous: prevClientes },
        { name: 'operaciones', current: currOps, previous: prevOps },
        { name: 'citas', current: currCitas, previous: prevCitas },
        { name: 'tareas_creadas', current: currTasks, previous: prevTasks },
        { name: 'marketing_leads', current: currMarketing[0]?.leads || 0, previous: prevMarketing[0]?.leads || 0 },
        { name: 'marketing_clicks', current: currMarketing[0]?.clicks || 0, previous: prevMarketing[0]?.clicks || 0 },
        { name: 'marketing_spend', current: currMarketing[0]?.spend || 0, previous: prevMarketing[0]?.spend || 0 },
      ].map((m) => {
        const changePct = m.previous === 0 ? (m.current > 0 ? 100 : 0) : ((m.current - m.previous) / m.previous) * 100;
        const severity = Math.abs(changePct) >= 50 ? 'alta' : Math.abs(changePct) >= 25 ? 'media' : 'baja';
        return { ...m, changePct: Math.round(changePct), severity };
      });

      const anomalies = metrics.filter((m) => m.severity !== 'baja');
      return { content: [{ type: 'text', text: JSON.stringify({ range: { currentFrom: last7.toISOString(), previousFrom: prev14.toISOString() }, metrics, anomalies }, null, 2) }] };
    }
  );
}

module.exports = { registerPrediccionTools };
