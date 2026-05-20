import React, { useState } from 'react';

const TOOL_LABELS = {
  update_campaign_budget: 'Modificar presupuesto de campaña',
  pause_campaign:         'Pausar campaña',
  resume_campaign:        'Reactivar campaña',
  generate_recommendation: 'Generar recomendación',
};

const TOOL_ICONS = {
  update_campaign_budget: '💰',
  pause_campaign:         '⏸️',
  resume_campaign:        '▶️',
  generate_recommendation: '💡',
};

const AIToolApproval = ({ pendingTool, onApprove, onReject, loading, currentMode }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const isDark = currentMode === 'Dark';

  if (!pendingTool) return null;

  const label = TOOL_LABELS[pendingTool.toolName] || pendingTool.toolName;
  const icon  = TOOL_ICONS[pendingTool.toolName]  || '🔧';

  const overlayStyle = {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.5)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         9999,
  };

  const modalStyle = {
    background:   isDark ? '#1e293b' : '#fff',
    border:       isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
    borderRadius: 16,
    padding:      28,
    maxWidth:     500,
    width:        '90%',
    boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
  };

  const headerStyle = {
    display:      'flex',
    alignItems:   'center',
    gap:          12,
    marginBottom: 16,
  };

  const titleStyle = {
    fontSize:   16,
    fontWeight: 700,
    color:      isDark ? '#f1f5f9' : '#1e293b',
  };

  const subtitleStyle = {
    fontSize: 13,
    color:    isDark ? '#94a3b8' : '#64748b',
    margin:   0,
  };

  const inputJsonStyle = {
    background:   isDark ? '#0f172a' : '#f8fafc',
    border:       `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
    borderRadius: 8,
    padding:      10,
    fontFamily:   'monospace',
    fontSize:     12,
    color:        isDark ? '#86efac' : '#166534',
    whiteSpace:   'pre-wrap',
    wordBreak:    'break-all',
    marginBottom: 16,
    maxHeight:    200,
    overflowY:    'auto',
  };

  const textareaStyle = {
    width:        '100%',
    padding:      '8px 10px',
    borderRadius: 8,
    border:       `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     13,
    marginBottom: 16,
    resize:       'vertical',
    minHeight:    60,
    boxSizing:    'border-box',
  };

  const btnGroup = {
    display: 'flex', gap: 10, justifyContent: 'flex-end',
  };

  const btnBase = {
    padding:      '8px 20px',
    borderRadius: 8,
    border:       'none',
    fontWeight:   600,
    fontSize:     13,
    cursor:       loading ? 'not-allowed' : 'pointer',
    opacity:      loading ? 0.7 : 1,
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: 32 }}>{icon}</span>
          <div>
            <div style={titleStyle}>Aprobación requerida</div>
            <p style={subtitleStyle}>{label}</p>
          </div>
        </div>

        <div style={{ marginBottom: 8, fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
          Parámetros de la acción:
        </div>
        <div style={inputJsonStyle}>
          {JSON.stringify(pendingTool.toolInput, null, 2)}
        </div>

        <div style={{ marginBottom: 8, fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
          Motivo de rechazo (opcional):
        </div>
        <textarea
          style={textareaStyle}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Ej: El presupuesto propuesto es muy alto para esta semana."
        />

        <div style={btnGroup}>
          <button
            style={{ ...btnBase, background: isDark ? '#2d3748' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#374151' }}
            onClick={() => onReject(pendingTool.executionId, rejectionReason)}
            disabled={loading}
          >
            Rechazar
          </button>
          <button
            style={{ ...btnBase, background: '#4F46E5', color: '#fff' }}
            onClick={() => onApprove(pendingTool.executionId)}
            disabled={loading}
          >
            {loading ? 'Ejecutando...' : 'Aprobar y Ejecutar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIToolApproval;
