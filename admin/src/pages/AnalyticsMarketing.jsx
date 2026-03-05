import React, { useState } from 'react';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { FaChartLine, FaUsers, FaEnvelope, FaMousePointer, FaDollarSign, FaTrophy, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, LineSeries, DateTime, Legend, Tooltip } from '@syncfusion/ej2-react-charts';

const AnalyticsMarketing = () => {
  const { currentMode, currentColor } = useStateContext();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('30dias');

  // Datos para gráficos
  const datosRendimiento = [
    { fecha: new Date(2025, 9, 1), enviados: 450, abiertos: 247, clicks: 89 },
    { fecha: new Date(2025, 9, 5), enviados: 520, abiertos: 286, clicks: 104 },
    { fecha: new Date(2025, 9, 10), enviados: 680, abiertos: 374, clicks: 136 },
    { fecha: new Date(2025, 9, 15), enviados: 590, abiertos: 325, clicks: 118 },
    { fecha: new Date(2025, 9, 20), enviados: 720, abiertos: 396, clicks: 144 },
    { fecha: new Date(2025, 9, 25), enviados: 650, abiertos: 358, clicks: 130 },
    { fecha: new Date(2025, 9, 30), enviados: 740, abiertos: 407, clicks: 148 }
  ];

  const topCampanas = [
    { nombre: 'Nuevas Propiedades Palermo', conversiones: 45, roi: 320, inversion: 450 },
    { nombre: 'Promoción Fin de Mes', conversiones: 32, roi: 280, inversion: 380 },
    { nombre: 'Newsletter Octubre', conversiones: 67, roi: 245, inversion: 890 },
    { nombre: 'Reactivación Clientes', conversiones: 23, roi: 190, inversion: 320 }
  ];

  const segmentosAudiencia = [
    { segmento: 'Compradores Activos', cantidad: 1250, engagement: 68, conversiones: 89 },
    { segmento: 'Inversores', cantidad: 890, engagement: 72, conversiones: 67 },
    { segmento: 'Primeros Compradores', cantidad: 456, engagement: 55, conversiones: 34 },
    { segmento: 'Clientes VIP', cantidad: 234, engagement: 85, conversiones: 78 }
  ];

  const canalesRendimiento = [
    { canal: 'Email', impresiones: 45000, clicks: 2340, conversiones: 234, costo: 1200 },
    { canal: 'Redes Sociales', impresiones: 89000, clicks: 3560, conversiones: 178, costo: 2400 },
    { canal: 'Google Ads', impresiones: 125000, clicks: 5000, conversiones: 312, costo: 4500 },
    { canal: 'SEO Orgánico', impresiones: 67000, clicks: 4020, conversiones: 289, costo: 0 }
  ];

  const cardBase = `bg-white dark:bg-secondary-dark-bg rounded-2xl p-6 shadow-lg`;

  return (
    <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
      <div className="flex justify-between items-center mb-6">
        <Header category="Marketing" title="Analytics de Marketing" />
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 dark:border-gray-600 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">
            <FaFilter /> Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 dark:border-gray-600 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">
            <FaCalendarAlt /> {periodoSeleccionado === '30dias' ? 'Últimos 30 días' : 'Este mes'}
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className={`${cardBase} bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Enviados</p>
              <p className="text-4xl font-bold">4,350</p>
              <p className="text-sm text-blue-100 mt-1">+18% vs anterior</p>
            </div>
            <FaEnvelope className="text-5xl opacity-30" />
          </div>
        </div>

        <div className={`${cardBase} bg-gradient-to-br from-green-500 to-green-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Tasa Apertura</p>
              <p className="text-4xl font-bold">55%</p>
              <p className="text-sm text-green-100 mt-1">+5% vs anterior</p>
            </div>
            <FaUsers className="text-5xl opacity-30" />
          </div>
        </div>

        <div className={`${cardBase} bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">CTR Promedio</p>
              <p className="text-4xl font-bold">19.4%</p>
              <p className="text-sm text-purple-100 mt-1">+2.3% vs anterior</p>
            </div>
            <FaMousePointer className="text-5xl opacity-30" />
          </div>
        </div>

        <div className={`${cardBase} bg-gradient-to-br from-orange-500 to-orange-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">ROI Total</p>
              <p className="text-4xl font-bold">285%</p>
              <p className="text-sm text-orange-100 mt-1">$12.5K generados</p>
            </div>
            <FaDollarSign className="text-5xl opacity-30" />
          </div>
        </div>
      </div>

      {/* Gráfico de Rendimiento */}
      <div className={`${cardBase} mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold dark:text-gray-200">📈 Rendimiento de Campañas</h3>
          <div className="flex gap-2">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Enviados
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Abiertos
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              Clicks
            </span>
          </div>
        </div>
        <ChartComponent
          id="rendimiento-chart"
          primaryXAxis={{
            valueType: 'DateTime',
            labelFormat: 'dd/MM',
            intervalType: 'Days',
            edgeLabelPlacement: 'Shift'
          }}
          primaryYAxis={{
            labelFormat: '{value}',
            title: 'Cantidad'
          }}
          tooltip={{ enable: true }}
          height="350px"
        >
          <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={datosRendimiento}
              xName="fecha"
              yName="enviados"
              name="Enviados"
              width="2"
              marker={{ visible: true, width: 8, height: 8 }}
              type="Line"
              fill="#3B82F6"
            />
            <SeriesDirective
              dataSource={datosRendimiento}
              xName="fecha"
              yName="abiertos"
              name="Abiertos"
              width="2"
              marker={{ visible: true, width: 8, height: 8 }}
              type="Line"
              fill="#10B981"
            />
            <SeriesDirective
              dataSource={datosRendimiento}
              xName="fecha"
              yName="clicks"
              name="Clicks"
              width="2"
              marker={{ visible: true, width: 8, height: 8 }}
              type="Line"
              fill="#8B5CF6"
            />
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Top Campañas */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4">
            <FaTrophy className="text-2xl text-yellow-500" />
            <h3 className="text-xl font-bold dark:text-gray-200">Top Campañas por ROI</h3>
          </div>
          <div className="space-y-3">
            {topCampanas.map((campana, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium dark:text-gray-200">{campana.nombre}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {campana.roi}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    💰 Inversión: ${campana.inversion}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ✅ Conversiones: {campana.conversiones}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmentos de Audiencia */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4">
            <FaUsers className="text-2xl" style={{ color: currentColor }} />
            <h3 className="text-xl font-bold dark:text-gray-200">Segmentos de Audiencia</h3>
          </div>
          <div className="space-y-3">
            {segmentosAudiencia.map((segmento, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold dark:text-gray-200">{segmento.segmento}</h4>
                  <span className="text-sm font-bold" style={{ color: currentColor }}>
                    {segmento.cantidad.toLocaleString()} usuarios
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Engagement</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${segmento.engagement}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">{segmento.engagement}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conversión</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${segmento.conversiones}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">{segmento.conversiones}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rendimiento por Canal */}
      <div className={cardBase}>
        <h3 className="text-xl font-bold mb-4 dark:text-gray-200">📊 Rendimiento por Canal</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 dark:border-gray-700">
                <th className="text-left p-3 dark:text-gray-200">Canal</th>
                <th className="text-right p-3 dark:text-gray-200">Impresiones</th>
                <th className="text-right p-3 dark:text-gray-200">Clicks</th>
                <th className="text-right p-3 dark:text-gray-200">CTR</th>
                <th className="text-right p-3 dark:text-gray-200">Conversiones</th>
                <th className="text-right p-3 dark:text-gray-200">Costo</th>
                <th className="text-right p-3 dark:text-gray-200">CPC</th>
              </tr>
            </thead>
            <tbody>
              {canalesRendimiento.map((canal, index) => (
                <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-medium dark:text-gray-200">{canal.canal}</td>
                  <td className="p-3 text-right dark:text-gray-300">{canal.impresiones.toLocaleString()}</td>
                  <td className="p-3 text-right dark:text-gray-300">{canal.clicks.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {((canal.clicks / canal.impresiones) * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {canal.conversiones}
                    </span>
                  </td>
                  <td className="p-3 text-right dark:text-gray-300">
                    {canal.costo > 0 ? `$${canal.costo.toLocaleString()}` : 'Gratis'}
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      {canal.costo > 0 ? `$${(canal.costo / canal.clicks).toFixed(2)}` : '$0'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights y Recomendaciones */}
      <div className={`${cardBase} mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800`}>
        <div className="flex items-start gap-4">
          <span className="text-6xl">💡</span>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">
              Insights y Recomendaciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2 text-green-600 dark:text-green-400">✅ Mejor Rendimiento</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los emails enviados los martes tienen 23% más apertura que otros días
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2 text-orange-600 dark:text-orange-400">⚠️ Área de Mejora</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  El segmento "Primeros Compradores" tiene baja conversión. Considera personalizar contenido
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2 text-blue-600 dark:text-blue-400">💰 Oportunidad</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SEO orgánico genera conversiones sin costo. Aumenta inversión en contenido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMarketing;
