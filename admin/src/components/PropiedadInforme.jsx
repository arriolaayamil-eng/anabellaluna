import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaFilePdf, FaSpinner, FaBuilding, FaChartBar, FaUsers, FaCalendar, FaEye, FaHeart, FaStar } from 'react-icons/fa';
import crmService from '../services/crmService';
import API_CONFIG, { getAuthToken } from '../config/api';

const tipoLabels = {
  nota: 'Nota',
  recontacto: 'Recontacto',
  visita_agendada: 'Visita Agendada',
  visita_realizada: 'Visita Realizada',
  propiedad_interes: 'Interés en Propiedad',
  opcion_pago: 'Opción de Pago',
  preferencia: 'Preferencia',
};

const nivelColor = { alto: '#16a34a', medio: '#d97706', bajo: '#dc2626' };

const PropiedadInforme = ({ propiedad, onClose, isDark }) => {
  const [dias, setDias] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const loadReport = useCallback(async () => {
    if (!propiedad?.id) return;
    setLoading(true);
    setError('');
    try {
      const result = await crmService.clientInteractions.ownerReport(propiedad.id, dias);
      setData(result);
    } catch (e) {
      setError(e?.message || 'Error al generar el informe');
    } finally {
      setLoading(false);
    }
  }, [propiedad?.id, dias]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const handleDownloadPdf = async () => {
    if (!propiedad?.id) return;
    setDownloadingPdf(true);
    try {
      const path = crmService.clientInteractions.ownerReportPdfUrl(propiedad.id, dias);
      const base = API_CONFIG.baseURL || '';
      const token = getAuthToken();
      const url = `${base}${path}${token ? `&token=${token}` : ''}`;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const card = `rounded-xl p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const kpiCard = `rounded-xl p-4 text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div id="informe-print-root" className={`w-full max-w-4xl rounded-2xl border my-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>

          <div className={`flex items-center justify-between px-6 py-4 border-b no-print ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <FaBuilding className="text-orange-500 text-xl" />
              <div>
                <h2 className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Informe de Mercado</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{propiedad?.titulo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Período:</span>
                <select value={dias} onChange={(e) => setDias(Number(e.target.value))}
                  className={`text-sm px-3 py-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'border-gray-300'}`}>
                  <option value={30}>Últimos 30 días</option>
                  <option value={90}>Últimos 90 días</option>
                </select>
              </div>
              <button onClick={handleDownloadPdf} disabled={downloadingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                {downloadingPdf ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                {downloadingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {loading && (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-blue-500 mr-3" />
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Generando informe...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {data && !loading && (
              <>
                <div className={card}>
                  <h3 className={`font-bold text-base mb-3 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    <FaBuilding className="text-orange-500" /> Propiedad
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className={`text-xs mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Título</p>
                      <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{data.propiedad.titulo || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dirección</p>
                      <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{data.propiedad.direccion || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estado</p>
                      <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{data.propiedad.estado || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Días publicada</p>
                      <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{data.propiedad.tiempoPublicado} días</p>
                    </div>
                  </div>
                </div>

                <div className={card}>
                  <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    <FaChartBar className="text-blue-500" /> Resumen del período ({data.dias} días)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Consultas', value: data.resumen.consultas, icon: <FaEye />, color: 'text-blue-500' },
                      { label: 'Visitas Agendadas', value: data.resumen.visitasAgendadas, icon: <FaCalendar />, color: 'text-indigo-500' },
                      { label: 'Visitas Realizadas', value: data.resumen.visitasRealizadas, icon: <FaUsers />, color: 'text-emerald-500' },
                      { label: 'Clientes Interesados', value: data.resumen.clientesInteresados, icon: <FaHeart />, color: 'text-pink-500' },
                      { label: 'Guardados', value: data.resumen.favorites, icon: <FaStar />, color: 'text-yellow-500' },
                      { label: 'Interacciones', value: data.resumen.totalInteracciones, icon: <FaChartBar />, color: 'text-purple-500' },
                      { label: 'Asistencia Visitas', value: data.resumen.visitasAsistencia, icon: <FaUsers />, color: 'text-teal-500' },
                      { label: 'Índice de Intención', value: `${data.resumen.intentScore}/100`, icon: <FaStar />, color: 'text-orange-500' },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label} className={kpiCard}>
                        <div className={`text-2xl mb-1 flex justify-center ${color}`}>{icon}</div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(data.interestLevels.alto > 0 || data.interestLevels.medio > 0 || data.interestLevels.bajo > 0) && (
                  <div className={card}>
                    <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                      <FaHeart className="text-pink-500" /> Niveles de Interés
                    </h3>
                    <div className="flex gap-6">
                      {Object.entries(data.interestLevels).map(([nivel, count]) => (
                        <div key={nivel} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: nivelColor[nivel] }} />
                          <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{nivel}:</span>
                          <span className={`font-bold text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.paymentOffers?.length > 0 && (
                  <div className={card}>
                    <h3 className={`font-bold text-base mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Ofertas de Pago Recibidas</h3>
                    <div className="space-y-2">
                      {data.paymentOffers.map((o, i) => (
                        <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-yellow-50 border border-yellow-100'}`}>
                          <span className={`text-sm font-medium capitalize ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{o.tipo}</span>
                          {o.montoOfrecido > 0 && (
                            <span className="font-bold text-sm text-green-600">{o.moneda} ${o.montoOfrecido.toLocaleString()}</span>
                          )}
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(o.fecha).toLocaleDateString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.weeklyTrend?.length > 0 && (
                  <div className={card}>
                    <h3 className={`font-bold text-base mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Tendencia Semanal (últimas 4 semanas)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            <th className="text-left py-2 font-medium">Semana</th>
                            <th className="text-center py-2 font-medium">Interacciones</th>
                            <th className="text-center py-2 font-medium">Consultas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.weeklyTrend.map((w, i) => (
                            <tr key={i} className={`border-t ${isDark ? 'border-gray-700 text-gray-200' : 'border-gray-100 text-gray-700'}`}>
                              <td className="py-2">{w.semana}</td>
                              <td className="text-center py-2 font-semibold">{w.interacciones}</td>
                              <td className="text-center py-2 font-semibold">{w.consultas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {data.interacciones?.length > 0 && (
                  <div className={card}>
                    <h3 className={`font-bold text-base mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                      Historial de Interacciones ({data.interacciones.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {data.interacciones.map((inter) => (
                        <div key={inter._id} className={`p-3 rounded-lg border text-sm ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                inter.tipo === 'visita_realizada' ? 'bg-emerald-100 text-emerald-700' :
                                inter.tipo === 'visita_agendada' ? 'bg-blue-100 text-blue-700' :
                                inter.tipo === 'propiedad_interes' ? 'bg-purple-100 text-purple-700' :
                                inter.tipo === 'opcion_pago' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'}`}>
                                {tipoLabels[inter.tipo] || inter.tipo}
                              </span>
                              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{inter.cliente?.nombre}</span>
                              {inter.cliente?.telefono && <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{inter.cliente.telefono}</span>}
                            </div>
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(inter.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {inter.descripcion && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{inter.descripcion}</p>}
                          {inter.nivelInteres && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Interés: <span className="font-semibold capitalize">{inter.nivelInteres}</span></p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className={`text-xs text-center pt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Informe generado el {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })} · Período: últimos {data.dias} días
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PropiedadInforme;
