import React, { useState, useEffect, useRef } from 'react';
import aiService     from '../services/aiService';
import socketService from '../services/socketService';
import useAIChat     from '../hooks/useAIChat';

// ── Minimal inline components (no extra Syncfusion deps) ─────────────────────

const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{
        maxWidth:     '78%',
        padding:      '9px 13px',
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background:   isUser ? '#4F46E5' : '#f1f5f9',
        color:        isUser ? '#fff' : '#1e293b',
        fontSize:     13,
        lineHeight:   1.55,
        whiteSpace:   'pre-wrap',
        wordBreak:    'break-word',
      }}>
        {msg.role === 'tool' && <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>🔧 {msg.toolCall?.toolName}</div>}
        {msg.content}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, paddingLeft: isUser ? 0 : 3 }}>
        {new Date(msg.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        {msg.provider && !isUser && <span style={{ marginLeft: 5 }}>· {msg.provider}</span>}
      </div>
    </div>
  );
};

const ApprovalModal = ({ tool, onApprove, onReject, loading }) => {
  const [reason, setReason] = useState('');
  if (!tool) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚠️ Aprobación requerida</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          El AI solicita ejecutar: <b>{tool.toolName}</b>
        </div>
        <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: 12, fontFamily: 'monospace', color: '#166534', overflowX: 'auto', maxHeight: 180, marginBottom: 12 }}>
          {JSON.stringify(tool.toolInput, null, 2)}
        </pre>
        <textarea
          style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: '7px 10px', fontSize: 12, resize: 'vertical', minHeight: 50, boxSizing: 'border-box', marginBottom: 12 }}
          placeholder="Motivo de rechazo (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => onReject(tool.executionId, reason)} disabled={loading} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#e2e8f0', color: '#374151', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Rechazar
          </button>
          <button onClick={() => onApprove(tool.executionId)} disabled={loading} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            {loading ? '...' : 'Aprobar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const MarketingAI = () => {
  const [conversations,   setConversations]   = useState([]);
  const [conversationId,  setConversationId]  = useState(null);
  const [input,           setInput]           = useState('');
  const [overview,        setOverview]        = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [tab,             setTab]             = useState('chat');
  const [approving,       setApproving]       = useState(false);

  const { messages, loading, error, pendingTool, sendMessage, approveTool, rejectTool } =
    useAIChat(conversationId);

  const bottomRef = useRef(null);

  useEffect(() => {
    socketService.connect();
    aiService.getConversations()
      .then((convs) => {
        setConversations(convs || []);
        if (convs && convs.length > 0) setConversationId(convs[0]._id);
      })
      .catch(() => {});
    aiService.getOverviewMetrics(30)
      .then(setOverview)
      .catch(() => {});
    aiService.getRecommendations('pending', 10)
      .then((r) => setRecommendations(r || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewConv = async () => {
    const conv = await aiService.createConversation({ title: 'Nueva conversación' });
    setConversations((prev) => [conv, ...prev]);
    setConversationId(conv._id);
    setTab('chat');
  };

  const handleApprove = async (execId) => {
    setApproving(true);
    await approveTool(execId);
    setApproving(false);
  };
  const handleReject = async (execId, reason) => {
    setApproving(true);
    await rejectTool(execId, reason);
    setApproving(false);
  };

  const s = {
    page:    { padding: '20px 16px', maxWidth: 900, margin: '0 auto', fontFamily: 'inherit' },
    heading: { fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 },
    sub:     { fontSize: 12, color: '#94a3b8', marginBottom: 18 },
    tabs:    { display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 9, padding: 3, marginBottom: 18, width: 'fit-content' },
    tab: (active) => ({
      padding: '6px 16px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: active ? 700 : 500,
      background: active ? '#fff' : 'transparent',
      color: active ? '#4F46E5' : '#64748b',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      cursor: 'pointer',
    }),
    kpiRow: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
    kpi: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 100 },
    kpiLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 },
    kpiValue: { fontSize: 20, fontWeight: 800, color: '#0f172a' },
    layout: { display: 'flex', gap: 12, height: 520 },
    sidebar: { width: 180, flexShrink: 0 },
    sideBtn: { width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px dashed #818cf8', background: 'transparent', color: '#4F46E5', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginBottom: 8 },
    convItem: (active) => ({
      padding: '7px 9px', borderRadius: 7, cursor: 'pointer', marginBottom: 2, fontSize: 12,
      background: active ? 'rgba(79,70,229,0.1)' : 'transparent',
      borderLeft: active ? '3px solid #4F46E5' : '3px solid transparent',
      fontWeight: active ? 700 : 400, color: active ? '#4F46E5' : '#374151',
      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
    }),
    chatBox: {
      flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc',
      borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0',
    },
    msgs: { flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column' },
    inputRow: { display: 'flex', gap: 8, padding: '10px 12px', background: '#fff', borderTop: '1px solid #e2e8f0', alignItems: 'flex-end' },
    textarea: { flex: 1, border: '1px solid #e2e8f0', borderRadius: 9, padding: '8px 12px', fontSize: 13, resize: 'none', fontFamily: 'inherit', minHeight: 38, maxHeight: 100, outline: 'none', background: '#f8fafc' },
    sendBtn: { padding: '8px 16px', borderRadius: 9, border: 'none', background: loading ? '#818cf8' : '#4F46E5', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', height: 38 },
    recCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 8 },
  };

  return (
    <div style={s.page}>
      <ApprovalModal tool={pendingTool} onApprove={handleApprove} onReject={handleReject} loading={approving} />

      <div style={s.heading}>🤖 AI Marketing Copilot</div>
      <div style={s.sub}>Analizá tus campañas y optimizá con inteligencia artificial</div>

      {/* KPIs */}
      {overview && (
        <div style={s.kpiRow}>
          <div style={s.kpi}><div style={s.kpiLabel}>Gasto</div><div style={s.kpiValue}>${(overview.totalSpend || 0).toLocaleString('es-AR')}</div></div>
          <div style={s.kpi}><div style={s.kpiLabel}>CTR</div><div style={s.kpiValue}>{(overview.avgCTR || 0).toFixed(2)}%</div></div>
          <div style={s.kpi}><div style={s.kpiLabel}>Leads</div><div style={s.kpiValue}>{overview.totalLeads || 0}</div></div>
          <div style={s.kpi}><div style={s.kpiLabel}>CPL</div><div style={s.kpiValue}>${(overview.cpl || 0).toLocaleString('es-AR')}</div></div>
          <div style={s.kpi}><div style={s.kpiLabel}>ROAS</div><div style={s.kpiValue}>{(overview.avgROAS || 0).toFixed(2)}x</div></div>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {[['chat', '💬 Copilot'], ['recommendations', '💡 Sugerencias']].map(([key, label]) => (
          <button key={key} style={s.tab(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && (
        <div style={s.layout}>
          <div style={s.sidebar}>
            <button style={s.sideBtn} onClick={handleNewConv}>+ Nueva</button>
            {conversations.map((c) => (
              <div key={c._id} style={s.convItem(c._id === conversationId)} onClick={() => setConversationId(c._id)}>
                {c.title}
              </div>
            ))}
          </div>
          <div style={s.chatBox}>
            <div style={s.msgs}>
              {messages.length === 0 && !loading && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
                  <div style={{ fontWeight: 600 }}>AI Marketing Copilot</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Consultá métricas, campañas o pedí recomendaciones</div>
                </div>
              )}
              {messages.map((m) => <Bubble key={m._id} msg={m} />)}
              {loading && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '6px 10px' }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                  ))}
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>pensando...</span>
                </div>
              )}
              {error && <div style={{ fontSize: 12, color: '#ef4444', padding: '6px 10px' }}>Error: {error}</div>}
              <div ref={bottomRef} />
            </div>
            <div style={s.inputRow}>
              <textarea
                style={s.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu consulta (Enter envía)"
                disabled={loading || !conversationId}
                rows={1}
              />
              <button style={s.sendBtn} onClick={handleSend} disabled={loading || !input.trim() || !conversationId}>
                {loading ? '⏳' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {tab === 'recommendations' && (
        <div>
          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              No hay recomendaciones pendientes.
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec._id} style={s.recCard}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {rec.type === 'anomaly_alert' ? '⚠️' : '💡'} {rec.title}
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>{rec.body}</div>
                {rec.actions && rec.actions.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#64748b' }}>
                    {rec.actions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
                {rec.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => aiService.resolveRecommendation(rec._id, { status: 'accepted' }).then(() => setRecommendations((r) => r.filter((x) => x._id !== rec._id)))} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Aceptar</button>
                    <button onClick={() => aiService.resolveRecommendation(rec._id, { status: 'rejected' }).then(() => setRecommendations((r) => r.filter((x) => x._id !== rec._id)))} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e2e8f0', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Descartar</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default MarketingAI;
