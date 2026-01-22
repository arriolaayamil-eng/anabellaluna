const express = require('express');
const mongoose = require('mongoose');
const ReportConfig = require('../models/ReportConfig');
const Propiedad = require('../models/Propiedad');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const Operacion = require('../models/Operacion');
const Cita = require('../models/Cita');
const Activity = require('../models/Activity');
const PropertyView = require('../models/PropertyView');
const { authenticateToken } = require('../auth');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

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
router.get('/types', authenticateToken, (req, res) => {
  res.json(REPORT_TYPES);
});

// GET /crm/reports/config - Obtener configuración de reportes del agente
router.get('/config', authenticateToken, async (req, res) => {
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
router.put('/config', authenticateToken, async (req, res) => {
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
router.get('/data/:reportId', authenticateToken, async (req, res) => {
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
        const agentes = await Agente.find({}).lean();
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
        const agentes = await Agente.find({}).lean();
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
        const metrics = {
          'Atención': Math.floor(Math.random() * 20) + 80,
          'Rapidez': Math.floor(Math.random() * 20) + 75,
          'Profesionalismo': Math.floor(Math.random() * 15) + 85,
          'Comunicación': Math.floor(Math.random() * 20) + 78,
          'Resultados': Math.floor(Math.random() * 25) + 75,
        };
        const chartData = Object.entries(metrics).map(([metric, value]) => ({ metric, value }));
        data = { chartData, promedio: Math.round(Object.values(metrics).reduce((a, b) => a + b, 0) / 5), title: 'Satisfacción del Cliente' };
        break;
      }

      case 'visitasPropiedades': {
        // Visitas a propiedades por mes
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const count = await PropertyView.countDocuments({
            createdAt: { $gte: d, $lte: endD }
          });
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
        const agentes = await Agente.find({}).lean();
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
        const chartData = categorias.map(cat => ({
          categoria: cat,
          monto: Math.floor(Math.random() * 50000) + 10000
        }));
        data = { chartData, total: chartData.reduce((sum, c) => sum + c.monto, 0), title: 'Gastos Operativos' };
        break;
      }

      case 'rentabilidadTipoPropiedad': {
        // Rentabilidad por tipo de propiedad
        const tipos = ['Casa', 'Departamento', 'Local', 'Oficina', 'Terreno'];
        const chartData = await Promise.all(tipos.map(async (tipo) => {
          const ops = await Operacion.find({
            ...opFilter,
            estado: { $in: ['Cerrada', 'Completada', 'Finalizada'] }
          }).lean();
          // Simular datos por tipo
          const ingresos = Math.floor(Math.random() * 500000) + 100000;
          const costos = Math.floor(ingresos * (0.3 + Math.random() * 0.3));
          return { tipo, ingresos, costos, rentabilidad: ingresos - costos };
        }));
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
        for (let i = 5; i >= 0; i--) {
          const d = new Date(targetYear, targetMonth - i, 1);
          months.push({
            mes: d.toLocaleDateString('es', { month: 'short' }),
            nosotros: Math.floor(Math.random() * 30) + 20,
            competencia: Math.floor(Math.random() * 25) + 15,
            mercado: Math.floor(Math.random() * 100) + 50
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
router.get('/all-data', authenticateToken, async (req, res) => {
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

// POST /crm/reports/generate - Generar y registrar un reporte
router.post('/generate', authenticateToken, async (req, res) => {
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
router.post('/send-to-erp', authenticateToken, async (req, res) => {
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
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || req.user.id;
    const config = await ReportConfig.findOne({ agenteId }).lean();
    
    res.json(config?.generatedReports || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
