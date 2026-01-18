import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, Legend, Category, Tooltip, 
  ColumnSeries, LineSeries, SplineAreaSeries, BarSeries, StackingColumnSeries, StackingBarSeries,
  AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective, 
  AccumulationLegend, AccumulationDataLabel, AccumulationTooltip, PieSeries,
  DataLabel
} from '@syncfusion/ej2-react-charts';
import { CircularGaugeComponent, AxesDirective, AxisDirective, PointersDirective, PointerDirective, RangesDirective, RangeDirective, Inject as GaugeInject, Annotations } from '@syncfusion/ej2-react-circulargauge';
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Inject as GridInject, PdfExport, ExcelExport, Toolbar } from '@syncfusion/ej2-react-grids';
import { 
  FaChartBar, FaDownload, FaCalendarAlt, FaFilter, FaArrowUp, FaDollarSign, FaUsers, FaHome,
  FaChartLine, FaChartPie, FaMapMarkedAlt, FaStar, FaEye, FaTrophy, FaMoneyBillWave,
  FaClock, FaExclamationTriangle, FaFileAlt, FaBalanceScale, FaCog, FaPaperPlane, FaCheck,
  FaBuilding, FaPercent, FaClipboardList, FaHistory, FaSync
} from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

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
  const gridRef = useRef(null);

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
        REPORT_DEFINITIONS.forEach(r => { defaultSelections[r.id] = true; });
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
      results.forEach(r => { dataMap[r.id] = r.data; });
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
    REPORT_DEFINITIONS.forEach(r => { newSelections[r.id] = select; });
    setSelectedReports(newSelections);
    
    try {
      await crmService.reports.updateConfig({ annualReportSelections: newSelections });
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  // Generar reporte PDF
  const generateReport = async (type = 'manual') => {
    setGenerating(true);
    try {
      const selectedIds = Object.entries(selectedReports)
        .filter(([, selected]) => selected)
        .map(([id]) => id);
      
      await crmService.reports.generate({
        type,
        period: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
        selectedReports: selectedIds,
      });
      
      // Recargar historial
      const historyRes = await crmService.reports.getHistory();
      setHistory(historyRes.data || []);
      
      alert('Reporte generado correctamente. Se enviará automáticamente al ERP.');
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  // Enviar al ERP
  const sendToERP = async (reportId) => {
    setSending(true);
    try {
      await crmService.reports.sendToERP(reportId);
      
      const historyRes = await crmService.reports.getHistory();
      setHistory(historyRes.data || []);
      
      alert('Reporte enviado al ERP correctamente');
    } catch (err) {
      console.error('Error sending to ERP:', err);
      alert('Error al enviar el reporte');
    } finally {
      setSending(false);
    }
  };

  // Configurar envío automático
  const toggleAutoSend = async () => {
    try {
      const newConfig = { autoSendEnabled: !reportConfig?.autoSendEnabled };
      await crmService.reports.updateConfig(newConfig);
      setReportConfig(prev => ({ ...prev, ...newConfig }));
    } catch (err) {
      console.error('Error updating auto send:', err);
    }
  };

  const cardBase = 'rounded-xl shadow-md p-6 bg-white dark:bg-secondary-dark-bg';
  const cardHover = `${cardBase} transition transform hover:scale-[1.02] cursor-pointer`;

  // Renderizar gráfico según tipo
  const renderChart = (reportDef, data) => {
    if (!data || data.error) {
      return <div className="text-gray-500 text-center py-8">Sin datos disponibles</div>;
    }

    const chartData = data.chartData || [];
    
    switch (reportDef.chartType) {
      case 'column':
      case 'bar':
        return (
          <ChartComponent
            id={`chart-${reportDef.id}`}
            primaryXAxis={{ valueType: 'Category', labelRotation: -45 }}
            primaryYAxis={{ title: '' }}
            tooltip={{ enable: true }}
            height="250px"
          >
            <Inject services={[ColumnSeries, BarSeries, Category, Tooltip, Legend, DataLabel]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={chartData}
                xName={Object.keys(chartData[0] || {})[0]}
                yName={Object.keys(chartData[0] || {})[1]}
                type={reportDef.chartType === 'bar' ? 'Bar' : 'Column'}
                fill={reportDef.color}
                marker={{ dataLabel: { visible: true, position: 'Top' } }}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        );

      case 'line':
        return (
          <ChartComponent
            id={`chart-${reportDef.id}`}
            primaryXAxis={{ valueType: 'Category' }}
            primaryYAxis={{ title: '' }}
            tooltip={{ enable: true }}
            height="250px"
          >
            <Inject services={[LineSeries, Category, Tooltip, Legend]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={chartData}
                xName={Object.keys(chartData[0] || {})[0]}
                yName={Object.keys(chartData[0] || {})[1]}
                type="Line"
                fill={reportDef.color}
                width={3}
                marker={{ visible: true, width: 8, height: 8, fill: reportDef.color }}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        );

      case 'pie':
        return (
          <AccumulationChartComponent
            id={`chart-${reportDef.id}`}
            tooltip={{ enable: true }}
            legendSettings={{ visible: true, position: 'Bottom' }}
            height="250px"
          >
            <Inject services={[PieSeries, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                type="Pie"
                dataSource={chartData}
                xName={Object.keys(chartData[0] || {})[0]}
                yName={Object.keys(chartData[0] || {})[1]}
                innerRadius="30%"
                dataLabel={{ visible: true, position: 'Outside' }}
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        );

      case 'stackedBar':
        return (
          <ChartComponent
            id={`chart-${reportDef.id}`}
            primaryXAxis={{ valueType: 'Category' }}
            primaryYAxis={{ title: '' }}
            tooltip={{ enable: true }}
            height="250px"
          >
            <Inject services={[StackingBarSeries, Category, Tooltip, Legend]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={chartData}
                xName="rango"
                yName="disponibles"
                type="StackingBar"
                name="Disponibles"
                fill="#3B82F6"
              />
              <SeriesDirective
                dataSource={chartData}
                xName="rango"
                yName="vendidas"
                type="StackingBar"
                name="Vendidas"
                fill="#10B981"
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        );

      case 'gauge':
        const gaugeValue = data.current || data.tasaCobro || 0;
        return (
          <div className="flex flex-col items-center">
            <CircularGaugeComponent
              id={`gauge-${reportDef.id}`}
              height="200px"
              width="200px"
            >
              <GaugeInject services={[Annotations]} />
              <AxesDirective>
                <AxisDirective
                  minimum={0}
                  maximum={100}
                  startAngle={230}
                  endAngle={130}
                  lineStyle={{ width: 0 }}
                  majorTicks={{ width: 0 }}
                  minorTicks={{ width: 0 }}
                  labelStyle={{ font: { size: '0px' } }}
                >
                  <RangesDirective>
                    <RangeDirective start={0} end={40} color="#EF4444" startWidth={20} endWidth={20} />
                    <RangeDirective start={40} end={70} color="#F59E0B" startWidth={20} endWidth={20} />
                    <RangeDirective start={70} end={100} color="#10B981" startWidth={20} endWidth={20} />
                  </RangesDirective>
                  <PointersDirective>
                    <PointerDirective value={gaugeValue} radius="80%" color={reportDef.color} pointerWidth={10} />
                  </PointersDirective>
                </AxisDirective>
              </AxesDirective>
            </CircularGaugeComponent>
            <p className="text-3xl font-bold mt-2" style={{ color: reportDef.color }}>{gaugeValue}%</p>
          </div>
        );

      case 'radar':
        return (
          <div className="flex flex-col items-center">
            <div className="text-5xl font-bold mb-4" style={{ color: reportDef.color }}>
              {data.promedio || 0}%
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm dark:text-gray-300">{item.metric}</span>
                  <span className="font-bold" style={{ color: reportDef.color }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-2">
            {chartData.slice(0, 8).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm dark:text-gray-300 flex items-center gap-2">
                  <FaMapMarkedAlt style={{ color: reportDef.color }} />
                  {item.zona}
                </span>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(item.cantidad * 5, 100)}px`,
                      backgroundColor: reportDef.color 
                    }} 
                  />
                  <span className="font-bold text-sm" style={{ color: reportDef.color }}>{item.cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-2 text-left dark:text-gray-300">Propiedad</th>
                  <th className="p-2 text-right dark:text-gray-300">Días</th>
                  <th className="p-2 text-right dark:text-gray-300">Precio</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 5).map((item, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-700">
                    <td className="p-2 dark:text-gray-300 truncate max-w-[150px]">{item.titulo}</td>
                    <td className="p-2 text-right text-red-500 font-bold">{item.diasEnMercado}</td>
                    <td className="p-2 text-right dark:text-gray-300">${(item.precio || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.total > 5 && (
              <p className="text-center text-gray-500 mt-2 text-xs">+{data.total - 5} más</p>
            )}
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: reportDef.color }}>{data.total || 0}</p>
              <p className="text-sm text-gray-500">citas este mes</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(data.porEstado || []).map((item, idx) => (
                <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                  <p className="text-lg font-bold" style={{ color: reportDef.color }}>{item.cantidad}</p>
                  <p className="text-xs text-gray-500">{item.estado}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div className="text-gray-500 text-center py-8">Tipo de gráfico no soportado</div>;
    }
  };

  // KPIs rápidos
  const kpis = [
    { 
      title: 'Reportes Seleccionados', 
      value: Object.values(selectedReports).filter(Boolean).length,
      total: REPORT_DEFINITIONS.length,
      icon: <FaChartBar />,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      title: 'Envío Automático', 
      value: reportConfig?.autoSendEnabled ? 'Activo' : 'Inactivo',
      icon: <FaPaperPlane />,
      color: reportConfig?.autoSendEnabled ? 'from-green-500 to-green-600' : 'from-gray-400 to-gray-500'
    },
    { 
      title: 'Reportes Generados', 
      value: history.length,
      icon: <FaFileAlt />,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      title: 'Enviados al ERP', 
      value: history.filter(h => h.sentToERP).length,
      icon: <FaCheck />,
      color: 'from-orange-500 to-orange-600'
    },
  ];

  if (loading) {
    return (
      <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-main-bg dark:bg-main-dark-bg rounded-3xl">
        <Header category="Analítica" title="📊 Reportes y Estadísticas" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: currentColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-main-bg dark:bg-main-dark-bg rounded-3xl">
      <Header category="Analítica" title="📊 Reportes y Estadísticas" />
      
      {/* Tabs de navegación */}
      <div className="flex flex-wrap gap-2 mb-6 border-b dark:border-gray-700 pb-4">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar /> },
          { id: 'selection', label: 'Selección de Reportes', icon: <FaClipboardList /> },
          { id: 'config', label: 'Configuración', icon: <FaCog /> },
          { id: 'history', label: 'Historial', icon: <FaHistory /> },
        ].map(tab => (
          <button
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
          <label className="text-sm dark:text-gray-300">Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm dark:text-gray-300">Mes:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          >
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200"
        >
          <FaSync /> Actualizar
        </button>
        <div className="flex-1" />
        <button
          onClick={() => generateReport('manual')}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: currentColor }}
        >
          {generating ? <FaSync className="animate-spin" /> : <FaDownload />}
          Generar PDF
        </button>
        <button
          onClick={() => generateReport('annual')}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {generating ? <FaSync className="animate-spin" /> : <FaFileAlt />}
          Reporte Anual
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className={cardBase}>
            <div className="flex items-center gap-4">
              <div className={`text-2xl text-white p-3 rounded-lg bg-gradient-to-br ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                <p className="text-xl font-bold dark:text-gray-100">
                  {kpi.value}{kpi.total && `/${kpi.total}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {REPORT_DEFINITIONS.filter(r => selectedReports[r.id]).map((report) => (
            <div 
              key={report.id} 
              className={`${cardHover} ${expandedReport === report.id ? 'xl:col-span-2 xl:row-span-2' : ''}`}
              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-xl p-2 rounded-lg text-white" style={{ backgroundColor: report.color }}>
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-gray-100">{report.name}</h3>
                    <p className="text-xs text-gray-500">{report.description}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedReports[report.id] || false}
                  onChange={(e) => { e.stopPropagation(); toggleReportSelection(report.id); }}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: currentColor }}
                />
              </div>
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
                onClick={() => toggleAll(true)}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Seleccionar todos
              </button>
              <button
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
                key={report.id}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedReports[report.id] 
                    ? 'border-2 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                style={selectedReports[report.id] ? { borderColor: currentColor } : {}}
              >
                <input
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
                    const day = parseInt(e.target.value);
                    await crmService.reports.updateConfig({ autoSendDay: day });
                    setReportConfig(prev => ({ ...prev, autoSendDay: day }));
                  }}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
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
                          report.type === 'annual' ? 'bg-purple-100 text-purple-700' :
                          report.type === 'monthly' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
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
