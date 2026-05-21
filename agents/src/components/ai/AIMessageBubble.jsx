import React from 'react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const AIMessageBubble = ({ message, isDark }) => {
  const isUser = message.role === 'user';

  const bubbleBase = {
    maxWidth:     '82%',
    padding:      '9px 13px',
    borderRadius: 12,
    fontSize:     13,
    lineHeight:   1.6,
    wordBreak:    'break-word',
  };

  const userBubble = {
    ...bubbleBase,
    background:              '#6b3de8',
    color:                   '#fff',
    alignSelf:               'flex-end',
    borderBottomRightRadius: 4,
  };

  const assistantBubble = {
    ...bubbleBase,
    background:             isDark ? '#1e2a3a' : '#f1f5f9',
    color:                   isDark ? '#e2e8f0' : '#1e293b',
    alignSelf:               'flex-start',
    borderBottomLeftRadius:  4,
    border:                  isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
  };

  const toolBubble = {
    ...bubbleBase,
    background: isDark ? '#1a2e1a' : '#f0fdf4',
    color:      isDark ? '#86efac' : '#166534',
    alignSelf:  'flex-start',
    border:     `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
    fontFamily: 'monospace',
    fontSize:   12,
  };

  const style = isUser ? userBubble : (message.role === 'tool' ? toolBubble : assistantBubble);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={style}>
        {message.role === 'tool' && (
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 3 }}>
            🔧 {message.toolCall?.toolName || 'tool'}
          </div>
        )}
        <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
      </div>
      <div style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2, paddingLeft: isUser ? 0 : 4 }}>
        {formatTime(message.createdAt)}
        {message.provider && !isUser && (
          <span style={{ marginLeft: 5, opacity: 0.7 }}>· {message.provider}</span>
        )}
      </div>
    </div>
  );
};

export default AIMessageBubble;
