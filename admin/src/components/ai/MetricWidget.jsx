import React from 'react';

const MetricWidget = ({ label, value, suffix = '', trend, description, currentMode }) => {
  const isDark = currentMode === 'Dark';

  const cardStyle = {
    background:   isDark ? '#1e293b' : '#fff',
    border:       isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
    borderRadius: 12,
    padding:      '16px 20px',
    flex:         1,
    minWidth:     120,
  };

  const labelStyle = {
    fontSize:    12,
    color:       isDark ? '#94a3b8' : '#64748b',
    fontWeight:  600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
  };

  const valueStyle = {
    fontSize:   26,
    fontWeight: 800,
    color:      isDark ? '#f1f5f9' : '#0f172a',
    lineHeight: 1,
  };

  const suffixStyle = {
    fontSize:   14,
    fontWeight: 600,
    marginLeft: 3,
    color:      isDark ? '#94a3b8' : '#64748b',
  };

  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#64748b';
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {value !== null && value !== undefined ? value : '—'}
        {suffix && <span style={suffixStyle}>{suffix}</span>}
      </div>
      {(trend !== undefined || description) && (
        <div style={{ marginTop: 6, fontSize: 12, color: trend !== undefined ? trendColor : (isDark ? '#64748b' : '#94a3b8') }}>
          {trend !== undefined && <span>{trendArrow} {Math.abs(trend)}%</span>}
          {description && <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{description}</span>}
        </div>
      )}
    </div>
  );
};

export default MetricWidget;
