import React, { useState, useEffect } from 'react';
import { useStateContext } from '../contexts/ContextProvider';
import AICopilotChat      from '../components/ai/AICopilotChat';
import MetricWidget       from '../components/ai/MetricWidget';
import RecommendationCard from '../components/ai/RecommendationCard';
import aiService          from '../services/aiService';
import useMarketingMetrics from '../hooks/useMarketingMetrics';

const TABS = [
  { key: 'copilot',        label: '🤖 Copilot'        },
  { key: 'campaigns',      label: '📢 Campañas'        },
  { key: 'recommendations', label: '💡 Recomendaciones' },
];

const MarketingAI = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';

  const [activeTab,       setActiveTab]       = useState('copilot');
  const [conversationId,  setConversationId]  = useState(null);
  const [conversations,   setConversations]   = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading,      setRecLoading]      = useState(false);
  const [syncLoading,     setSyncLoading]     = useState(false);

  const { overview, campaigns, loading: metricsLoading, refresh: refreshMetrics } =
    useMarketingMetrics(30);

  useEffect(() => {
    aiService.getConversations()
      .then((convs) => {
        setConversations(convs || []);
        if (convs && convs.length > 0) setConversationId(convs[0]._id);
      })
      .catch(() => {});

    loadRecommendations();
  }, []);

  const loadRecommendations = () => {
    setRecLoading(true);
    aiService.getRecommendations('pending', 20)
      .then((recs) => setRecommendations(recs || []))
      .catch(() => {})
      .finally(() => setRecLoading(false));
  };

  const handleNewConversation = async () => {
    const conv = await aiService.createConversation({ title: 'Nueva conversación', contextType: 'marketing' });
    setConversations((prev) => [conv, ...prev]);
    setConversationId(conv._id);
  };

  const handleSyncCampaigns = async () => {
    setSyncLoading(true);
    await aiService.syncCampaigns().catch(() => {});
    await refreshMetrics();
    setSyncLoading(false);
  };

  const handleAcceptRec = async (id) => {
    await aiService.resolveRecommendation(id, { status: 'accepted' }).catch(() => {});
    loadRecommendations();
  };

  const handleRejectRec = async (id) => {
    await aiService.resolveRecommendation(id, { status: 'rejected' }).catch(() => {});
    loadRecommendations();
  };

  const pageStyle = {
    padding:    '24px 28px',
    background: isDark ? '#0f172a' : '#f8fafc',
    minHeight:  '100vh',
    color:      isDark ? '#e2e8f0' : '#1e293b',
  };

  const headingStyle = {
    fontSize:     22,
    fontWeight:   800,
    marginBottom: 4,
    color:        isDark ? '#f1f5f9' : '#0f172a',
  };

  const tabBarStyle = {
    display:      'flex',
    gap:          4,
    background:   isDark ? '#1e293b' : '#f1f5f9',
    borderRadius: 10,
    padding:      4,
    marginBottom: 24,
    width:        'fit-content',
  };

  const tabBtn = (key) => ({
    padding:      '7px 18px',
    borderRadius: 7,
    border:       'none',
    background:   activeTab === key ? (isDark ? '#4F46E5' : '#fff') : 'transparent',
    color:        activeTab === key ? (isDark ? '#fff' : '#4F46E5') : (isDark ? '#94a3b8' : '#64748b'),
    fontWeight:   activeTab === key ? 700 : 500,
    fontSize:     13,
    cursor:       'pointer',
    boxShadow:    activeTab === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
    transition:   'all 0.15s',
  });

  const metricsRow = {
    display:       'flex',
    flexWrap:      'wrap',
    gap:           12,
    marginBottom:  24,
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={headingStyle}>AI Marketing Operations</div>
          <div style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8' }}>
            Copilot de marketing con análisis de campañas y ejecución controlada
          </div>
        </div>
        <button
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 13, cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.7 : 1 }}
          onClick={handleSyncCampaigns}
          disabled={syncLoading}
        >
          {syncLoading ? 'Sincronizando...' : '🔄 Sync Campañas'}
        </button>
      </div>

      {/* KPI Row */}
      {overview && (
        <div style={metricsRow}>
          <MetricWidget label="Gasto Total"     value={`$${(overview.totalSpend || 0).toLocaleString('es-AR')}`} description="(30 días)" currentMode={currentMode} />
          <MetricWidget label="Impresiones"     value={(overview.totalImpressions || 0).toLocaleString('es-AR')} currentMode={currentMode} />
          <MetricWidget label="CTR Promedio"    value={`${(overview.avgCTR || 0).toFixed(2)}`} suffix="%" currentMode={currentMode} />
          <MetricWidget label="Leads"           value={overview.totalLeads   || 0} currentMode={currentMode} />
          <MetricWidget label="CPL"             value={`$${(overview.cpl || 0).toLocaleString('es-AR')}`} currentMode={currentMode} />
          <MetricWidget label="ROAS Prom"       value={`${(overview.avgROAS || 0).toFixed(2)}`} suffix="x" currentMode={currentMode} />
        </div>
      )}

      {/* Tab Bar */}
      <div style={tabBarStyle}>
        {TABS.map((t) => (
          <button key={t.key} style={tabBtn(t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Copilot Tab ── */}
      {activeTab === 'copilot' && (
        <div style={{ display: 'flex', gap: 16, height: 560 }}>
          {/* Sidebar conversaciones */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px dashed ${isDark ? '#4F46E5' : '#818cf8'}`, background: 'transparent', color: isDark ? '#818cf8' : '#4F46E5', fontWeight: 600, fontSize: 12, cursor: 'pointer', marginBottom: 4 }}
              onClick={handleNewConversation}
            >
              + Nueva conversación
            </button>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setConversationId(conv._id)}
                  style={{
                    padding:      '8px 10px',
                    borderRadius: 7,
                    cursor:       'pointer',
                    background:   conversationId === conv._id
                      ? (isDark ? 'rgba(79,70,229,0.25)' : 'rgba(79,70,229,0.1)')
                      : 'transparent',
                    color:        isDark ? '#e2e8f0' : '#374151',
                    fontSize:     13,
                    fontWeight:   conversationId === conv._id ? 600 : 400,
                    borderLeft:   conversationId === conv._id ? '3px solid #4F46E5' : '3px solid transparent',
                    marginBottom: 2,
                    overflow:     'hidden',
                    whiteSpace:   'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {conv.title}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {conversationId ? (
              <AICopilotChat conversationId={conversationId} currentMode={currentMode} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#475569' : '#94a3b8', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 36 }}>💬</div>
                <div>Seleccioná o creá una conversación</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Campaigns Tab ── */}
      {activeTab === 'campaigns' && (
        <div>
          {metricsLoading ? (
            <div style={{ color: isDark ? '#64748b' : '#94a3b8', padding: 20 }}>Cargando campañas...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: isDark ? '#475569' : '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📢</div>
              <div>No hay campañas sincronizadas. Hacé clic en "Sync Campañas".</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {campaigns.map((c) => (
                <div
                  key={c._id}
                  style={{
                    background:   isDark ? '#1e293b' : '#fff',
                    border:       isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding:      '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', flex: 1, marginRight: 8 }}>
                      {c.name}
                    </div>
                    <span style={{
                      padding:      '2px 8px',
                      borderRadius: 20,
                      fontSize:     11,
                      fontWeight:   600,
                      background:   c.status === 'active' ? '#dcfce7' : '#f1f5f9',
                      color:        c.status === 'active' ? '#16a34a' : '#64748b',
                    }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8' }}>
                    <div>🏷 {c.platform}</div>
                    {c.budget > 0 && <div>💰 ${c.budget?.toLocaleString('es-AR')} {c.budgetType === 'daily' ? '/día' : 'total'}</div>}
                    {c.externalId && <div style={{ opacity: 0.6, marginTop: 4 }}>ID: {c.externalId}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Recommendations Tab ── */}
      {activeTab === 'recommendations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }}>
              {recommendations.length} recomendación{recommendations.length !== 1 ? 'es' : ''} pendiente{recommendations.length !== 1 ? 's' : ''}
            </div>
            <button
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              onClick={loadRecommendations}
            >
              🔄 Actualizar
            </button>
          </div>

          {recLoading ? (
            <div style={{ color: isDark ? '#64748b' : '#94a3b8', padding: 16 }}>Cargando...</div>
          ) : recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: isDark ? '#475569' : '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div>No hay recomendaciones pendientes.</div>
            </div>
          ) : (
            recommendations.map((rec) => (
              <RecommendationCard
                key={rec._id}
                rec={rec}
                onAccept={handleAcceptRec}
                onReject={handleRejectRec}
                loading={recLoading}
                currentMode={currentMode}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MarketingAI;
