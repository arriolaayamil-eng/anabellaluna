const express = require('express');
const Cliente = require('../models/Cliente');
const Propiedad = require('../models/Propiedad');
const Tarea = require('../models/Tarea');
const Cita = require('../models/Cita');
const Operacion = require('../models/Operacion');
const Activity = require('../models/Activity');
const Agente = require('../models/Agente');
const AgentMetrics = require('../models/AgentMetrics');
const ClientInteraction = require('../models/ClientInteraction');
const {
  authenticateToken,
  requireRole,
} = require('../auth');

const router = express.Router();

// ============ HELPERS ============
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COMMISSION_RATE = 0.06; // 6% default

// ============ GET /admin/stats/dashboard ============
router.get('/dashboard', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // ── All data ──
    const [allClientes, allPropiedades, allOps, allAgentes, allActivities, allCitas, allTareas] = await Promise.all([
      Cliente.find({}).lean(),
      Propiedad.find({}).lean(),
      Operacion.find({}).lean(),
      Agente.find({}).lean(),
      Activity.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).sort({ createdAt: -1 }).limit(20).lean(),
      Cita.find({}).lean(),
      Tarea.find({}).lean(),
    ]);

    // ── Operations this year ──
    const opsThisYear = allOps.filter(o => new Date(o.createdAt) >= yearStart);
    const opsThisMonth = allOps.filter(o => {
      const d = new Date(o.createdAt);
      return d >= thisMonthStart && d <= thisMonthEnd;
    });
    const opsLastMonth = allOps.filter(o => {
      const d = new Date(o.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const closedStatuses = ['Cerrada', 'Completada'];
    const ventasYear = opsThisYear.filter(o => o.tipo === 'Venta');
    const alquileresYear = opsThisYear.filter(o => o.tipo === 'Alquiler');
    const ventasClosed = ventasYear.filter(o => closedStatuses.includes(o.estado));
    const alquileresClosed = alquileresYear.filter(o => closedStatuses.includes(o.estado));

    // ── Financial KPIs ──
    const ingresosVentas = ventasClosed.reduce((s, o) => s + (o.monto || 0), 0);
    const ingresosAlquileres = alquileresClosed.reduce((s, o) => s + (o.monto || 0), 0);
    const ingresosTotales = ingresosVentas + ingresosAlquileres;
    const comisionesTotales = ingresosTotales * COMMISSION_RATE;
    const totalOpsCount = ventasClosed.length + alquileresClosed.length;
    const ticketPromedio = totalOpsCount > 0 ? Math.round(ingresosTotales / totalOpsCount) : 0;

    // Previous month for comparison
    const opsLastMonthClosed = opsLastMonth.filter(o => closedStatuses.includes(o.estado));
    const ingresosLastMonth = opsLastMonthClosed.reduce((s, o) => s + (o.monto || 0), 0);
    const ticketLastMonth = opsLastMonthClosed.length > 0 ? Math.round(ingresosLastMonth / opsLastMonthClosed.length) : 0;

    // Conversion rate: leads → closed
    const totalLeads = allClientes.length;
    const totalCerrados = allClientes.filter(c => (c.metadata?.estado) === 'Cerrado').length;
    const tasaConversion = totalLeads > 0 ? Math.round((totalCerrados / totalLeads) * 100) : 0;

    // Previous month conversion
    const clientesLastMonth = allClientes.filter(c => {
      const d = new Date(c.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const cerradosLastMonth = clientesLastMonth.filter(c => (c.metadata?.estado) === 'Cerrado').length;
    const convLastMonth = clientesLastMonth.length > 0 ? Math.round((cerradosLastMonth / clientesLastMonth.length) * 100) : 0;

    // Days to close average (from Operacion timestamps)
    const opsWithTime = opsThisYear.filter(o => closedStatuses.includes(o.estado) && o.createdAt);
    const diasPromVenta = opsWithTime.length > 0
      ? Math.round(opsWithTime.reduce((s, o) => {
          const created = new Date(o.createdAt);
          const updated = o.updatedAt ? new Date(o.updatedAt) : now;
          return s + ((updated - created) / (1000 * 60 * 60 * 24));
        }, 0) / opsWithTime.length)
      : 0;

    const yearGoal = 12000000; // configurable
    const yearProgress = ingresosTotales > 0 ? Math.round((ingresosTotales / yearGoal) * 100) : 0;

    function pctChange(curr, prev) {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const pct = Math.round(((curr - prev) / prev) * 100);
      return `${pct >= 0 ? '+' : ''}${pct}%`;
    }

    // ── Monthly revenue breakdown (last 12 months) ──
    const revenueMonthly = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mOps = allOps.filter(o => {
        const created = new Date(o.createdAt);
        return created >= mStart && created <= mEnd && closedStatuses.includes(o.estado);
      });
      const mVentas = mOps.filter(o => o.tipo === 'Venta').reduce((s, o) => s + (o.monto || 0), 0);
      const mAlquileres = mOps.filter(o => o.tipo === 'Alquiler').reduce((s, o) => s + (o.monto || 0), 0);
      const mComisiones = (mVentas + mAlquileres) * COMMISSION_RATE;
      revenueMonthly.push({
        mes: MONTH_LABELS[mStart.getMonth()],
        ventas: Math.round(mVentas),
        alquileres: Math.round(mAlquileres),
        comisiones: Math.round(mComisiones),
        ventasCount: mOps.filter(o => o.tipo === 'Venta').length,
        alquileresCount: mOps.filter(o => o.tipo === 'Alquiler').length,
      });
    }

    // ── Quarterly projection ──
    const quarters = [];
    for (let q = 0; q < 4; q++) {
      const qStart = new Date(now.getFullYear(), q * 3, 1);
      const qEnd = new Date(now.getFullYear(), (q + 1) * 3, 0, 23, 59, 59, 999);
      const qOps = allOps.filter(o => {
        const created = new Date(o.createdAt);
        return created >= qStart && created <= qEnd && closedStatuses.includes(o.estado);
      });
      const qRevenue = qOps.reduce((s, o) => s + (o.monto || 0), 0);
      const isPast = qEnd < now;
      quarters.push({
        quarter: `Q${q + 1}`,
        actual: isPast || (qStart <= now && now <= qEnd) ? Math.round(qRevenue) : null,
        projected: Math.round(yearGoal / 4),
        goal: Math.round(yearGoal / 4),
      });
    }

    // ── Property type breakdown ──
    const propTypes = {};
    allPropiedades.forEach(p => {
      const tipo = (p.metadata?.tipoPropiedad) || (p.metadata?.tipo) || 'Otro';
      propTypes[tipo] = (propTypes[tipo] || 0) + 1;
    });
    const propTypeLabels = Object.keys(propTypes).length > 0 ? Object.keys(propTypes) : ['Sin datos'];
    const propTypeSeries = Object.keys(propTypes).length > 0 ? Object.values(propTypes) : [0];
    const propiedadesDisponibles = allPropiedades.filter(p => p.status === 'Disponible').length;

    // ── Income source breakdown ──
    const ventasResidencial = ventasClosed.filter(o => {
      const tipo = o.metadata?.tipoPropiedad || '';
      return tipo !== 'Comercial' && tipo !== 'Oficina' && tipo !== 'Local';
    }).reduce((s, o) => s + (o.monto || 0), 0);
    const ventasComercial = ventasClosed.filter(o => {
      const tipo = o.metadata?.tipoPropiedad || '';
      return tipo === 'Comercial' || tipo === 'Oficina' || tipo === 'Local';
    }).reduce((s, o) => s + (o.monto || 0), 0);
    const ingAlq = ingresosAlquileres;
    const servicios = Math.round(ingresosTotales * 0.02); // estimated services

    // ── Agent performance ──
    const agentStats = await Promise.all(allAgentes.map(async (agente) => {
      const agenteId = String(agente._id);
      const agOps = allOps.filter(o => String(o.agenteId) === agenteId);
      const agOpsClosed = agOps.filter(o => closedStatuses.includes(o.estado));
      const agVentas = agOpsClosed.filter(o => o.tipo === 'Venta');
      const agAlquileres = agOpsClosed.filter(o => o.tipo === 'Alquiler');
      const agIngresos = agOpsClosed.reduce((s, o) => s + (o.monto || 0), 0);
      const agComision = agIngresos * COMMISSION_RATE;
      const agClientes = allClientes.filter(c => String(c.agenteId) === agenteId);
      const agLeads = agClientes.length;
      const agCerrados = agClientes.filter(c => (c.metadata?.estado) === 'Cerrado').length;
      const agConversion = agLeads > 0 ? Math.round((agCerrados / agLeads) * 100) : 0;

      // Average days to close for this agent
      const agOpsWithTime = agOpsClosed.filter(o => o.createdAt);
      const agDiasCierre = agOpsWithTime.length > 0
        ? Math.round(agOpsWithTime.reduce((s, o) => {
            const created = new Date(o.createdAt);
            const updated = o.updatedAt ? new Date(o.updatedAt) : now;
            return s + ((updated - created) / (1000 * 60 * 60 * 24));
          }, 0) / agOpsWithTime.length)
        : 0;

      // Valor cartera (propiedades asignadas)
      const agProps = allPropiedades.filter(p => String(p.agentId) === agenteId);
      const valorCartera = agProps.reduce((s, p) => s + (p.price || 0), 0);

      // Rating from AgentMetrics if available
      const latestMetrics = await AgentMetrics.findOne({ agenteId: agente._id }).sort({ periodStart: -1 }).lean();
      const calificacion = latestMetrics?.avgRating || 0;

      // Month-over-month trend
      const agOpsThisMonth = agOps.filter(o => {
        const d = new Date(o.createdAt);
        return d >= thisMonthStart && closedStatuses.includes(o.estado);
      });
      const agOpsLastMonth = agOps.filter(o => {
        const d = new Date(o.createdAt);
        return d >= lastMonthStart && d <= lastMonthEnd && closedStatuses.includes(o.estado);
      });
      const agIngThisMonth = agOpsThisMonth.reduce((s, o) => s + (o.monto || 0), 0);
      const agIngLastMonth = agOpsLastMonth.reduce((s, o) => s + (o.monto || 0), 0);
      const tendencia = pctChange(agIngThisMonth, agIngLastMonth);

      const metaMensual = (agente.metadata?.metaMensual) || 100000;
      const initials = agente.nombre
        ? agente.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'AG';

      return {
        id: agenteId,
        nombre: agente.nombre || 'Sin nombre',
        avatar: initials,
        color: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'][allAgentes.indexOf(agente) % 7],
        ventas: agVentas.length,
        alquileres: agAlquileres.length,
        comision: Math.round(agComision),
        valorCartera: Math.round(valorCartera),
        leads: agLeads,
        leadsConvertidos: agCerrados,
        tasaConversion: agConversion,
        diasPromCierre: agDiasCierre,
        calificacion: Number((calificacion || 0).toFixed(1)),
        tendencia,
        metaMensual,
      };
    }));

    // Sort agents by comision descending and assign ranking
    agentStats.sort((a, b) => b.comision - a.comision);
    agentStats.forEach((a, i) => { a.ranking = i + 1; });

    // ── Team metrics ──
    const teamMetrics = {
      totalAgentes: allAgentes.length,
      totalVentas: agentStats.reduce((s, a) => s + a.ventas, 0),
      totalAlquileres: agentStats.reduce((s, a) => s + a.alquileres, 0),
      totalComisiones: agentStats.reduce((s, a) => s + a.comision, 0),
      promedioConversion: agentStats.length > 0 ? Math.round(agentStats.reduce((s, a) => s + a.tasaConversion, 0) / agentStats.length) : 0,
      promedioDiasCierre: agentStats.length > 0 ? Math.round(agentStats.reduce((s, a) => s + a.diasPromCierre, 0) / agentStats.length) : 0,
    };

    // ── Recent activities (last 24h) ──
    const actividadesRecientes = [];
    for (const act of allActivities.slice(0, 6)) {
      let agenteNombre = '';
      if (act.agenteId) {
        const ag = allAgentes.find(a => String(a._id) === String(act.agenteId));
        if (ag) {
          const parts = ag.nombre.split(' ');
          agenteNombre = parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        }
      }
      const diffMs = now - new Date(act.createdAt);
      const diffH = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
      const tiempo = diffH >= 24 ? `${Math.round(diffH / 24)}d` : `${diffH}h`;

      actividadesRecientes.push({
        tipo: act.type || 'otro',
        texto: act.notes || `Actividad: ${act.type}`,
        agente: agenteNombre || 'Sistema',
        tiempo,
        monto: act.metadata?.monto ? `$${Number(act.metadata.monto).toLocaleString()}` : null,
        comision: act.metadata?.monto ? `$${Math.round(Number(act.metadata.monto) * COMMISSION_RATE).toLocaleString()}` : null,
      });
    }

    // ── Operations monthly (last 6 months for bar chart) ──
    const opsMonthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mOps = allOps.filter(o => {
        const created = new Date(o.createdAt);
        return created >= mStart && created <= mEnd && closedStatuses.includes(o.estado);
      });
      opsMonthly.push({
        mes: MONTH_LABELS[mStart.getMonth()],
        ventas: mOps.filter(o => o.tipo === 'Venta').length,
        alquileres: mOps.filter(o => o.tipo === 'Alquiler').length,
      });
    }

    // ── Footer stats ──
    const consultasTotal = await Activity.countDocuments({ type: { $in: ['enquiry', 'visit_scheduled'] } });
    const clientesNuevosMes = allClientes.filter(c => new Date(c.createdAt) >= thisMonthStart).length;

    // ── Interaction metrics ──
    const totalInteractions = await ClientInteraction.countDocuments({});
    const interactionsThisMonth = await ClientInteraction.countDocuments({ createdAt: { $gte: thisMonthStart } });
    const interactionsLastMonth = await ClientInteraction.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } });
    const interactionsByType = await ClientInteraction.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
    ]);
    const interactionTypeCounts = {};
    interactionsByType.forEach(r => { interactionTypeCounts[r._id] = r.count; });

    // Clients with expired lifebar (need recontact)
    const LIFEBAR_DAYS = 7;
    const lifebarThreshold = new Date(now.getTime() - LIFEBAR_DAYS * 24 * 60 * 60 * 1000);
    const clientesRequiringRecontact = allClientes.filter(c => {
      const lastAct = c.metadata?.ultimaActividad ? new Date(c.metadata.ultimaActividad) : new Date(c.createdAt);
      return lastAct < lifebarThreshold;
    }).length;

    // Avg response time from AgentMetrics
    const allMetrics = await AgentMetrics.find({ period: 'monthly' }).sort({ periodStart: -1 }).limit(allAgentes.length).lean();
    const avgResponseTime = allMetrics.length > 0
      ? (allMetrics.reduce((s, m) => s + (m.avgResponseTimeHours || 0), 0) / allMetrics.length).toFixed(1)
      : '0';
    const avgRating = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((s, m) => s + (m.avgRating || 0), 0) / allMetrics.length * 20) // scale to %
      : 0;

    // Format helpers
    function formatMoney(val) {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
      return `$${val}`;
    }

    res.json({
      // ── Main KPIs ──
      kpis: {
        ingresosTotales: { value: formatMoney(ingresosTotales), raw: ingresosTotales, change: pctChange(ingresosTotales, ingresosLastMonth * 12), yearGoal, yearProgress: `${yearProgress}%` },
        comisiones: { value: formatMoney(comisionesTotales), raw: comisionesTotales, change: pctChange(comisionesTotales, ingresosLastMonth * 12 * COMMISSION_RATE), rate: `${COMMISSION_RATE * 100}%` },
        operaciones: { value: totalOpsCount, ventas: ventasClosed.length, alquileres: alquileresClosed.length, change: `+${opsThisMonth.filter(o => closedStatuses.includes(o.estado)).length}` },
        tasaConversion: { value: `${tasaConversion}%`, change: `${tasaConversion >= convLastMonth ? '+' : ''}${tasaConversion - convLastMonth}pp`, prev: `${convLastMonth}%` },
      },
      // ── Financial metrics ──
      financialMetrics: {
        ticketPromedio: { value: ticketPromedio, change: pctChange(ticketPromedio, ticketLastMonth) },
        margenOperativo: { value: (COMMISSION_RATE * 100).toFixed(1), change: '+0pp' },
        diasPromVenta: { value: diasPromVenta, change: `${diasPromVenta}d` },
        costoPorLead: { value: totalLeads > 0 ? Math.round(comisionesTotales * 0.1 / totalLeads) : 0 },
        leadsTotales: totalLeads,
        propiedades: allPropiedades.length,
        propiedadesDisponibles,
        clientesActivos: allClientes.filter(c => {
          const e = c.metadata?.estado || 'Lead';
          return e !== 'Cerrado' && e !== 'Perdido';
        }).length,
        clientesNuevosMes,
      },
      // ── Revenue chart (12 months) ──
      revenueMonthly: {
        meses: revenueMonthly.map(m => m.mes),
        ventas: revenueMonthly.map(m => m.ventas),
        alquileres: revenueMonthly.map(m => m.alquileres),
        comisiones: revenueMonthly.map(m => m.comisiones),
      },
      // ── Income source breakdown ──
      incomeBreakdown: {
        labels: ['Venta Residencial', 'Venta Comercial', 'Alquileres', 'Servicios'],
        series: [Math.round(ventasResidencial), Math.round(ventasComercial), Math.round(ingAlq), Math.round(servicios)],
        total: formatMoney(ingresosTotales),
      },
      // ── Quarterly projection ──
      quarters,
      // ── Operations monthly (6 months bar) ──
      opsMonthly: {
        meses: opsMonthly.map(m => m.mes),
        ventas: opsMonthly.map(m => m.ventas),
        alquileres: opsMonthly.map(m => m.alquileres),
        totalYTD: totalOpsCount,
      },
      // ── Property types ──
      propertyTypes: { labels: propTypeLabels, series: propTypeSeries, total: allPropiedades.length },
      // ── Conversion ──
      conversionRate: tasaConversion,
      // ── Agents ──
      agentes: agentStats,
      teamMetrics,
      // ── Recent activities ──
      actividades: actividadesRecientes,
      // ── Interaction metrics ──
      interactionMetrics: {
        total: totalInteractions,
        thisMes: interactionsThisMonth,
        changeMes: pctChange(interactionsThisMonth, interactionsLastMonth),
        byType: interactionTypeCounts,
        clientesRequiringRecontact,
      },
      // ── Footer stats ──
      footerStats: {
        consultasTotal,
        tiempoRespuesta: `${avgResponseTime}h`,
        satisfaccion: `${avgRating || 0}%`,
        retencion: `${totalLeads > 0 ? Math.round(((totalLeads - allClientes.filter(c => (c.metadata?.estado) === 'Perdido').length) / totalLeads) * 100) : 0}%`,
      },
    });
  } catch (err) {
    console.error('Admin dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
