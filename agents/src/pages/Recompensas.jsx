import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaStar, FaRegStar, FaMedal, FaAward, FaSync, FaChartLine, FaTimes } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const Recompensas = () => {
  const { currentColor, currentMode } = useStateContext();
  const [rewards, setRewards] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedModal, setSelectedModal] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rewardsData, metricsData] = await Promise.all([
        crmService.rewards.getMy(),
        crmService.rewards.getMetrics('monthly'),
      ]);
      setRewards(Array.isArray(rewardsData) ? rewardsData : []);
      setMetrics(metricsData);
    } catch (e) {
      console.error('Error loading rewards:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await crmService.rewards.calculate();
      await loadData();
    } catch (e) {
      console.error('Error calculating rewards:', e);
    } finally {
      setCalculating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const stars = rewards.filter((r) => r.category === 'star');
  const medals = rewards.filter((r) => r.category === 'medal');
  const badges = rewards.filter((r) => r.category === 'badge');
  const levels = rewards.filter((r) => r.category === 'level');
  const currentLevel = levels.length > 0 ? levels[levels.length - 1] : null;

  const getSeniorityData = () => {
    if (currentLevel) {
      const levelName = currentLevel.title?.toLowerCase() || '';
      if (levelName.includes('senior') && !levelName.includes('semi')) {
        return { name: 'Senior', stars: 5, icon: '🌳' };
      } if (levelName.includes('semi')) {
        return { name: 'Semi-Senior', stars: 4, icon: '🌿' };
      }
    }
    return { name: 'Junior', stars: 2, icon: '🌱' };
  };

  const seniorityData = getSeniorityData();
  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  const groupedRewards = {
    stars: { title: 'Estrellas de Actividad', icon: <FaStar className="text-yellow-400" />, items: stars, color: 'yellow' },
    medals: { title: 'Medallas', icon: <FaMedal className="text-amber-500" />, items: medals, color: 'amber' },
    badges: { title: 'Badges', icon: <FaAward className="text-blue-500" />, items: badges, color: 'blue' },
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaTrophy className="text-amber-500" /> Mis Recompensas
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Logros y gamificación</p>
        </div>
        <button
          type="button"
          onClick={handleCalculate}
          disabled={calculating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          style={{ backgroundColor: currentColor }}
        >
          <FaSync className={calculating ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentColor }} />
        </div>
      ) : (
        <>
          {/* Medallas obtenidas (display) */}
          <div className="flex justify-center mb-8 gap-6">
            {medals.length > 0 ? (
              medals.slice(0, 3).map((medal, idx) => (
                <div
                  key={medal._id || idx}
                  onClick={() => setSelectedModal({ type: 'medal', data: medal })}
                  className="cursor-pointer transform hover:scale-110 transition-transform duration-200"
                  title={medal.title}
                >
                  <div className="h-12 md:h-16 w-12 md:w-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl md:text-3xl">{medal.icon || '🏅'}</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="h-12 md:h-16 w-12 md:w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center opacity-40" title="Sin medallas aún">
                  <FaMedal className="text-2xl text-gray-400" />
                </div>
                <div className="h-12 md:h-16 w-12 md:w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center opacity-40" title="Sin medallas aún">
                  <FaMedal className="text-2xl text-gray-400" />
                </div>
                <div className="h-12 md:h-16 w-12 md:w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center opacity-40" title="Sin medallas aún">
                  <FaMedal className="text-2xl text-gray-400" />
                </div>
              </>
            )}
          </div>

          {/* KPIs de logros e insignias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Nivel de experiencia */}
            <div
              onClick={() => setSelectedModal({ type: 'level', data: { ...seniorityData, metrics } })}
              className={`${cardBase} bg-gradient-to-br from-amber-100 via-amber-50 to-white dark:from-amber-900/40 dark:via-amber-800/40 dark:to-secondary-dark-bg border border-amber-300/60 dark:border-amber-700/60 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
                  Nivel de experiencia
                </p>
                <div className="flex items-center gap-1 bg-amber-500 text-white text-[11px] px-2 py-1 rounded-full shadow-sm">
                  <FaTrophy className="text-xs" />
                  <span>Ranking {seniorityData.name.toUpperCase()}</span>
                </div>
              </div>
              <p className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {seniorityData.icon} {seniorityData.name}
              </p>
              <div className="mt-2 flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  i < seniorityData.stars ? <FaStar key={i} /> : <FaRegStar key={i} />
                ))}
                <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-200">
                  {seniorityData.stars}/5 estrellas
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {metrics ? `${metrics.totalClients || 0} clientes gestionados` : 'Basado en clientes gestionados'}
              </p>
            </div>

            {/* Estrellas de actividad */}
            <div
              onClick={() => setSelectedModal({ type: 'streak', data: { stars, metrics } })}
              className={`${cardBase} bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white relative overflow-hidden cursor-pointer`}
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Estrellas de Actividad
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-900/60 border border-emerald-300/40">
                    Logins semanales
                  </span>
                </div>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">
                  {stars.length} ⭐
                </p>
                <p className="mt-1 text-[11px] text-emerald-100">
                  Estrellas ganadas por iniciar sesión 5+ veces por semana.
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold">Logins esta semana</span>
                    <span>Meta: 5 días</span>
                  </div>
                  <div className="w-full bg-emerald-900/50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-lime-300 via-yellow-300 to-orange-300 h-2.5 rounded-full"
                      style={{ width: `${Math.min(((metrics?.loginCount || 0) / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                  {stars.slice(-3).map((star, idx) => (
                    <span key={star._id || idx} className="px-2 py-1 rounded-full bg-emerald-900/60 border border-emerald-300/40">
                      ⭐ {new Date(star.createdAt).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                  {stars.length === 0 && (
                    <span className="px-2 py-1 rounded-full bg-emerald-900/60 border border-emerald-300/40">
                      ¡Gana tu primera estrella!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Insignias obtenidas */}
            <div
              onClick={() => setSelectedModal({ type: 'badges', data: { badges, medals } })}
              className={`${cardBase} bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 text-white relative overflow-hidden cursor-pointer`}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_white,_transparent_55%)]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Insignias obtenidas
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-900/60 border border-indigo-300/40">
                    Colección
                  </span>
                </div>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">
                  {badges.length + medals.length}
                </p>
                <p className="mt-1 text-[11px] text-sky-100">
                  {badges.length} badges + {medals.length} medallas por desempeño.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                  {[...badges, ...medals].slice(0, 3).map((item, idx) => (
                    <span key={item._id || idx} className="px-2 py-1 rounded-full bg-indigo-900/70 border border-sky-300/50">
                      {item.icon} {item.title?.split(' ')[0]}
                    </span>
                  ))}
                  {badges.length + medals.length === 0 && (
                    <span className="px-2 py-1 rounded-full bg-indigo-900/70 border border-sky-300/50">
                      ¡Gana tu primera insignia!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Estrellas</p>
                  <p className="text-3xl font-bold">{stars.length}</p>
                </div>
                <FaStar className="text-4xl opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Medallas</p>
                  <p className="text-3xl font-bold">{medals.length}</p>
                </div>
                <FaMedal className="text-4xl opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Badges</p>
                  <p className="text-3xl font-bold">{badges.length}</p>
                </div>
                <FaAward className="text-4xl opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Total</p>
                  <p className="text-3xl font-bold">{rewards.length}</p>
                </div>
                <FaTrophy className="text-4xl opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Mi Nivel</p>
                  <p className="text-xl font-bold capitalize">{currentLevel?.title?.split(' ')[1] || 'Junior'}</p>
                </div>
                <span className="text-4xl">{currentLevel?.icon || '🌱'}</span>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          {metrics && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                <FaChartLine style={{ color: currentColor }} /> Mi Rendimiento Mensual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Datos Completos</span>
                    <span className="font-medium dark:text-gray-200">{Math.round(metrics.dataCompletenessPercent || 0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${metrics.dataCompletenessPercent || 0}%`,
                        backgroundColor: metrics.dataCompletenessPercent >= 90 ? '#10B981' : currentColor,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Meta: 90% para obtener badge</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Tasa de Conversión</span>
                    <span className="font-medium dark:text-gray-200">{Math.round(metrics.conversionRate || 0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(metrics.conversionRate || 0, 100)}%`,
                        backgroundColor: metrics.conversionRate >= 30 ? '#FFD700' : metrics.conversionRate >= 20 ? '#C0C0C0' : metrics.conversionRate >= 10 ? '#CD7F32' : currentColor,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">🥉10% 🥈20% 🥇30%</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Calificación Promedio</span>
                    <span className="font-medium dark:text-gray-200">{(metrics.avgRating || 0).toFixed(1)} ⭐</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${((metrics.avgRating || 0) / 5) * 100}%`,
                        backgroundColor: metrics.avgRating >= 4.8 ? '#FFD700' : metrics.avgRating >= 4.5 ? '#C0C0C0' : metrics.avgRating >= 4.0 ? '#CD7F32' : currentColor,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">🥉4.0+ 🥈4.5+ 🥇4.8+</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold dark:text-gray-100">{metrics.totalClients || 0}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Clientes</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold dark:text-gray-100">{metrics.totalEnquiries || 0}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Consultas</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold dark:text-gray-100">{metrics.leadsConverted || 0}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Conversiones</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold dark:text-gray-100">{metrics.enquiriesRespondedIn24h || 0}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Respuestas &lt;24h</div>
                </div>
              </div>
            </div>
          )}

          {/* Rewards by Category */}
          <div className="space-y-6">
            {Object.entries(groupedRewards).map(([key, group]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  {group.icon} {group.title} ({group.items.length})
                </h3>
                {group.items.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4">
                    Aún no tienes {group.title.toLowerCase()}. ¡Sigue trabajando para ganarlas!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((reward) => (
                      <div
                        key={reward._id}
                        className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm flex items-start gap-3"
                      >
                        <div
                          className="text-3xl p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${reward.color}20` }}
                        >
                          {reward.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium dark:text-gray-100 truncate">{reward.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {reward.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDate(reward.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* How to Earn */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
              <FaTrophy style={{ color: currentColor }} /> ¿Cómo ganar recompensas?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 font-medium dark:text-gray-100 mb-2">
                  <span className="text-xl">⭐</span> Estrella Semanal
                </div>
                <p className="text-gray-600 dark:text-gray-400">Inicia sesión al menos 5 veces por semana</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 font-medium dark:text-gray-100 mb-2">
                  <span className="text-xl">📊</span> Badge Datos Completos
                </div>
                <p className="text-gray-600 dark:text-gray-400">Mantén el 90% de tu cartera actualizada</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 font-medium dark:text-gray-100 mb-2">
                  <span className="text-xl">⚡</span> Badge Respuesta Rápida
                </div>
                <p className="text-gray-600 dark:text-gray-400">Responde el 80% de consultas en menos de 24h</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 font-medium dark:text-gray-100 mb-2">
                  <span className="text-xl">🥉🥈🥇</span> Medallas Conversión
                </div>
                <p className="text-gray-600 dark:text-gray-400">Convierte 10%/20%/30% de tus leads mensuales</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 font-medium dark:text-gray-100 mb-2">
                  <span className="text-xl">🥉🥈🥇</span> Medallas Satisfacción
                </div>
                <p className="text-gray-600 dark:text-gray-400">Obtén calificación promedio de 4.0/4.5/4.8+</p>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 font-medium dark:text-gray-100 mb-2">
                  <span className="text-xl">🌱🌿🌳</span> Niveles de Seniority
                </div>
                <p className="text-gray-600 dark:text-gray-400">Gestiona hasta 20 / 21-50 / más de 50 clientes</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal para detalles */}
      {selectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedModal(null)}>
          <div className="relative mx-4 max-w-lg w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes className="text-xl" />
            </button>

            {selectedModal.type === 'level' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{selectedModal.data.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold dark:text-gray-100">Nivel: {selectedModal.data.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        i < selectedModal.data.stars ? <FaStar key={i} /> : <FaRegStar key={i} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm dark:text-gray-300">
                  <p><strong>Clientes gestionados:</strong> {selectedModal.data.metrics?.totalClients || 0}</p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium mb-2">Niveles de Seniority:</p>
                    <ul className="text-xs space-y-1">
                      <li>🌱 <strong>Junior:</strong> Hasta 20 clientes</li>
                      <li>🌿 <strong>Semi-Senior:</strong> 21-50 clientes</li>
                      <li>🌳 <strong>Senior:</strong> Más de 50 clientes</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedModal.type === 'streak' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FaStar className="text-4xl text-yellow-400" />
                  <div>
                    <h3 className="text-xl font-bold dark:text-gray-100">Estrellas de Actividad</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedModal.data.stars?.length || 0} estrellas ganadas</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium mb-2 dark:text-gray-200">¿Cómo ganar estrellas?</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inicia sesión al menos 5 veces por semana para obtener una estrella semanal.</p>
                  </div>
                  {selectedModal.data.stars?.length > 0 && (
                    <div>
                      <p className="font-medium mb-2 dark:text-gray-200">Historial:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedModal.data.stars.slice(-6).map((star, idx) => (
                          <div key={star._id || idx} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                            <span>⭐</span>
                            <span className="dark:text-gray-300">{new Date(star.createdAt).toLocaleDateString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedModal.type === 'badges' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FaAward className="text-4xl text-blue-500" />
                  <div>
                    <h3 className="text-xl font-bold dark:text-gray-100">Mis Insignias</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedModal.data.badges?.length} badges + {selectedModal.data.medals?.length} medallas</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedModal.data.badges?.length > 0 && (
                    <div>
                      <p className="font-medium mb-2 dark:text-gray-200">Badges:</p>
                      <div className="space-y-2">
                        {selectedModal.data.badges.map((badge, idx) => (
                          <div key={badge._id || idx} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-2xl">{badge.icon}</span>
                            <div>
                              <p className="font-medium dark:text-gray-200">{badge.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedModal.data.medals?.length > 0 && (
                    <div>
                      <p className="font-medium mb-2 dark:text-gray-200">Medallas:</p>
                      <div className="space-y-2">
                        {selectedModal.data.medals.map((medal, idx) => (
                          <div key={medal._id || idx} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <span className="text-2xl">{medal.icon}</span>
                            <div>
                              <p className="font-medium dark:text-gray-200">{medal.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{medal.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedModal.data.badges?.length === 0 && selectedModal.data.medals?.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aún no tienes insignias. ¡Sigue trabajando para ganarlas!</p>
                  )}
                </div>
              </div>
            )}

            {selectedModal.type === 'medal' && (
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedModal.data.icon || '🏅'}</div>
                <h3 className="text-xl font-bold dark:text-gray-100">{selectedModal.data.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{selectedModal.data.description}</p>
                <p className="text-xs text-gray-400 mt-3">Obtenida el {new Date(selectedModal.data.createdAt).toLocaleDateString('es-AR')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recompensas;
