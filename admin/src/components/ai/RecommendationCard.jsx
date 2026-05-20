import React, { useState } from 'react';

const PRIORITY_COLORS = {
  critical: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', dark_bg: '#2d1a1a', dark_text: '#fca5a5' },
  high:     { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', dark_bg: '#2d1f0e', dark_text: '#fdba74' },
  medium:   { bg: '#fefce8', border: '#fde047', text: '#ca8a04', dark_bg: '#2d2a0e', dark_text: '#fde047' },
  low:      { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', dark_bg: '#0e2d1a', dark_text: '#86efac' },
};

const TYPE_ICONS = {
  budget_optimization: '💰',
  audience_targeting:  '🎯',
  creative_refresh:    '🎨',
  bid_strategy:        '📈',
  campaign_pause:      '⏸️',
  anomaly_alert:       '⚠️',
  general:             '💡',
};

const RecommendationCard = ({ rec, onAccept, onReject, loading, currentMode }) => {
  const [expanded, setExpanded] = useState(false);
  const isDark = currentMode === 'Dark';
  const pc     = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium;
  const icon   = TYPE_ICONS[rec.type] || '💡';

  const cardStyle = {
    background:   isDark ? pc.dark_bg : pc.bg,
    border:       `1px solid ${pc.border}`,
    borderRadius: 10,
    padding:      '14px 16px',
    marginBottom: 10,
  };

  const headerStyle = {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        10,
    cursor:     'pointer',
  };

  const titleStyle = {
    fontSize:   14,
    fontWeight: 600,
    color:      isDark ? pc.dark_text : pc.text,
    flex:       1,
  };

  const actionsStyle = {
    marginTop:    10,
    paddingLeft:  28,
  };

  const actionItemStyle = {
    fontSize:    13,
    color:       isDark ? '#cbd5e1' : '#475569',
    marginBottom: 3,
  };

  const btnGroup = {
    display:   'flex',
    gap:       8,
    marginTop: 12,
    paddingLeft: 28,
  };

  const btnBase = {
    padding:      '5px 14px',
    borderRadius: 6,
    border:       'none',
    fontSize:     12,
    fontWeight:   600,
    cursor:       loading ? 'not-allowed' : 'pointer',
    opacity:      loading ? 0.7 : 1,
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={() => setExpanded((v) => !v)}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>{rec.title}</div>
          <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>
            {rec.type.replace(/_/g, ' ')} · {rec.priority}
          </div>
        </div>
        <span style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <>
          <div style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#475569', marginTop: 8, paddingLeft: 28, lineHeight: 1.6 }}>
            {rec.body}
          </div>

          {rec.actions && rec.actions.length > 0 && (
            <div style={actionsStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                Acciones sugeridas:
              </div>
              {rec.actions.map((a, i) => (
                <div key={i} style={actionItemStyle}>• {a}</div>
              ))}
            </div>
          )}

          {rec.status === 'pending' && (
            <div style={btnGroup}>
              <button
                style={{ ...btnBase, background: '#4F46E5', color: '#fff' }}
                onClick={() => onAccept(rec._id)}
                disabled={loading}
              >
                Aceptar
              </button>
              <button
                style={{ ...btnBase, background: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#374151' }}
                onClick={() => onReject(rec._id)}
                disabled={loading}
              >
                Descartar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationCard;
