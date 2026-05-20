import React from 'react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const AIMessageBubble = ({ message, currentMode }) => {
  const isUser      = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isDark      = currentMode === 'Dark';

  const bubbleBase = {
    maxWidth:     '80%',
    padding:      '10px 14px',
    borderRadius: 12,
    fontSize:     14,
    lineHeight:   1.6,
    wordBreak:    'break-word',
  };

  const userBubble = {
    ...bubbleBase,
    background: '#4F46E5',
    color:       '#fff',
    alignSelf:   'flex-end',
    borderBottomRightRadius: 4,
  };

  const assistantBubble = {
    ...bubbleBase,
    background:  isDark ? '#1e2a3a' : '#f1f5f9',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    alignSelf:    'flex-start',
    borderBottomLeftRadius: 4,
    border:       isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
  };

  const toolBubble = {
    ...bubbleBase,
    background:  isDark ? '#1a2e1a' : '#f0fdf4',
    color:        isDark ? '#86efac' : '#166534',
    alignSelf:    'flex-start',
    border:       `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
    fontFamily:   'monospace',
    fontSize:     13,
  };

  const rowStyle = {
    display:        'flex',
    flexDirection:  'column',
    marginBottom:   8,
    alignItems:     isUser ? 'flex-end' : 'flex-start',
  };

  const metaStyle = {
    fontSize:    11,
    color:       isDark ? '#64748b' : '#94a3b8',
    marginTop:   3,
    paddingLeft: isUser ? 0 : 4,
  };

  let style = isUser ? userBubble : (message.role === 'tool' ? toolBubble : assistantBubble);

  return (
    <div style={rowStyle}>
      <div style={style}>
        {message.role === 'tool' && (
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
            🔧 Tool: {message.toolCall?.toolName || 'unknown'}
          </div>
        )}
        <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
      </div>
      <div style={metaStyle}>
        {formatTime(message.createdAt)}
        {message.provider && isAssistant && (
          <span style={{ marginLeft: 6, opacity: 0.7 }}>· {message.provider}</span>
        )}
        {message.tokensUsed > 0 && (
          <span style={{ marginLeft: 6, opacity: 0.7 }}>· {message.tokensUsed}t</span>
        )}
      </div>
    </div>
  );
};

export default AIMessageBubble;
