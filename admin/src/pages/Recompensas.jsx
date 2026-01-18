import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaStar, FaMedal, FaAward, FaSync, FaUser, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const Recompensas = () => {
  const { currentColor } = useStateContext();
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
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <Header category="Gestión" title="Recompensas de Agentes" />
        <button
          onClick={loadSummary}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: currentColor }}
        >
          <FaSync className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Estrellas</p>
              <p className="text-3xl font-bold">{totalStats.stars}</p>
            </div>
            <FaStar className="text-4xl opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Medallas</p>
              <p className="text-3xl font-bold">{totalStats.medals}</p>
            </div>
            <FaMedal className="text-4xl opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Badges</p>
              <p className="text-3xl font-bold">{totalStats.badges}</p>
            </div>
            <FaAward className="text-4xl opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Logros</p>
              <p className="text-3xl font-bold">{totalStats.totalRewards}</p>
            </div>
            <FaTrophy className="text-4xl opacity-50" />
          </div>
        </div>
      </div>

      {/* Agents Ranking */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
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
              <div key={agent.agente._id} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden">
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
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
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
