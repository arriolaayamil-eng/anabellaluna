import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaStar, FaMedal, FaAward, FaSync, FaUser, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const Recompensas = () => {
  const { currentColor, currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [agentDetails, setAgentDetails] = useState({});

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.rewards.getSummary();
      setSummary(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading rewards summary:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const toggleAgent = async (agenteId) => {
    if (expandedAgent === agenteId) {
      setExpandedAgent(null);
      return;
    }
    setExpandedAgent(agenteId);
    if (!agentDetails[agenteId]) {
      try {
        const details = await crmService.rewards.getAgentRewards(agenteId);
        setAgentDetails(prev => ({ ...prev, [agenteId]: details }));
      } catch (e) {
        console.error('Error loading agent details:', e);
      }
    }
  };

  const getSeniorityColor = (seniority) => {
    switch (seniority) {
      case 'senior': return '#15803D';
      case 'semi-senior': return '#22C55E';
      default: return '#84CC16';
    }
  };

  const getSeniorityIcon = (seniority) => {
    switch (seniority) {
      case 'senior': return '🌳';
      case 'semi-senior': return '🌿';
      default: return '🌱';
    }
  };

  const totalStats = summary.reduce((acc, agent) => ({
    stars: acc.stars + (agent.stars || 0),
    medals: acc.medals + (agent.medals || 0),
    badges: acc.badges + (agent.badges || 0),
    totalRewards: acc.totalRewards + (agent.totalRewards || 0),
  }), { stars: 0, medals: 0, badges: 0, totalRewards: 0 });

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaTrophy className="text-amber-500" /> Recompensas de Agentes
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gamificación y logros del equipo</p>
        </div>
        <button
          onClick={loadSummary}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          style={{ backgroundColor: currentColor }}
        >
          <FaSync className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Estrellas', value: totalStats.stars, icon: FaStar, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { title: 'Total Medallas', value: totalStats.medals, icon: FaMedal, color: '#d97706', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { title: 'Total Badges', value: totalStats.badges, icon: FaAward, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { title: 'Total Logros', value: totalStats.totalRewards, icon: FaTrophy, color: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100'}`}
              style={{ borderLeft: `4px solid ${kpi.color}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon className="text-lg" style={{ color: kpi.color }} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{kpi.title}</p>
            </div>
          );
        })}
      </div>

      {/* Agents Ranking */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
          <FaTrophy style={{ color: currentColor }} /> Ranking de Agentes
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentColor }}></div>
          </div>
        ) : summary.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FaTrophy className="text-5xl mx-auto mb-3 opacity-30" />
            <p>No hay datos de recompensas todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.map((agent, index) => (
              <div key={agent.agente._id} className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => toggleAgent(agent.agente._id)}
                >
                  {/* Ranking */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                    {agent.agente.avatar ? (
                      <img src={agent.agente.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FaUser className="text-gray-400 text-xl" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold dark:text-gray-100 truncate">{agent.agente.nombre}</h4>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full text-white capitalize"
                        style={{ backgroundColor: getSeniorityColor(agent.seniority) }}
                      >
                        {getSeniorityIcon(agent.seniority)} {agent.seniority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {agent.clientCount} clientes
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <FaStar /> <span className="font-semibold">{agent.stars}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-amber-500">
                        <FaMedal /> <span className="font-semibold">{agent.medals}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-blue-500">
                        <FaAward /> <span className="font-semibold">{agent.badges}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1" style={{ color: currentColor }}>
                        <FaTrophy /> <span className="font-bold">{agent.totalRewards}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="text-gray-400">
                    {expandedAgent === agent.agente._id ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAgent === agent.agente._id && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800">
                    <h5 className="font-medium text-sm mb-3 dark:text-gray-200">Recompensas Recientes</h5>
                    {agent.recentRewards && agent.recentRewards.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {agent.recentRewards.map((reward) => (
                          <div
                            key={reward._id}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg"
                          >
                            <span className="text-xl">{reward.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium dark:text-gray-100 truncate">{reward.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(reward.createdAt).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sin recompensas recientes</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`mt-6 p-4 rounded-2xl border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
        <h4 className="font-medium text-sm mb-3 dark:text-gray-200">Leyenda de Recompensas</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium dark:text-gray-100 mb-1">⭐ Estrellas</p>
            <p className="text-gray-500 dark:text-gray-400">5+ logins/semana</p>
          </div>
          <div>
            <p className="font-medium dark:text-gray-100 mb-1">🥇🥈🥉 Medallas Conversión</p>
            <p className="text-gray-500 dark:text-gray-400">10%/20%/30% leads convertidos</p>
          </div>
          <div>
            <p className="font-medium dark:text-gray-100 mb-1">🥇🥈🥉 Medallas Satisfacción</p>
            <p className="text-gray-500 dark:text-gray-400">4.0-4.4 / 4.5-4.7 / 4.8+ estrellas</p>
          </div>
          <div>
            <p className="font-medium dark:text-gray-100 mb-1">📊⚡ Badges</p>
            <p className="text-gray-500 dark:text-gray-400">90% datos / Respuesta &lt;24h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recompensas;
