const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const ReportConfig = require('../models/ReportConfig');
const ReceivedReport = require('../models/ReceivedReport');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const Propiedad = require('../models/Propiedad');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const Operacion = require('../models/Operacion');
const Cita = require('../models/Cita');
const Activity = require('../models/Activity');
const PropertyView = require('../models/PropertyView');
const AgentMetrics = require('../models/AgentMetrics');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// Definición de tipos de reportes
const REPORT_TYPES = [
  { id: 'propiedadesCartera', name: 'Propiedades en Cartera', chartType: 'column', icon: '🏠' },
  { id: 'propiedadesVendidas', name: 'Propiedades Vendidas', chartType: 'line', icon: '📈' },
  { id: 'propiedadesDisponiblesTipo', name: 'Propiedades por Tipo', chartType: 'pie', icon: '🥧' },
  { id: 'clientesActivosAgente', name: 'Clientes Activos por Agente', chartType: 'bar', icon: '👥' },
  { id: 'tasaConversion', name: 'Tasa de Conversión', chartType: 'gauge', icon: '🎯' },
  { id: 'ingresosMensuales', name: 'Ingresos Mensuales', chartType: 'bar', icon: '💰' },
  { id: 'ingresosComparativaAgente', name: 'Ingresos por Agente', chartType: 'bar', icon: '📊' },
  { id: 'tiempoPromedioVenta', name: 'Tiempo Promedio de Venta', chartType: 'line', icon: '⏱️' },
  { id: 'distribucionGeografica', name: 'Distribución Geográfica', chartType: 'map', icon: '🗺️' },
  { id: 'satisfaccionCliente', name: 'Satisfacción del Cliente', chartType: 'radar', icon: '⭐' },
  { id: 'visitasPropiedades', name: 'Visitas a Propiedades', chartType: 'bar', icon: '👁️' },
  { id: 'rankingAgentes', name: 'Ranking de Agentes', chartType: 'bar', icon: '🏆' },
  { id: 'inventarioRangoPrecio', name: 'Inventario por Rango de Precio', chartType: 'stackedBar', icon: '💵' },
  { id: 'gastosOperativos', name: 'Gastos Operativos', chartType: 'bar', icon: '📉' },
  { id: 'rentabilidadTipoPropiedad', name: 'Rentabilidad por Tipo', chartType: 'bar', icon: '📈' },
  { id: 'tendenciasMercado', name: 'Tendencias de Mercado', chartType: 'line', icon: '📊' },
  { id: 'alertasBajoRendimiento', name: 'Alertas Bajo Rendimiento', chartType: 'table', icon: '⚠️' },
  { id: 'resumenCitasReuniones', name: 'Citas y Reuniones', chartType: 'calendar', icon: '📅' },
  { id: 'analisisCompetencia', name: 'Análisis de Competencia', chartType: 'line', icon: '🔍' },
  { id: 'estadoPagosFacturacion', name: 'Pagos y Facturación', chartType: 'gauge', icon: '💳' },
];

// GET /crm/reports/types - Lista de tipos de reportes disponibles
router.get('/types', authenticateToken, requireCRMUser, (req, res) => {
  res.json(REPORT_TYPES);
});

// GET /crm/reports/config - Obtener configuración de reportes del agente
router.get('/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    let config = await ReportConfig.findOne({ agenteId }).lean();
    if (!config) {
      // Crear configuración por defecto
      const defaultConfig = new ReportConfig({ agenteId });
      await defaultConfig.save();
      config = defaultConfig.toObject();
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /crm/reports/config - Actualizar configuración de reportes
router.put('/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    const { annualReportSelections, autoSendEnabled, autoSendDay } = req.body;
    
    const update = {};
    if (annualReportSelections) update.annualReportSelections = annualReportSelections;
    if (typeof autoSendEnabled === 'boolean') update.autoSendEnabled = autoSendEnabled;
    if (autoSendDay) update.autoSendDay = autoSendDay;

    const config = await ReportConfig.findOneAndUpdate(
      { agenteId },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/reports/data/:reportId - Obtener datos para un reporte específico
router.get('/data/:reportId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { period = 'month', year, month } = req.query;
    const scopeId = agentScopeId(req);
    
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    let data = {};
    const propFilter = scopeId ? { agentId: scopeId } : {};
    const opFilter = scopeId ? { agenteId: scopeId } : {};

    switch (reportId) {
      case 'propiedadesCartera': {
        // Total de propiedades por mes (últimos 12 meses)
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const count = await Propiedad.countDocuments({
            ...propFilter,
            createdAt: { $lte: endD }
          });
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short', year: '2-digit' }),
            total: count
          });
        }
        data = { chartData: months, title: 'Propiedades en Cartera' };
        break;
      }

      case 'propiedadesVendidas': {
        // Propiedades vendidas por mes
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const count = await Propiedad.countDocuments({
            ...propFilter,
            status: 'Vendida',
            updatedAt: { $gte: d, $lte: endD }
          });
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short', year: '2-digit' }),
            vendidas: count
          });
        }
        data = { chartData: months, title: 'Propiedades Vendidas' };
        break;
      }

      case 'propiedadesDisponiblesTipo': {
        // Propiedades disponibles agrupadas por tipo
        const props = await Propiedad.find({ ...propFilter, status: 'Disponible' }).lean();
        const byType = {};
        props.forEach(p => {
          const tipo = p.metadata?.tipo || 'Sin tipo';
          byType[tipo] = (byType[tipo] || 0) + 1;
        });
        const chartData = Object.entries(byType).map(([tipo, cantidad]) => ({ tipo, cantidad }));
        data = { chartData, title: 'Propiedades Disponibles por Tipo' };
        break;
      }

      case 'clientesActivosAgente': {
        // Clientes activos por agente
        const agentes = await Agente.find(scopeId ? { _id: scopeId } : {}).lean();
        const chartData = await Promise.all(agentes.map(async (a) => {
          const count = await Cliente.countDocuments({ agenteId: a._id.toString() });
          return { agente: a.nombre || a.email, clientes: count };
        }));
        data = { chartData: chartData.sort((a, b) => b.clientes - a.clientes), title: 'Clientes Activos por Agente' };
        break;
      }

      case 'tasaConversion': {
        // Tasa de conversión: operaciones cerradas / total leads
        const totalClientes = await Cliente.countDocuments(scopeId ? { agenteId: scopeId } : {});
        const operacionesCerradas = await Operacion.countDocuments({
          ...opFilter,
          estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] }
        });
        const tasa = totalClientes > 0 ? Math.round((operacionesCerradas / totalClientes) * 100) : 0;
        // Histórico mensual
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const clientesMes = await Cliente.countDocuments({
            ...(scopeId ? { agenteId: scopeId } : {}),
            createdAt: { $lte: endD }
          });
          const opsMes = await Operacion.countDocuments({
            ...opFilter,
            estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] },
            createdAt: { $lte: endD }
          });
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short' }),
            tasa: clientesMes > 0 ? Math.round((opsMes / clientesMes) * 100) : 0
          });
        }
        data = { current: tasa, chartData: months, title: 'Tasa de Conversión' };
        break;
      }

      case 'ingresosMensuales': {
        // Ingresos por mes
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const ops = await Operacion.find({
            ...opFilter,
            estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] },
            createdAt: { $gte: d, $lte: endD }
          }).lean();
          const total = ops.reduce((sum, o) => sum + (o.monto || 0), 0);
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short', year: '2-digit' }),
            ingresos: total
          });
        }
        data = { chartData: months, title: 'Ingresos Mensuales' };
        break;
      }

      case 'ingresosComparativaAgente': {
        // Ingresos por agente
        const agentes = await Agente.find(scopeId ? { _id: scopeId } : {}).lean();
        const chartData = await Promise.all(agentes.map(async (a) => {
          const ops = await Operacion.find({
            agenteId: a._id.toString(),
            estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] },
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          }).lean();
          const total = ops.reduce((sum, o) => sum + (o.monto || 0), 0);
          return { agente: a.nombre || a.email, ingresos: total };
        }));
        data = { chartData: chartData.sort((a, b) => b.ingresos - a.ingresos), title: 'Ingresos por Agente' };
        break;
      }

      case 'tiempoPromedioVenta': {
        // Tiempo promedio de venta en días
        const props = await Propiedad.find({
          ...propFilter,
          status: 'Vendida'
        }).lean();
        const times = props.map(p => {
          const created = new Date(p.createdAt);
          const updated = new Date(p.updatedAt);
          return Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
        }).filter(t => t > 0);
        const promedio = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
        
        // Por mes
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const propsMonth = await Propiedad.find({
            ...propFilter,
            status: 'Vendida',
            updatedAt: { $gte: d, $lte: endD }
          }).lean();
          const timesMonth = propsMonth.map(p => {
            return Math.ceil((new Date(p.updatedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24));
          }).filter(t => t > 0);
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short' }),
            dias: timesMonth.length > 0 ? Math.round(timesMonth.reduce((a, b) => a + b, 0) / timesMonth.length) : 0
          });
        }
        data = { promedio, chartData: months, title: 'Tiempo Promedio de Venta' };
        break;
      }

      case 'distribucionGeografica': {
        // Distribución por zona/dirección
        const props = await Propiedad.find(propFilter).lean();
        const byZone = {};
        props.forEach(p => {
          const zone = p.metadata?.zona || p.metadata?.barrio || p.address?.split(',')[0] || 'Sin zona';
          byZone[zone] = (byZone[zone] || 0) + 1;
        });
        const chartData = Object.entries(byZone).map(([zona, cantidad]) => ({ zona, cantidad }));
        data = { chartData: chartData.sort((a, b) => b.cantidad - a.cantidad).slice(0, 10), title: 'Distribución Geográfica' };
        break;
      }

      case 'satisfaccionCliente': {
        // Métricas de satisfacción (simuladas basadas en actividades positivas)
        const ratingFilter = {
          type: 'rating',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        };
        if (scopeId) ratingFilter.agenteId = scopeId;

        const ratings = await Activity.find(ratingFilter).lean();
        let totalRatings = ratings.length;
        let avgRating = totalRatings > 0
          ? ratings.reduce((sum, r) => sum + Number(r.metadata?.rating || 0), 0) / totalRatings
          : 0;

        if (totalRatings === 0) {
          const metricsFilter = {
            period: 'monthly',
            periodStart: { $gte: startOfMonth, $lte: endOfMonth },
          };
          if (scopeId) metricsFilter.agenteId = scopeId;

          const metricsDocs = await AgentMetrics.find(metricsFilter).lean();
          if (metricsDocs.length > 0) {
            if (scopeId) {
              avgRating = metricsDocs[0].avgRating || 0;
              totalRatings = metricsDocs[0].totalRatings || 0;
            } else {
              avgRating = metricsDocs.reduce((s, m) => s + (m.avgRating || 0), 0) / metricsDocs.length;
              totalRatings = metricsDocs.reduce((s, m) => s + (m.totalRatings || 0), 0);
            }
          }
        }

        const promedio = Math.round(Math.max(0, Math.min(100, (avgRating || 0) * 20)));
        const metrics = {
          'Atención': promedio,
          'Rapidez': promedio,
          'Profesionalismo': promedio,
          'Comunicación': promedio,
          'Resultados': promedio,
        };
        const chartData = Object.entries(metrics).map(([metric, value]) => ({ metric, value }));
        data = { chartData, promedio, totalRatings, title: 'Satisfacción del Cliente' };
        break;
      }

      case 'visitasPropiedades': {
        // Visitas a propiedades por mes
        let scopedPropertyIds = null;
        if (scopeId) {
          const propsForAgent = await Propiedad.find(propFilter).select('_id').lean();
          scopedPropertyIds = propsForAgent.map(p => p._id.toString());
        }
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const viewFilter = { createdAt: { $gte: d, $lte: endD } };
          if (scopeId) {
            if (!scopedPropertyIds || scopedPropertyIds.length === 0) {
              months.push({
                mes: d.toLocaleDateString('es', { month: 'short' }),
                visitas: 0
              });
              continue;
            }
            viewFilter.propertyId = { $in: scopedPropertyIds };
          }
          const count = await PropertyView.countDocuments(viewFilter);
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short' }),
            visitas: count
          });
        }
        data = { chartData: months, title: 'Visitas a Propiedades' };
        break;
      }

      case 'rankingAgentes': {
        // Ranking de agentes por operaciones cerradas
        const agentes = await Agente.find(scopeId ? { _id: scopeId } : {}).lean();
        const chartData = await Promise.all(agentes.map(async (a) => {
          const ops = await Operacion.countDocuments({
            agenteId: a._id.toString(),
            estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] }
          });
          const ingresos = await Operacion.find({
            agenteId: a._id.toString(),
            estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] }
          }).lean();
          const totalIngresos = ingresos.reduce((sum, o) => sum + (o.monto || 0), 0);
          return { 
            agente: a.nombre || a.email, 
            operaciones: ops,
            ingresos: totalIngresos,
            score: ops * 10 + Math.round(totalIngresos / 10000)
          };
        }));
        data = { chartData: chartData.sort((a, b) => b.score - a.score), title: 'Ranking de Agentes' };
        break;
      }

      case 'inventarioRangoPrecio': {
        // Inventario por rango de precio
        const rangos = [
          { min: 0, max: 50000, label: '< $50K' },
          { min: 50000, max: 100000, label: '$50K-$100K' },
          { min: 100000, max: 200000, label: '$100K-$200K' },
          { min: 200000, max: 500000, label: '$200K-$500K' },
          { min: 500000, max: Infinity, label: '> $500K' },
        ];
        const chartData = await Promise.all(rangos.map(async (r) => {
          const disponibles = await Propiedad.countDocuments({
            ...propFilter,
            status: 'Disponible',
            price: { $gte: r.min, $lt: r.max === Infinity ? 999999999 : r.max }
          });
          const vendidas = await Propiedad.countDocuments({
            ...propFilter,
            status: 'Vendida',
            price: { $gte: r.min, $lt: r.max === Infinity ? 999999999 : r.max }
          });
          return { rango: r.label, disponibles, vendidas };
        }));
        data = { chartData, title: 'Inventario por Rango de Precio' };
        break;
      }

      case 'gastosOperativos': {
        // Gastos operativos (simulados por ahora)
        const categorias = ['Marketing', 'Personal', 'Oficina', 'Tecnología', 'Legales', 'Otros'];
        const dateFilter = period === 'year'
          ? { $gte: startOfYear, $lte: endOfYear }
          : { $gte: startOfMonth, $lte: endOfMonth };

        const ops = await Operacion.find({
          ...opFilter,
          createdAt: dateFilter,
          monto: { $lt: 0 },
        }).lean();

        const totalGastos = ops.reduce((sum, o) => sum + Math.abs(Number(o.monto || 0)), 0);

        const chartData = categorias.map(cat => ({
          categoria: cat,
          monto: cat === 'Otros' ? Math.round(totalGastos) : 0,
        }));

        data = { chartData, total: chartData.reduce((sum, c) => sum + c.monto, 0), title: 'Gastos Operativos' };
        break;
      }

      case 'rentabilidadTipoPropiedad': {
        // Rentabilidad por tipo de propiedad
        const tiposBase = ['Casa', 'Departamento', 'Local', 'Oficina', 'Terreno'];
        const tipos = [...tiposBase, 'Otros'];
        const dateFilter = period === 'year'
          ? { $gte: startOfYear, $lte: endOfYear }
          : { $gte: startOfMonth, $lte: endOfMonth };

        const ops = await Operacion.find({
          ...opFilter,
          createdAt: dateFilter,
        }).lean();

        const propertyIds = Array.from(new Set(
          ops.map(o => (o.propiedadId ? String(o.propiedadId) : null)).filter(Boolean)
        ));
        const validPropertyIds = propertyIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const props = validPropertyIds.length > 0
          ? await Propiedad.find({ ...propFilter, _id: { $in: validPropertyIds } }).select('_id metadata').lean()
          : [];

        const tipoByPropId = {};
        props.forEach(p => { tipoByPropId[p._id.toString()] = p.metadata?.tipo || 'Otros'; });

        const closedStatuses = ['Cerrada', 'Completada', 'Finalizada'];
        const totals = {};
        tipos.forEach(t => { totals[t] = { ingresos: 0, costos: 0 }; });

        for (const o of ops) {
          const propId = o.propiedadId ? String(o.propiedadId) : null;
          const rawTipo = propId && tipoByPropId[propId] ? String(tipoByPropId[propId]) : 'Otros';
          const tipo = tiposBase.includes(rawTipo) ? rawTipo : 'Otros';
          const monto = Number(o.monto || 0);

          if (monto < 0) {
            totals[tipo].costos += Math.abs(monto);
            continue;
          }

          if (closedStatuses.includes(o.estado)) {
            totals[tipo].ingresos += monto;
          }
        }

        const chartData = tipos.map((tipo) => {
          const ingresos = totals[tipo]?.ingresos || 0;
          const costos = totals[tipo]?.costos || 0;
          return {
            tipo,
            rentabilidad: Math.round(ingresos - costos),
            ingresos: Math.round(ingresos),
            costos: Math.round(costos),
          };
        });

        data = { chartData, title: 'Rentabilidad por Tipo de Propiedad' };
        break;
      }

      case 'tendenciasMercado': {
        // Tendencias de mercado (precio promedio por mes)
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const props = await Propiedad.find({
            ...propFilter,
            createdAt: { $gte: d, $lte: endD }
          }).lean();
          const avgPrice = props.length > 0 
            ? Math.round(props.reduce((sum, p) => sum + (p.price || 0), 0) / props.length)
            : 0;
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short', year: '2-digit' }),
            precioPromedio: avgPrice
          });
        }
        data = { chartData: months, title: 'Tendencias de Mercado' };
        break;
      }

      case 'alertasBajoRendimiento': {
        // Propiedades con bajo rendimiento (más de 90 días sin vender)
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - 90);
        const props = await Propiedad.find({
          ...propFilter,
          status: 'Disponible',
          createdAt: { $lte: threshold }
        }).lean();
        const chartData = props.map(p => ({
          id: p._id,
          titulo: p.title,
          precio: p.price,
          diasEnMercado: Math.ceil((new Date() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)),
          zona: p.metadata?.zona || p.address || 'Sin zona'
        })).sort((a, b) => b.diasEnMercado - a.diasEnMercado);
        data = { chartData, total: chartData.length, title: 'Propiedades con Bajo Rendimiento' };
        break;
      }

      case 'resumenCitasReuniones': {
        // Resumen de citas
        const citaFilter = scopeId ? { agenteId: scopeId } : {};
        const citas = await Cita.find({
          ...citaFilter,
          fecha: { $gte: startOfMonth, $lte: endOfMonth }
        }).lean();
        
        const porEstado = {};
        citas.forEach(c => {
          const estado = c.estado || 'Pendiente';
          porEstado[estado] = (porEstado[estado] || 0) + 1;
        });
        
        // Por día de la semana
        const porDia = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        citas.forEach(c => {
          if (c.fecha) {
            const day = dias[new Date(c.fecha).getDay()];
            porDia[day]++;
          }
        });

        data = { 
          total: citas.length,
          porEstado: Object.entries(porEstado).map(([estado, cantidad]) => ({ estado, cantidad })),
          porDia: Object.entries(porDia).map(([dia, cantidad]) => ({ dia, cantidad })),
          title: 'Citas y Reuniones'
        };
        break;
      }

      case 'analisisCompetencia': {
        // Análisis de competencia (datos simulados de mercado)
        const months = [];
        const clienteFilter = scopeId ? { agenteId: scopeId } : {};
        const closedStatuses = ['Cerrada', 'Completada', 'Finalizada'];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

          const nosotros = await Operacion.countDocuments({
            ...opFilter,
            estado: { $in: closedStatuses },
            createdAt: { $gte: start, $lte: end },
          });

          const competencia = await Cliente.countDocuments({
            ...clienteFilter,
            'metadata.estado': 'Perdido',
            updatedAt: { $gte: start, $lte: end },
          });

          const mercado = await Cliente.countDocuments({
            ...clienteFilter,
            createdAt: { $gte: start, $lte: end },
          });

          months.push({
            mes: d.toLocaleDateString('es', { month: 'short' }),
            nosotros,
            competencia,
            mercado,
          });
        }

        data = { chartData: months, title: 'Análisis de Competencia' };
        break;
      }

      case 'estadoPagosFacturacion': {
        // Estado de pagos (basado en operaciones)
        const ops = await Operacion.find(opFilter).lean();
        const estados = {
          pagado: ops.filter(o => ['Cerrada', 'Completada', 'Finalizada'].includes(o.estado)).length,
          pendiente: ops.filter(o => o.estado === 'Pendiente').length,
          vencido: ops.filter(o => o.estado === 'Vencido' || o.estado === 'Atrasado').length,
        };
        const total = estados.pagado + estados.pendiente + estados.vencido;
        const tasaCobro = total > 0 ? Math.round((estados.pagado / total) * 100) : 0;
        data = { 
          estados,
          tasaCobro,
          chartData: Object.entries(estados).map(([estado, cantidad]) => ({ estado, cantidad })),
          title: 'Estado de Pagos y Facturación'
        };
        break;
      }

      default:
        return res.status(404).json({ error: 'Tipo de reporte no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error getting report data:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/reports/all-data - Obtener datos de todos los reportes para generación de PDF
router.get('/all-data', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { year, month } = req.query;
    const reportTypes = REPORT_TYPES.map(r => r.id);
    const allData = {};

    for (const reportId of reportTypes) {
      try {
        const response = await new Promise((resolve) => {
          const mockReq = { ...req, params: { reportId }, query: { year, month } };
          const mockRes = {
            json: (data) => resolve(data),
            status: () => ({ json: (data) => resolve({ error: data }) })
          };
          router.handle(mockReq, mockRes, () => resolve(null));
        });
        allData[reportId] = response;
      } catch (e) {
        allData[reportId] = { error: e.message };
      }
    }

    res.json(allData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /crm/reports/generate-pdf - Generar PDF descargable con datos de reportes
router.post('/generate-pdf', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    const { selectedReports = [], reportData = {}, period = '', type = 'manual' } = req.body;

    const COLUMN_LABELS = {
      mes: 'Mes', total: 'Total', vendidas: 'Vendidas', tipo: 'Tipo', cantidad: 'Cantidad',
      agente: 'Agente', clientes: 'Clientes', tasa: 'Tasa (%)', ingresos: 'Ingresos ($)',
      dias: 'Días', zona: 'Zona', metric: 'Métrica', value: 'Valor', visitas: 'Visitas',
      operaciones: 'Operaciones', score: 'Puntaje', rango: 'Rango', disponibles: 'Disponibles',
      categoria: 'Categoría', monto: 'Monto ($)', rentabilidad: 'Rentabilidad ($)',
      costos: 'Costos ($)', precioPromedio: 'Precio Prom. ($)', titulo: 'Título',
      precio: 'Precio ($)', diasEnMercado: 'Días en Mercado', estado: 'Estado',
      dia: 'Día', nosotros: 'Nosotros', competencia: 'Competencia', mercado: 'Mercado',
      promedio: 'Promedio',
    };

    const colLabel = (key) => COLUMN_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);

    const fmtVal = (val) => {
      if (val == null) return '';
      if (typeof val === 'number') return val.toLocaleString('es-AR');
      return String(val);
    };

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      info: { Title: `Reporte Inmobiliario - ${period}`, Author: 'Sistema ERP' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${period || 'general'}.pdf"`);
    doc.pipe(res);

    const PRIMARY = '#3B82F6';
    const DARK = '#1E293B';
    const GRAY = '#94A3B8';
    const LIGHT_BG = '#F1F5F9';
    const PAGE_W = doc.page.width;
    const MARGIN = 50;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // ---- Helper: draw a data table ----
    const drawTable = (headers, rows, startY) => {
      const colCount = headers.length;
      const colW = Math.floor(CONTENT_W / colCount);
      let y = startY;

      // Header row
      doc.rect(MARGIN, y, CONTENT_W, 22).fill('#E2E8F0');
      doc.fill(DARK).fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, MARGIN + 4 + i * colW, y + 6, { width: colW - 8, align: 'left' });
      });
      y += 22;
      doc.font('Helvetica');

      rows.forEach((row, ri) => {
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = MARGIN;
        }
        if (ri % 2 === 0) {
          doc.rect(MARGIN, y, CONTENT_W, 18).fill(LIGHT_BG);
        }
        doc.fill(DARK).fontSize(8);
        row.forEach((cell, ci) => {
          doc.text(cell, MARGIN + 4 + ci * colW, y + 4, { width: colW - 8, align: 'left' });
        });
        y += 18;
      });
      return y + 6;
    };

    // ===== COVER PAGE =====
    doc.rect(0, 0, PAGE_W, 180).fill(PRIMARY);
    doc.fill('#FFFFFF').fontSize(26).font('Helvetica-Bold')
      .text('Reporte Inmobiliario', MARGIN, 50, { align: 'center', width: CONTENT_W });
    doc.fontSize(14).font('Helvetica')
      .text(`Período: ${period || 'General'}`, MARGIN, 90, { align: 'center', width: CONTENT_W });
    doc.fontSize(11)
      .text(`Generado: ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`, MARGIN, 115, { align: 'center', width: CONTENT_W });
    doc.fontSize(11)
      .text(`Reportes incluidos: ${selectedReports.length}`, MARGIN, 140, { align: 'center', width: CONTENT_W });

    // Table of contents
    doc.fill(DARK).fontSize(14).font('Helvetica-Bold').text('Índice de Reportes', MARGIN, 220);
    doc.font('Helvetica').fontSize(11).fill(DARK);
    selectedReports.forEach((reportId, i) => {
      const def = REPORT_TYPES.find(r => r.id === reportId);
      doc.text(`${i + 1}. ${def?.name || reportId}`, MARGIN + 10, 250 + i * 20);
    });

    // ===== REPORT SECTIONS =====
    for (const reportId of selectedReports) {
      doc.addPage();
      const def = REPORT_TYPES.find(r => r.id === reportId);
      const data = reportData[reportId];

      // Section header bar
      doc.rect(0, 0, PAGE_W, 50).fill(PRIMARY);
      doc.fill('#FFFFFF').fontSize(16).font('Helvetica-Bold')
        .text(`${def?.icon || ''} ${def?.name || reportId}`, MARGIN, 16, { width: CONTENT_W });

      doc.fill(DARK).font('Helvetica');
      let y = 70;

      if (!data || data.error) {
        doc.fontSize(12).fill(GRAY).text('Sin datos disponibles para este período.', MARGIN, y);
        continue;
      }

      // Key metrics
      const metrics = [];
      if (data.current !== undefined) metrics.push(['Valor actual', `${data.current}%`]);
      if (data.promedio !== undefined) metrics.push(['Promedio', `${data.promedio}`]);
      if (data.total !== undefined) metrics.push(['Total', `${data.total}`]);
      if (data.totalRatings !== undefined) metrics.push(['Calificaciones', `${data.totalRatings}`]);
      if (data.tasaCobro !== undefined) metrics.push(['Tasa de cobro', `${data.tasaCobro}%`]);

      if (metrics.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').fill(DARK);
        metrics.forEach(([label, val]) => {
          doc.text(`${label}: ${val}`, MARGIN, y);
          y += 18;
        });
        y += 8;
        doc.font('Helvetica');
      }

      // Main chartData table
      const chartData = Array.isArray(data.chartData) ? data.chartData : [];
      if (chartData.length > 0) {
        const keys = Object.keys(chartData[0]).filter(k => k !== 'id' && k !== '_id');
        const headers = keys.map(colLabel);
        const rows = chartData.map(row => keys.map(k => fmtVal(row[k])));
        y = drawTable(headers, rows, y);
      }

      // Extra tables for resumenCitasReuniones
      if (reportId === 'resumenCitasReuniones') {
        if (Array.isArray(data.porEstado) && data.porEstado.length) {
          doc.fontSize(11).font('Helvetica-Bold').fill(DARK).text('Por Estado', MARGIN, y + 4);
          y += 22;
          const rows = data.porEstado.map(r => [fmtVal(r.estado), fmtVal(r.cantidad)]);
          y = drawTable(['Estado', 'Cantidad'], rows, y);
        }
        if (Array.isArray(data.porDia) && data.porDia.length) {
          doc.fontSize(11).font('Helvetica-Bold').fill(DARK).text('Por Día de la Semana', MARGIN, y + 4);
          y += 22;
          const rows = data.porDia.map(r => [fmtVal(r.dia), fmtVal(r.cantidad)]);
          y = drawTable(['Día', 'Cantidad'], rows, y);
        }
      }

      // Extra for estadoPagosFacturacion
      if (reportId === 'estadoPagosFacturacion' && data.estados) {
        doc.fontSize(11).font('Helvetica-Bold').fill(DARK).text('Desglose de Estados', MARGIN, y + 4);
        y += 22;
        const rows = Object.entries(data.estados).map(([k, v]) => [colLabel(k), fmtVal(v)]);
        y = drawTable(['Estado', 'Cantidad'], rows, y);
      }
    }

    // ===== FOOTER on every page =====
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fill(GRAY)
        .text(`Página ${i + 1} de ${pageCount}`, MARGIN, doc.page.height - 30, { align: 'center', width: CONTENT_W });
    }

    // Register in history
    await ReportConfig.findOneAndUpdate(
      { agenteId },
      {
        $push: {
          generatedReports: {
            type,
            period: period || new Date().toISOString().slice(0, 7),
            generatedAt: new Date(),
            sentToERP: false,
          }
        }
      },
      { new: true, upsert: true }
    );

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// POST /crm/reports/generate - Generar y registrar un reporte
router.post('/generate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    const { type = 'manual', period, selectedReports } = req.body;

    const config = await ReportConfig.findOneAndUpdate(
      { agenteId },
      {
        $push: {
          generatedReports: {
            type,
            period: period || new Date().toISOString().slice(0, 7),
            generatedAt: new Date(),
            sentToERP: false,
          }
        }
      },
      { new: true, upsert: true }
    );

    res.json({ 
      success: true, 
      message: 'Reporte generado correctamente',
      reportId: config.generatedReports[config.generatedReports.length - 1]._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /crm/reports/send-to-erp - Enviar reporte al ERP
router.post('/send-to-erp', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    const { reportId } = req.body;

    const config = await ReportConfig.findOne({ agenteId });
    if (!config) return res.status(404).json({ error: 'Configuración no encontrada' });

    const reportIndex = config.generatedReports.findIndex(
      r => r._id.toString() === reportId
    );
    if (reportIndex === -1) return res.status(404).json({ error: 'Reporte no encontrado' });

    config.generatedReports[reportIndex].sentToERP = true;
    config.generatedReports[reportIndex].sentAt = new Date();
    await config.save();

    res.json({ success: true, message: 'Reporte enviado al ERP correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/reports/history - Historial de reportes generados
router.get('/history', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    const config = await ReportConfig.findOne({ agenteId }).lean();
    
    res.json(config?.generatedReports || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /crm/reports/send-pdf - Agent uploads a generated PDF to the ERP
router.post('/send-pdf', authenticateToken, requireCRMUser, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo PDF' });

    const agentId = agentScopeId(req) || req.user.id;
    const { type = 'manual', period = '', agentName = 'Agente' } = req.body;

    const received = await ReceivedReport.create({
      agentId,
      agentName,
      type,
      period,
      filename: req.file.originalname || `reporte-${period || 'general'}.pdf`,
      pdfData: req.file.buffer,
      fileSize: req.file.size,
    });

    // Mark the latest matching history entry as sent
    const config = await ReportConfig.findOne({ agenteId: agentId });
    if (config) {
      const pending = config.generatedReports
        .filter(r => !r.sentToERP)
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
      if (pending.length > 0) {
        pending[0].sentToERP = true;
        pending[0].sentAt = new Date();
        await config.save();
      }
    }

    res.json({ success: true, message: 'Reporte enviado al ERP', id: received._id });
  } catch (err) {
    console.error('Error uploading PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/reports/received - Admin lists all received reports (without PDF binary)
router.get('/received', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });

    const reports = await ReceivedReport.find()
      .select('-pdfData')
      .sort({ createdAt: -1 })
      .lean();

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/reports/received/:id/download - Admin downloads a received report PDF
router.get('/received/:id/download', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });

    const report = await ReceivedReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });

    // Mark as downloaded
    if (!report.downloadedByAdmin) {
      report.downloadedByAdmin = true;
      report.downloadedAt = new Date();
      await report.save();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.setHeader('Content-Length', report.pdfData.length);
    res.send(report.pdfData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
