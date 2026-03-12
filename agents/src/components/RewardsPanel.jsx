import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaStar, FaMedal, FaAward, FaTimes, FaSync, FaChartLine } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const RewardsPanel = ({ onClose }) => {
  const { currentColor } = useStateContext();
  const [rewards, setRewards] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rewards');

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
    try {
      await crmService.rewards.calculate();
      loadData();
    } catch (e) {
      console.error('Error calculating rewards:', e);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'star': return <FaStar className="text-yellow-400" />;
      case 'medal': return <FaMedal className="text-amber-500" />;
      case 'badge': return <FaAward className="text-blue-500" />;
      case 'level': return <FaTrophy className="text-green-500" />;
      default: return <FaAward />;
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

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] p-6 rounded-lg w-96 max-h-[80vh] overflow-hidden shadow-xl z-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FaTrophy style={{ color: currentColor }} className="text-xl" />
          <h3 className="font-semibold text-lg dark:text-gray-100">Mis Logros</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCalculate}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Actualizar recompensas"
          >
            <FaSync className="text-gray-500 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-xl font-bold text-yellow-600">{stars.length}</div>
          <div className="text-xs text-yellow-700 dark:text-yellow-400">Estrellas</div>
        </div>
        <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="text-xl font-bold text-amber-600">{medals.length}</div>
          <div className="text-xs text-amber-700 dark:text-amber-400">Medallas</div>
        </div>
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{badges.length}</div>
          <div className="text-xs text-blue-700 dark:text-blue-400">Badges</div>
        </div>
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-xl font-bold text-green-600">{levels.length > 0 ? levels[0].title.split(' ')[1] : '-'}</div>
          <div className="text-xs text-green-700 dark:text-green-400">Nivel</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'rewards'
              ? 'border-b-2 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          style={activeTab === 'rewards' ? { borderColor: currentColor, color: currentColor } : {}}
        >
          Recompensas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'border-b-2 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          style={activeTab === 'metrics' ? { borderColor: currentColor, color: currentColor } : {}}
        >
          <FaChartLine className="inline mr-1" /> Métricas
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-80">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentColor }} />
          </div>
        ) : activeTab === 'rewards' ? (
          <div className="space-y-3">
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaTrophy className="text-4xl mx-auto mb-2 opacity-30" />
                <p>Aún no tienes recompensas</p>
                <p className="text-xs mt-1">¡Sigue trabajando para ganar logros!</p>
              </div>
            ) : (
              rewards.map((reward) => (
                <div
                  key={reward._id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div
                    className="text-2xl p-2 rounded-lg"
                    style={{ backgroundColor: `${reward.color}20` }}
                  >
                    {reward.icon || getCategoryIcon(reward.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm dark:text-gray-100 truncate">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reward.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(reward.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {metrics ? (
              <>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-sm dark:text-gray-100 mb-3">Rendimiento Mensual</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Datos Completos</span>
                        <span className="font-medium dark:text-gray-200">{Math.round(metrics.dataCompletenessPercent || 0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${metrics.dataCompletenessPercent || 0}%`,
                            backgroundColor: metrics.dataCompletenessPercent >= 90 ? '#10B981' : currentColor,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Tasa de Conversión</span>
                        <span className="font-medium dark:text-gray-200">{Math.round(metrics.conversionRate || 0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(metrics.conversionRate || 0, 100)}%`,
                            backgroundColor: metrics.conversionRate >= 30 ? '#FFD700' : metrics.conversionRate >= 20 ? '#C0C0C0' : metrics.conversionRate >= 10 ? '#CD7F32' : currentColor,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Calificación Promedio</span>
                        <span className="font-medium dark:text-gray-200">{(metrics.avgRating || 0).toFixed(1)} ⭐</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${((metrics.avgRating || 0) / 5) * 100}%`,
                            backgroundColor: metrics.avgRating >= 4.8 ? '#FFD700' : metrics.avgRating >= 4.5 ? '#C0C0C0' : '#CD7F32',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold dark:text-gray-100">{metrics.totalClients || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Clientes</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold dark:text-gray-100">{metrics.totalEnquiries || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Consultas</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold dark:text-gray-100">{metrics.leadsConverted || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Conversiones</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold capitalize dark:text-gray-100">{metrics.seniority || 'Junior'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Nivel</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No hay métricas disponibles</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPanel;
