import React, { useState, useEffect, useCallback, useRef } from 'react';

import { toast } from 'react-toastify';
import Chart from 'react-apexcharts';
import { FaChartBar, FaDownload, FaCalendarAlt, FaDollarSign, FaUsers, FaHome, FaChartLine, FaChartPie, FaMapMarkedAlt, FaStar, FaEye, FaTrophy, FaMoneyBillWave, FaClock, FaExclamationTriangle, FaFileAlt, FaBalanceScale, FaCog, FaPaperPlane, FaCheck, FaBuilding, FaPercent, FaClipboardList, FaHistory, FaSync } from 'react-icons/fa';

import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import { exportDashboardToPDF } from '../utils/exportDashboardToPDF';

// Definición de los 20 tipos de reportes
const REPORT_DEFINITIONS = [
  { id: 'propiedadesCartera', name: 'Propiedades en Cartera', icon: <FaHome />, chartType: 'column', color: '#3B82F6', description: 'Total de propiedades por mes' },
  { id: 'propiedadesVendidas', name: 'Propiedades Vendidas', icon: <FaChartLine />, chartType: 'line', color: '#10B981', description: 'Propiedades vendidas mensualmente' },
  { id: 'propiedadesDisponiblesTipo', name: 'Propiedades por Tipo', icon: <FaChartPie />, chartType: 'pie', color: '#F59E0B', description: 'Distribución por tipo de propiedad' },
  { id: 'clientesActivosAgente', name: 'Clientes por Agente', icon: <FaUsers />, chartType: 'bar', color: '#8B5CF6', description: 'Clientes activos asignados a cada agente' },
  { id: 'tasaConversion', name: 'Tasa de Conversión', icon: <FaPercent />, chartType: 'gauge', color: '#EF4444', description: 'Porcentaje de conversión de leads' },
  { id: 'ingresosMensuales', name: 'Ingresos Mensuales', icon: <FaDollarSign />, chartType: 'bar', color: '#10B981', description: 'Ingresos totales por mes' },
  { id: 'ingresosComparativaAgente', name: 'Ingresos por Agente', icon: <FaMoneyBillWave />, chartType: 'bar', color: '#3B82F6', description: 'Comparativa de ingresos entre agentes' },
  { id: 'tiempoPromedioVenta', name: 'Tiempo de Venta', icon: <FaClock />, chartType: 'line', color: '#F59E0B', description: 'Días promedio para cerrar una venta' },
  { id: 'distribucionGeografica', name: 'Distribución Geográfica', icon: <FaMapMarkedAlt />, chartType: 'map', color: '#8B5CF6', description: 'Propiedades por zona/ubicación' },
  { id: 'satisfaccionCliente', name: 'Satisfacción del Cliente', icon: <FaStar />, chartType: 'radar', color: '#EF4444', description: 'Métricas de satisfacción' },
  { id: 'visitasPropiedades', name: 'Visitas a Propiedades', icon: <FaEye />, chartType: 'bar', color: '#10B981', description: 'Número de visitas por período' },
  { id: 'rankingAgentes', name: 'Ranking de Agentes', icon: <FaTrophy />, chartType: 'bar', color: '#F59E0B', description: 'Clasificación por desempeño' },
  { id: 'inventarioRangoPrecio', name: 'Inventario por Precio', icon: <FaBuilding />, chartType: 'stackedBar', color: '#3B82F6', description: 'Propiedades por rango de precio' },
  { id: 'gastosOperativos', name: 'Gastos Operativos', icon: <FaMoneyBillWave />, chartType: 'bar', color: '#EF4444', description: 'Desglose de gastos mensuales' },
  { id: 'rentabilidadTipoPropiedad', name: 'Rentabilidad por Tipo', icon: <FaBalanceScale />, chartType: 'bar', color: '#8B5CF6', description: 'Rentabilidad según tipo de propiedad' },
  { id: 'tendenciasMercado', name: 'Tendencias de Mercado', icon: <FaChartLine />, chartType: 'line', color: '#10B981', description: 'Evolución de precios del mercado' },
  { id: 'alertasBajoRendimiento', name: 'Alertas Bajo Rendimiento', icon: <FaExclamationTriangle />, chartType: 'table', color: '#EF4444', description: 'Propiedades con más de 90 días sin vender' },
  { id: 'resumenCitasReuniones', name: 'Citas y Reuniones', icon: <FaCalendarAlt />, chartType: 'calendar', color: '#3B82F6', description: 'Resumen de agenda mensual' },
  { id: 'analisisCompetencia', name: 'Análisis de Competencia', icon: <FaBalanceScale />, chartType: 'line', color: '#F59E0B', description: 'Comparativa con el mercado' },
  { id: 'estadoPagosFacturacion', name: 'Pagos y Facturación', icon: <FaFileAlt />, chartType: 'gauge', color: '#8B5CF6', description: 'Estado de cobros y pagos' },
];

const Reportes = () => {
  const { currentMode, currentColor } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [reportConfig, setReportConfig] = useState(null);
  const [reportData, setReportData] = useState({});
  const [selectedReports, setSelectedReports] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [expandedReport, setExpandedReport] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);
  const chartRefs = useRef({});

  // Cargar configuración y datos
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, historyRes] = await Promise.all([
        crmService.reports.getConfig(),
        crmService.reports.getHistory(),
      ]);

      setReportConfig(configRes.data);
      setHistory(historyRes.data || []);

      // Inicializar selecciones desde la configuración
      if (configRes.data?.annualReportSelections) {
        setSelectedReports(configRes.data.annualReportSelections);
      } else {
        const defaultSelections = {};
        REPORT_DEFINITIONS.forEach((r) => { defaultSelections[r.id] = true; });
        setSelectedReports(defaultSelections);
      }

      // Cargar datos de todos los reportes
      const dataPromises = REPORT_DEFINITIONS.map(async (report) => {
        try {
          const res = await crmService.reports.getData(report.id, { year: selectedYear, month: selectedMonth });
          return { id: report.id, data: res.data };
        } catch (e) {
          return { id: report.id, data: { error: e.message } };
        }
      });

      const results = await Promise.all(dataPromises);
      const dataMap = {};
      results.forEach((r) => { dataMap[r.id] = r.data; });
      setReportData(dataMap);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle selección de reporte para el anual
  const toggleReportSelection = async (reportId) => {
    const newSelections = { ...selectedReports, [reportId]: !selectedReports[reportId] };
    setSelectedReports(newSelections);

    try {
      await crmService.reports.updateConfig({ annualReportSelections: newSelections });
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  // Seleccionar/deseleccionar todos
  const toggleAll = async (select) => {
    const newSelections = {};
    REPORT_DEFINITIONS.forEach((r) => { newSelections[r.id] = select; });
    setSelectedReports(newSelections);

    try {
      await crmService.reports.updateConfig({ annualReportSelections: newSelections });
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  // Generar reporte PDF (client-side DOM capture)
  const generateReport = async (type = 'manual', action = 'download') => {
    setGenerating(true);
    setExportProgress(0);
    try {
      // Ensure dashboard tab is active so charts are rendered
      const prevTab = activeTab;
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        await new Promise((r) => { setTimeout(r, 1500); });
      }

      const selectedIds = Object.entries(selectedReports)
        .filter(([, v]) => v)
        .map(([id]) => id);

      const chartElements = selectedIds
        .map((id) => chartRefs.current[id])
        .filter(Boolean);

      // Wait for ApexCharts SVGs to finish rendering
      await new Promise((r) => { setTimeout(r, 500); });

      const { blob, period } = await exportDashboardToPDF({
        chartElements,
        reportDefinitions: REPORT_DEFINITIONS,
        selectedReports,
        reportData,
        year: selectedYear,
        month: selectedMonth,
        type,
        userName: 'Agente CRM',
        onProgress: setExportProgress,
      });

      if (action === 'download') {
        // Download locally
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${period}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (action === 'send') {
        // Send PDF to ERP
        await crmService.reports.sendPdf(blob, `reporte-${period}.pdf`, {
          type,
          period,
          agentName: 'Agente CRM',
        });
      }

      // Register in history
      await crmService.reports.generate({
        type,
        period,
        selectedReports: selectedIds,
      });

      // Check milestones (non-blocking)
      crmService.rewards.checkMilestones('report').catch(() => {});

      const historyRes = await crmService.reports.getHistory();
      setHistory(historyRes.data || []);

      if (prevTab !== 'dashboard') setActiveTab(prevTab);
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Error al generar el reporte');
    } finally {
      setGenerating(false);
      setExportProgress(null);
    }
  };

  // Enviar al ERP
  const sendToERP = async (reportId) => {
    setSending(true);
    try {
      await crmService.reports.sendToERP(reportId);

      const historyRes = await crmService.reports.getHistory();
      setHistory(historyRes.data || []);

      toast.success('Reporte enviado al ERP correctamente');
    } catch (err) {
      console.error('Error sending to ERP:', err);
      toast.error('Error al enviar el reporte');
    } finally {
      setSending(false);
    }
  };

  // Configurar envío automático
  const toggleAutoSend = async () => {
    try {
      const newConfig = { autoSendEnabled: !reportConfig?.autoSendEnabled };
      await crmService.reports.updateConfig(newConfig);
      setReportConfig((prev) => ({ ...prev, ...newConfig }));
    } catch (err) {
      console.error('Error updating auto send:', err);
    }
  };

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;
  const cardHover = `${cardBase} cursor-pointer`;
  const axisLabelColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const tooltipTheme = isDark ? 'dark' : 'light';

  const renderEmpty = (text = 'Sin datos disponibles') => (
    <div className="text-gray-500 text-center py-8">{text}</div>
  );

  const renderChart = (reportDef, data) => {
    if (!data || data.error) return renderEmpty();

    const chartData = Array.isArray(data.chartData) ? data.chartData : [];

    switch (reportDef.chartType) {
      case 'column':
      case 'bar': {
        if (!chartData.length) return renderEmpty();
        const keys = Object.keys(chartData[0] || {});
        if (keys.length < 2) return renderEmpty();
        const categories = chartData.map((r) => r[keys[0]]);
        const values = chartData.map((r) => Number(r[keys[1]]) || 0);
        return (
          <Chart
            options={{
              chart: { type: 'bar', height: 250, background: 'transparent', toolbar: { show: false } },
              plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: chartData.length <= 8 } },
              colors: [reportDef.color],
              dataLabels: { enabled: true, style: { colors: ['#fff'], fontSize: '10px', fontWeight: 600 } },
              xaxis: {
                categories,
                labels: { style: { colors: axisLabelColor, fontSize: '10px' }, rotate: -45 },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: { labels: { style: { colors: axisLabelColor, fontSize: '10px' } } },
              grid: { borderColor: gridColor, strokeDashArray: 4 },
              legend: { show: false },
              tooltip: { theme: tooltipTheme },
            }}
            series={[{ name: keys[1], data: values }]}
            type="bar"
            height={250}
          />
        );
      }

      case 'line': {
        if (!chartData.length) return renderEmpty();
        const keys = Object.keys(chartData[0] || {});
        if (keys.length < 2) return renderEmpty();
        const categories = chartData.map((r) => r[keys[0]]);
        const values = chartData.map((r) => Number(r[keys[1]]) || 0);
        return (
          <Chart
            options={{
              chart: { type: 'area', height: 250, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
              colors: [reportDef.color],
              dataLabels: { enabled: false },
              stroke: { curve: 'smooth', width: 2.5 },
              fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
              xaxis: {
                categories,
                labels: { style: { colors: axisLabelColor, fontSize: '10px' } },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: { labels: { style: { colors: axisLabelColor, fontSize: '10px' } } },
              grid: { borderColor: gridColor, strokeDashArray: 4 },
              tooltip: { theme: tooltipTheme },
              markers: { size: 4, colors: [reportDef.color], strokeColors: '#fff', strokeWidth: 2 },
            }}
            series={[{ name: keys[1], data: values }]}
            type="area"
            height={250}
          />
        );
      }

      case 'pie': {
        if (!chartData.length) return renderEmpty();
        const keys = Object.keys(chartData[0] || {});
        if (keys.length < 2) return renderEmpty();
        const labels = chartData.map((r) => String(r[keys[0]]));
        const values = chartData.map((r) => Number(r[keys[1]]) || 0);
        return (
          <Chart
            options={{
              chart: { type: 'donut', height: 260, background: 'transparent' },
              labels,
              colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#EC4899'],
              plotOptions: {
                pie: {
                  donut: {
                    size: '65%',
                    labels: {
                      show: true,
                      name: { show: true, fontSize: '12px', fontWeight: 600, color: axisLabelColor },
                      value: { show: true, fontSize: '18px', fontWeight: 700, color: isDark ? '#F3F4F6' : '#1F2937' },
                      total: { show: true, label: 'Total', fontSize: '11px', color: axisLabelColor, formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) },
                    },
                  },
                },
              },
              dataLabels: { enabled: false },
              legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: axisLabelColor } },
              stroke: { show: false },
              tooltip: { theme: tooltipTheme },
            }}
            series={values}
            type="donut"
            height={260}
          />
        );
      }

      case 'stackedBar': {
        if (!chartData.length) return renderEmpty();
        const categories = chartData.map((r) => r.rango);
        return (
          <Chart
            options={{
              chart: { type: 'bar', height: 250, background: 'transparent', toolbar: { show: false }, stacked: true },
              plotOptions: { bar: { borderRadius: 4, horizontal: true } },
              colors: ['#3B82F6', '#10B981'],
              dataLabels: { enabled: false },
              xaxis: {
                categories,
                labels: { style: { colors: axisLabelColor, fontSize: '10px' } },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: { labels: { style: { colors: axisLabelColor, fontSize: '10px' } } },
              grid: { borderColor: gridColor, strokeDashArray: 4 },
              legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: axisLabelColor } },
              tooltip: { theme: tooltipTheme },
            }}
            series={[
              { name: 'Disponibles', data: chartData.map((r) => Number(r.disponibles) || 0) },
              { name: 'Vendidas', data: chartData.map((r) => Number(r.vendidas) || 0) },
            ]}
            type="bar"
            height={250}
          />
        );
      }

      case 'gauge': {
        const gaugeValue = Number(data.current ?? data.tasaCobro ?? 0);
        const gaugeColor = gaugeValue >= 70 ? '#10B981' : gaugeValue >= 40 ? '#F59E0B' : '#EF4444';
        return (
          <div className="flex flex-col items-center">
            <Chart
              options={{
                chart: { type: 'radialBar', height: 220, background: 'transparent' },
                plotOptions: {
                  radialBar: {
                    startAngle: -135,
                    endAngle: 135,
                    hollow: { size: '65%', background: 'transparent' },
                    track: { background: isDark ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
                    dataLabels: {
                      name: { show: true, fontSize: '12px', fontWeight: 600, color: axisLabelColor, offsetY: -8 },
                      value: { show: true, fontSize: '28px', fontWeight: 700, color: isDark ? '#F3F4F6' : '#1F2937', offsetY: 4, formatter: (val) => `${val}%` },
                    },
                  },
                },
                fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: gaugeColor, opacity: 1 }, { offset: 100, color: gaugeColor, opacity: 0.8 }] } },
                stroke: { lineCap: 'round' },
                labels: [reportDef.name],
              }}
              series={[Math.min(gaugeValue, 100)]}
              type="radialBar"
              height={220}
            />
          </div>
        );
      }

      case 'radar':
        return (
          <div className="flex flex-col items-center">
            <div className="text-5xl font-bold mb-4" style={{ color: reportDef.color }}>
              {Number(data.promedio || 0)}%
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-secondary-dark-bg rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.metric}</span>
                  <span className="font-bold" style={{ color: reportDef.color }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'map':
        if (!chartData.length) return renderEmpty();
        return (
          <div className="space-y-2">
            {chartData.slice(0, 8).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-secondary-dark-bg rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FaMapMarkedAlt style={{ color: reportDef.color }} />
                  {item.zona}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min((item.cantidad || 0) * 5, 100)}%`,
                        backgroundColor: reportDef.color,
                      }}
                    />
                  </div>
                  <span className="font-bold text-sm min-w-[24px] text-right" style={{ color: reportDef.color }}>
                    {item.cantidad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        if (!chartData.length) return renderEmpty();
        return (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800/60">
                  <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Propiedad</th>
                  <th className="p-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Días</th>
                  <th className="p-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Precio</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 5).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-2.5 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{item.titulo}</td>
                    <td className="p-2.5 text-right text-red-500 dark:text-red-400 font-bold">{item.diasEnMercado}</td>
                    <td className="p-2.5 text-right text-gray-700 dark:text-gray-300">${Number(item.precio || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Number(data.total || 0) > 5 && (
              <p className="text-center text-gray-400 dark:text-gray-500 mt-2 text-xs">+{Number(data.total || 0) - 5} más</p>
            )}
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: reportDef.color }}>
                {Number(data.total || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">citas este mes</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(data.porEstado || []).map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-secondary-dark-bg rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-lg font-bold" style={{ color: reportDef.color }}>
                    {item.cantidad}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.estado}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return renderEmpty('Tipo de gráfico no soportado');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
        <div className="mb-6">
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaChartBar className="text-indigo-500" /> Reportes y Estadísticas
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Analítica avanzada del negocio</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: currentColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 relative ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      {exportProgress !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${currentColor} transparent ${currentColor} ${currentColor}` }} />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">Generando Reporte PDF</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Capturando gráficos y datos del dashboard...
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%`, backgroundColor: currentColor }}
              />
            </div>
            <p className="text-sm font-medium" style={{ color: currentColor }}>{exportProgress}%</p>
          </div>
        </div>
      )}
      <Header category="Analítica" title="📊 Reportes y Estadísticas" />

      {/* Tabs de navegación */}
      <div className="flex flex-wrap gap-2 mb-6 border-b dark:border-gray-700 pb-4">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar /> },
          { id: 'selection', label: 'Selección de Reportes', icon: <FaClipboardList /> },
          { id: 'config', label: 'Configuración', icon: <FaCog /> },
          { id: 'history', label: 'Historial', icon: <FaHistory /> },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={activeTab === tab.id ? { backgroundColor: currentColor } : {}}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros de período */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="field-125" className="text-sm dark:text-gray-300">Año:</label>
          <select
            id="field-125"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="field-126" className="text-sm dark:text-gray-300">Mes:</label>
          <select
            id="field-126"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          >
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200"
        >
          <FaSync /> Actualizar
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => generateReport('manual', 'download')}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: currentColor }}
        >
          {generating ? <FaSync className="animate-spin" /> : <FaDownload />}
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={() => generateReport('manual', 'send')}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {generating ? <FaSync className="animate-spin" /> : <FaPaperPlane />}
          Enviar al ERP
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REPORT_DEFINITIONS.filter((r) => selectedReports[r.id]).map((report) => (
            <div
              key={report.id}
              ref={(el) => { chartRefs.current[report.id] = el; }}
              data-report-id={report.id}
              className={`${cardHover} ${expandedReport === report.id ? 'md:col-span-2' : ''}`}
              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg" style={{ color: report.color }}>{report.icon}</span>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{report.name}</h3>
                </div>
                <input
                  type="checkbox"
                  checked={selectedReports[report.id] || false}
                  onChange={(e) => { e.stopPropagation(); toggleReportSelection(report.id); }}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: currentColor }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{report.description}</p>
              {renderChart(report, reportData[report.id])}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'selection' && (
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold dark:text-gray-100">
              Selecciona los reportes para incluir en el informe anual
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Deseleccionar todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {REPORT_DEFINITIONS.map((report) => (
              <label
                htmlFor="field-127"
                key={report.id}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedReports[report.id]
                    ? 'border-2 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                style={selectedReports[report.id] ? { borderColor: currentColor } : {}}
              >
                <input
                  id="field-127"
                  type="checkbox"
                  checked={selectedReports[report.id] || false}
                  onChange={() => toggleReportSelection(report.id)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: currentColor }}
                />
                <div className="text-xl" style={{ color: report.color }}>{report.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium dark:text-gray-100 text-sm truncate">{report.name}</p>
                  <p className="text-xs text-gray-500 truncate">{report.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className={cardBase}>
            <h3 className="text-lg font-semibold mb-6 dark:text-gray-100">⚙️ Configuración de Envío Automático</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium dark:text-gray-100">Envío Automático Mensual</p>
                  <p className="text-sm text-gray-500">Los reportes se enviarán automáticamente al ERP cada mes</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAutoSend}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    reportConfig?.autoSendEnabled
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {reportConfig?.autoSendEnabled ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium dark:text-gray-100">Día de Envío</p>
                  <p className="text-sm text-gray-500">Día del mes en que se generará el reporte</p>
                </div>
                <select
                  value={reportConfig?.autoSendDay || 1}
                  onChange={async (e) => {
                    const day = parseInt(e.target.value, 10);
                    await crmService.reports.updateConfig({ autoSendDay: day });
                    setReportConfig((prev) => ({ ...prev, autoSendDay: day }));
                  }}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Día {d}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>ℹ️ Información:</strong> Los reportes mensuales se generan automáticamente
                  el día {reportConfig?.autoSendDay || 1} de cada mes y se envían al ERP en formato PDF.
                  También puedes generar reportes manualmente en cualquier momento.
                </p>
              </div>
            </div>
          </div>

          <div className={cardBase}>
            <h3 className="text-lg font-semibold mb-6 dark:text-gray-100">📊 Reportes Incluidos</h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {REPORT_DEFINITIONS.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg" style={{ color: report.color }}>{report.icon}</div>
                    <span className="dark:text-gray-200 text-sm">{report.name}</span>
                  </div>
                  {selectedReports[report.id] ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <span className="text-xs text-gray-400">No incluido</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-6 dark:text-gray-100">📜 Historial de Reportes Generados</h3>

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaFileAlt className="text-6xl mx-auto mb-4 opacity-30" />
              <p>No hay reportes generados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left dark:text-gray-300">Tipo</th>
                    <th className="p-3 text-left dark:text-gray-300">Período</th>
                    <th className="p-3 text-left dark:text-gray-300">Generado</th>
                    <th className="p-3 text-center dark:text-gray-300">Enviado al ERP</th>
                    <th className="p-3 text-center dark:text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((report, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3 dark:text-gray-300">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          report.type === 'annual' ? 'bg-purple-100 text-purple-700'
                            : report.type === 'monthly' ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                        >
                          {report.type === 'annual' ? 'Anual' : report.type === 'monthly' ? 'Mensual' : 'Manual'}
                        </span>
                      </td>
                      <td className="p-3 dark:text-gray-300">{report.period}</td>
                      <td className="p-3 dark:text-gray-300 text-sm">
                        {new Date(report.generatedAt).toLocaleString('es')}
                      </td>
                      <td className="p-3 text-center">
                        {report.sentToERP ? (
                          <span className="flex items-center justify-center gap-1 text-green-500">
                            <FaCheck /> Sí
                          </span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {!report.sentToERP && (
                          <button
                            type="button"
                            onClick={() => sendToERP(report._id)}
                            disabled={sending}
                            className="px-3 py-1 text-sm text-white rounded hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: currentColor }}
                          >
                            {sending ? 'Enviando...' : 'Enviar al ERP'}
                          </button>
                        )}
                        {report.sentToERP && report.sentAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(report.sentAt).toLocaleDateString('es')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reportes;
