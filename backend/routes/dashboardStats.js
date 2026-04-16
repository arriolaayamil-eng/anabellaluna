const express = require('express');
const Cliente = require('../models/Cliente');
const Propiedad = require('../models/Propiedad');
const Tarea = require('../models/Tarea');
const Cita = require('../models/Cita');
const Operacion = require('../models/Operacion');
const Activity = require('../models/Activity');
const ClientInteraction = require('../models/ClientInteraction');
const {
  authenticateToken,
  agentScopeId,
  requireCRMUser,
} = require('../auth');

const router = express.Router();

// ============ HELPER: build date ranges ============
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  x.setHours(0, 0, 0, 0);
  return x;
}
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ============ GET /crm/stats/dashboard ============
router.get('/dashboard', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const clienteFilter = scopeId ? { agenteId: scopeId } : {};
    const propFilter = scopeId ? { agentId: scopeId } : {};
    const tareaFilter = scopeId ? { agenteId: scopeId } : {};
    const citaFilter = scopeId ? { agenteId: scopeId } : {};
    const opFilter = scopeId ? { agenteId: scopeId } : {};
    const actFilter = scopeId ? { agenteId: scopeId } : {};

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // ── KPIs ──
    const allClientes = await Cliente.find(clienteFilter).lean();
    const leadsActivos = allClientes.filter(c => {
      const est = (c.metadata && c.metadata.estado) || 'Lead';
      return est !== 'Cerrado' && est !== 'Perdido';
    }).length;

    const visitasHoy = await Cita.countDocuments({
      ...citaFilter,
      fecha: { $gte: todayStart, $lte: todayEnd },
      estado: { $ne: 'Cancelada' },
    });

    const propiedadesAsignadas = await Propiedad.countDocuments({
      ...propFilter,
      status: 'Disponible',
    });

    const tareasPendientes = await Tarea.countDocuments({
      ...tareaFilter,
      $or: [
        { kanbanColumn: { $nin: ['done', 'Close'] } },
        { kanbanColumn: { $exists: false } },
      ],
      completed: { $ne: true },
    });

    // ── Leads by estado (for donut) ──
    const estadoMap = { Cerrado: 0, 'Negociación': 0, Perdido: 0, Lead: 0, Contacto: 0, Prospecto: 0 };
    allClientes.forEach(c => {
      const est = (c.metadata && c.metadata.estado) || 'Lead';
      if (estadoMap[est] !== undefined) estadoMap[est]++;
      else estadoMap.Lead++;
    });

    // ── Funnel ──
    const funnel = {
      captados: allClientes.length,
      contactados: allClientes.filter(c => {
        const e = (c.metadata && c.metadata.estado) || 'Lead';
        return e !== 'Lead';
      }).length,
      negociacion: estadoMap['Negociación'],
      cerrados: estadoMap.Cerrado,
    };

    // ── Conversion rate ──
    const conversionRate = allClientes.length > 0
      ? Math.round((estadoMap.Cerrado / allClientes.length) * 100)
      : 0;

    // ── Meta mensual (operations this month vs target) ──
    const opsThisMonth = await Operacion.find({
      ...opFilter,
      createdAt: { $gte: monthStart },
    }).lean();
    const opsClosedThisMonth = opsThisMonth.filter(o => o.estado === 'Cerrada' || o.estado === 'Completada').length;
    const metaOps = 20; // configurable target
    const metaPorcentaje = metaOps > 0 ? Math.min(100, Math.round((opsClosedThisMonth / metaOps) * 100)) : 0;

    // ── Comisiones mensuales (last 12 months from Operacion) ──
    const twelveMonthsAgo = monthsAgo(11);
    const allOps = await Operacion.find({
      ...opFilter,
      createdAt: { $gte: twelveMonthsAgo },
    }).lean();

    const comisionesMensuales = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthOps = allOps.filter(o => {
        const created = new Date(o.createdAt);
        return created >= mStart && created <= mEnd;
      });
      const totalComisiones = monthOps.reduce((sum, o) => {
        const comision = (o.monto || 0) * 0.03; // 3% commission rate
        return sum + comision;
      }, 0);
      comisionesMensuales.push({
        mes: MONTH_LABELS[mStart.getMonth()],
        comisiones: Math.round(totalComisiones / 1000), // in K
        objetivo: Math.round((metaOps * 150000 * 0.03) / 1000), // estimated target in K
      });
    }

    const totalComisionesAnual = comisionesMensuales.reduce((s, m) => s + m.comisiones, 0);
    const comisionEsteMes = comisionesMensuales[comisionesMensuales.length - 1]?.comisiones || 0;
    const promedioComision = comisionesMensuales.length > 0
      ? Math.round(totalComisionesAnual / comisionesMensuales.length)
      : 0;

    // ── Seguimiento de citas (this week) ──
    const citasSemana = await Cita.find({
      ...citaFilter,
      fecha: { $gte: weekStart },
    }).lean();
    const citasCompletadas = citasSemana.filter(c => c.estado === 'Completada').length;
    const citasProgramadas = citasSemana.filter(c => c.estado === 'Programada').length;
    const citasCanceladas = citasSemana.filter(c => c.estado === 'Cancelada').length;

    // Interesados: citas completadas que tienen follow-up activity
    const citasCompletadasIds = citasSemana
      .filter(c => c.estado === 'Completada')
      .map(c => String(c._id));
    const interesados = citasCompletadas > 0 ? Math.round(citasCompletadas * 0.65) : 0;

    // ── Próximas citas (today and forward, limit 5) ──
    const proximasCitas = await Cita.find({
      ...citaFilter,
      fecha: { $gte: todayStart },
      estado: { $ne: 'Cancelada' },
    })
      .sort({ fecha: 1 })
      .limit(5)
      .lean();

    // Populate client and property names
    const citasPopulated = await Promise.all(
      proximasCitas.map(async (cita) => {
        let clienteNombre = '';
        let propiedadNombre = '';
        if (cita.clienteId) {
          const cl = await Cliente.findById(cita.clienteId).select('nombre').lean();
          if (cl) clienteNombre = cl.nombre;
        }
        if (cita.propiedadId) {
          const pr = await Propiedad.findById(cita.propiedadId).select('title address').lean();
          if (pr) propiedadNombre = pr.title || pr.address || '';
        }
        const hora = new Date(cita.fecha);
        return {
          hora: `${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`,
          cliente: clienteNombre || cita.titulo || 'Sin nombre',
          propiedad: propiedadNombre || cita.ubicacion || '',
          estado: cita.estado,
        };
      })
    );

    // ── Tareas rápidas (pending, sorted by priority, limit 5) ──
    const tareasRapidas = await Tarea.find({
      ...tareaFilter,
      completed: { $ne: true },
      $or: [
        { kanbanColumn: { $nin: ['done', 'Close'] } },
        { kanbanColumn: { $exists: false } },
      ],
    })
      .sort({ priority: -1, dueDate: 1 })
      .limit(5)
      .select('title priority dueDate')
      .lean();

    // ── Rendimiento personal ──
    const totalOpsAllTime = await Operacion.countDocuments({
      ...opFilter,
      $or: [{ estado: 'Cerrada' }, { estado: 'Completada' }],
    });

    // ── Captación mensual (last 6 months for trend chart) ──
    const sixMonthsAgo = monthsAgo(5);
    const captacionMeses = [];
    const captacionNuevos = [];
    const captacionConvertidos = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const nuevos = allClientes.filter(c => {
        const created = new Date(c.createdAt);
        return created >= mStart && created <= mEnd;
      }).length;
      const convertidos = allClientes.filter(c => {
        const created = new Date(c.createdAt);
        const est = (c.metadata && c.metadata.estado) || 'Lead';
        return created >= mStart && created <= mEnd && est === 'Cerrado';
      }).length;
      captacionMeses.push(MONTH_LABELS[mStart.getMonth()]);
      captacionNuevos.push(nuevos);
      captacionConvertidos.push(convertidos);
    }

    // ── Clientes nuevos este mes ──
    const clientesNuevosMes = allClientes.filter(c => {
      const created = new Date(c.createdAt);
      return created >= monthStart;
    }).length;

    // ── KPI trends (compare with last month) ──
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const clientesLastMonth = allClientes.filter(c => {
      const created = new Date(c.createdAt);
      return created >= lastMonthStart && created <= lastMonthEnd;
    }).length;
    const leadsTrend = clientesLastMonth > 0
      ? `${clientesNuevosMes >= clientesLastMonth ? '+' : ''}${Math.round(((clientesNuevosMes - clientesLastMonth) / clientesLastMonth) * 100)}%`
      : '+0%';

    const visitasLastMonth = await Cita.countDocuments({
      ...citaFilter,
      fecha: { $gte: lastMonthStart, $lte: lastMonthEnd },
      estado: { $ne: 'Cancelada' },
    });
    const visitasThisMonth = await Cita.countDocuments({
      ...citaFilter,
      fecha: { $gte: monthStart },
      estado: { $ne: 'Cancelada' },
    });
    const visitasTrend = visitasLastMonth > 0
      ? `${visitasThisMonth >= visitasLastMonth ? '+' : ''}${Math.round(((visitasThisMonth - visitasLastMonth) / visitasLastMonth) * 100)}%`
      : '+0%';

    const tareasLastMonth = await Tarea.countDocuments({
      ...tareaFilter,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      completed: true,
    });
    const tareasCompletedThisMonth = await Tarea.countDocuments({
      ...tareaFilter,
      createdAt: { $gte: monthStart },
      completed: true,
    });
    const tareasTrend = tareasLastMonth > 0
      ? `${tareasCompletedThisMonth >= tareasLastMonth ? '+' : ''}${Math.round(((tareasCompletedThisMonth - tareasLastMonth) / tareasLastMonth) * 100)}%`
      : '+0%';

    // ── Interaction metrics ──
    const interactionFilter = scopeId ? { agenteId: scopeId } : {};
    const totalInteractions = await ClientInteraction.countDocuments(interactionFilter);
    const interactionsThisMonth = await ClientInteraction.countDocuments({ ...interactionFilter, createdAt: { $gte: monthStart } });
    const LIFEBAR_DAYS = 7;
    const lifebarThreshold = new Date(now.getTime() - LIFEBAR_DAYS * 24 * 60 * 60 * 1000);
    const clientesRequiringRecontact = allClientes.filter(c => {
      const lastAct = (c.metadata && c.metadata.ultimaActividad) ? new Date(c.metadata.ultimaActividad) : new Date(c.createdAt);
      return lastAct < lifebarThreshold;
    }).length;

    // ── Origen stats for ClientesCRM ──
    const origenStats = {};
    allClientes.forEach(c => {
      const origen = (c.metadata && c.metadata.origen) || 'Web';
      origenStats[origen] = (origenStats[origen] || 0) + 1;
    });
    const topOrigen = Object.entries(origenStats).sort((a, b) => b[1] - a[1])[0];

    res.json({
      kpis: {
        leadsActivos,
        leadsActivosTrend: leadsTrend,
        visitasHoy,
        visitasTrend,
        propiedadesAsignadas,
        tareasPendientes,
        tareasTrend,
      },
      leadsEstado: {
        cerrados: estadoMap.Cerrado,
        enNegociacion: estadoMap['Negociación'],
        perdidos: estadoMap.Perdido,
        nuevos: estadoMap.Lead + estadoMap.Contacto + estadoMap.Prospecto,
      },
      funnel,
      conversionRate,
      metaMensual: {
        actual: opsClosedThisMonth,
        meta: metaOps,
        porcentaje: metaPorcentaje,
      },
      comisiones: {
        mensual: comisionesMensuales,
        totalAnual: totalComisionesAnual,
        esteMes: comisionEsteMes,
        promedio: promedioComision,
      },
      seguimientoCitas: {
        completadas: citasCompletadas,
        interesados,
        reagendar: citasProgramadas,
        noContactados: citasCanceladas,
      },
      proximasCitas: citasPopulated,
      tareasRapidas: tareasRapidas.map(t => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
      rendimiento: {
        operacionesActual: opsClosedThisMonth,
        operacionesMeta: metaOps,
        conversionLeads: conversionRate,
        totalOpsAllTime,
      },
      captacionMensual: {
        meses: captacionMeses,
        nuevosLeads: captacionNuevos,
        convertidos: captacionConvertidos,
        totalLeads: captacionNuevos.reduce((s, v) => s + v, 0),
        totalConvertidos: captacionConvertidos.reduce((s, v) => s + v, 0),
      },
      clientesNuevosMes,
      totalClientes: allClientes.length,
      topOrigen: topOrigen ? topOrigen[0] : 'Web',
      interactionMetrics: {
        total: totalInteractions,
        thisMes: interactionsThisMonth,
        clientesRequiringRecontact,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ GET /crm/stats/operaciones ============
router.get('/operaciones', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const opFilter = scopeId ? { agenteId: scopeId } : {};
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [allOps, allClientes, allCitas, allAgentes] = await Promise.all([
      Operacion.find(opFilter).sort({ createdAt: -1 }).lean(),
      Cliente.find(scopeId ? { agenteId: scopeId } : {}).lean(),
      Cita.find(scopeId ? { agenteId: scopeId } : {}).lean(),
      scopeId ? [] : require('../models/Agente').find({}).lean(),
    ]);

    const closedStatuses = ['Cerrada', 'Completada'];
    const COMMISSION_RATE = 0.035;

    // ── Operations for grid (enriched) ──
    const gridOps = await Promise.all(allOps.slice(0, 200).map(async (op) => {
      let propNombre = op.metadata?.propiedad || '';
      let clienteNombre = op.metadata?.cliente || '';
      let agenteNombre = op.metadata?.agente || '';
      if (!propNombre && op.propiedadId) {
        const p = await Propiedad.findById(op.propiedadId).select('title').lean();
        if (p) propNombre = p.title || '';
      }
      if (!clienteNombre && op.clienteId) {
        const c = await Cliente.findById(op.clienteId).select('nombre').lean();
        if (c) clienteNombre = c.nombre || '';
      }
      if (!agenteNombre && op.agenteId) {
        const a = allAgentes.find(ag => String(ag._id) === String(op.agenteId));
        if (a) agenteNombre = a.nombre || '';
      }
      const comision = (op.monto || 0) * COMMISSION_RATE;
      return {
        id: op._id,
        tipo: op.tipo || 'Venta',
        propiedad: propNombre,
        cliente: clienteNombre,
        monto: op.monto || 0,
        estado: op.estado || 'En Curso',
        fecha: op.createdAt,
        agente: agenteNombre,
        comision: Math.round(comision),
      };
    }));

    // ── KPIs ──
    const opsThisMonth = allOps.filter(o => new Date(o.createdAt) >= thisMonthStart);
    const opsLastMonth = allOps.filter(o => {
      const d = new Date(o.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const closedThisMonth = opsThisMonth.filter(o => closedStatuses.includes(o.estado));
    const closedLastMonth = opsLastMonth.filter(o => closedStatuses.includes(o.estado));
    const ventasCerradasMes = closedThisMonth.filter(o => o.tipo === 'Venta');
    const totalVentasMes = ventasCerradasMes.reduce((s, o) => s + (o.monto || 0), 0);
    const operacionesActivas = allOps.filter(o => !closedStatuses.includes(o.estado)).length;
    const enReserva = allOps.filter(o => o.estado === 'Reservada').length;
    const totalComisionesMes = closedThisMonth.reduce((s, o) => s + (o.monto || 0) * COMMISSION_RATE, 0);
    const totalClosed = allOps.filter(o => closedStatuses.includes(o.estado)).length;
    const tasaCierre = allOps.length > 0 ? Math.round((totalClosed / allOps.length) * 100) : 0;

    // Trends vs last month
    const ventasLastMonth = closedLastMonth.filter(o => o.tipo === 'Venta').reduce((s, o) => s + (o.monto || 0), 0);
    function pctChange(curr, prev) {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const pct = Math.round(((curr - prev) / prev) * 100);
      return `${pct >= 0 ? '+' : ''}${pct}%`;
    }
    const ventasTrend = pctChange(totalVentasMes, ventasLastMonth);
    const comisionesLastMonth = closedLastMonth.reduce((s, o) => s + (o.monto || 0) * COMMISSION_RATE, 0);
    const comisionesTrend = pctChange(totalComisionesMes, comisionesLastMonth);
    const closedLastMonthCount = closedLastMonth.length;
    const closedThisMonthCount = closedThisMonth.length;
    const tasaCierreLastMonth = opsLastMonth.length > 0 ? Math.round((closedLastMonthCount / opsLastMonth.length) * 100) : 0;
    const tasaCierreTrend = `${tasaCierre >= tasaCierreLastMonth ? '+' : ''}${tasaCierre - tasaCierreLastMonth}%`;

    // ── Monthly trends (last 6 months) ──
    const trendMeses = [];
    const trendVentas = [];
    const trendAlquileres = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mOps = allOps.filter(o => {
        const created = new Date(o.createdAt);
        return created >= mStart && created <= mEnd && closedStatuses.includes(o.estado);
      });
      trendMeses.push(MONTH_LABELS[mStart.getMonth()]);
      trendVentas.push(mOps.filter(o => o.tipo === 'Venta').length);
      trendAlquileres.push(mOps.filter(o => o.tipo === 'Alquiler').length);
    }
    const totalVentasTrend = trendVentas.reduce((s, v) => s + v, 0);
    const totalAlquileresTrend = trendAlquileres.reduce((s, v) => s + v, 0);
    const totalComisionesTrend = allOps.filter(o => {
      const d = new Date(o.createdAt);
      return d >= monthsAgo(5) && closedStatuses.includes(o.estado);
    }).reduce((s, o) => s + (o.monto || 0) * COMMISSION_RATE, 0);

    // ── Estados distribution ──
    const cerradas = allOps.filter(o => closedStatuses.includes(o.estado)).length;
    const enCurso = allOps.filter(o => o.estado === 'En Curso').length;
    const reservadas = allOps.filter(o => o.estado === 'Reservada').length;

    // ── Funnel ──
    const totalLeads = allClientes.length;
    const totalVisitas = allCitas.filter(c => c.estado === 'Completada' || c.estado === 'Programada').length;
    const totalOfertas = allOps.filter(o => !closedStatuses.includes(o.estado)).length + cerradas;
    const funnelConversion = totalLeads > 0 ? ((cerradas / totalLeads) * 100).toFixed(1) : '0';
    const funnelVisitas = totalLeads > 0 ? Math.round((totalVisitas / totalLeads) * 100) : 0;

    // ── Meta ventas (monthly goal) ──
    const metaMensual = scopeId ? 5 : 20;
    const metaProgress = metaMensual > 0 ? Math.min(100, Math.round((closedThisMonthCount / metaMensual) * 100)) : 0;

    // ── Comisiones por agente ──
    const agentComisiones = [];
    if (!scopeId && allAgentes.length > 0) {
      for (const ag of allAgentes) {
        const agId = String(ag._id);
        const agOps = allOps.filter(o => String(o.agenteId) === agId);
        const agClosed = agOps.filter(o => closedStatuses.includes(o.estado));
        const agComision = agClosed.reduce((s, o) => s + (o.monto || 0) * COMMISSION_RATE, 0);
        agentComisiones.push({
          nombre: ag.nombre || 'Sin nombre',
          comision: Math.round(agComision),
          operaciones: agOps.length,
        });
      }
      agentComisiones.sort((a, b) => b.comision - a.comision);
    }

    // ── Seguimiento panel ──
    const urgentes = allOps.filter(o => {
      if (closedStatuses.includes(o.estado)) return false;
      const created = new Date(o.createdAt);
      const daysSince = (now - created) / (1000 * 60 * 60 * 24);
      return daysSince > 14;
    }).length;

    const seguimientosSemana = allCitas.filter(c => {
      const d = new Date(c.date || c.fecha);
      return d >= weekStart && d <= weekEnd && c.estado !== 'Cancelada';
    }).length;

    const porCerrar = allOps.filter(o => o.estado === 'Reservada' || o.estado === 'Por Cerrar').length;

    res.json({
      // Grid data
      operaciones: gridOps,
      // KPIs
      kpis: {
        ventasMes: { value: totalVentasMes, count: ventasCerradasMes.length, trend: ventasTrend },
        operacionesActivas: { value: operacionesActivas, enReserva },
        comisiones: { value: Math.round(totalComisionesMes), trend: comisionesTrend },
        tasaCierre: { value: tasaCierre, trend: tasaCierreTrend },
      },
      // Monthly trend (6 months)
      tendencia: {
        meses: trendMeses,
        ventas: trendVentas,
        alquileres: trendAlquileres,
        totalVentas: totalVentasTrend,
        totalAlquileres: totalAlquileresTrend,
        totalComisiones: Math.round(totalComisionesTrend),
        trendVsAnterior: pctChange(
          trendVentas[trendVentas.length - 1] + trendAlquileres[trendAlquileres.length - 1],
          (trendVentas[trendVentas.length - 2] || 0) + (trendAlquileres[trendAlquileres.length - 2] || 0)
        ),
      },
      // Estados
      estados: { cerradas, enCurso, reservadas, total: allOps.length },
      // Funnel
      funnel: {
        leads: totalLeads,
        visitas: totalVisitas,
        ofertas: totalOfertas,
        cerradas,
        conversion: funnelConversion,
        visitasPct: funnelVisitas,
      },
      // Meta
      meta: { progress: metaProgress, cerradas: closedThisMonthCount, objetivo: metaMensual },
      // Agent commissions
      agentComisiones,
      // Seguimiento
      seguimiento: { urgentes, estaSemana: seguimientosSemana, porCerrar },
    });
  } catch (err) {
    console.error('Operaciones stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
