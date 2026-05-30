import React from 'react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const AIMessageBubble = ({ message, currentMode }) => {
  const isUser = message.role === 'user';
  const isDark = currentMode === 'Dark';
  const failed = Boolean(message.metadata?.failed);
  const pending = Boolean(message.metadata?.pending);

  if (!message.content && message.role !== 'tool') return null;

  const bubbleBase = {
    maxWidth: '78%',
    padding: '10px 13px',
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: 'break-word',
    boxShadow: isDark ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
  };

  const userBubble = {
    ...bubbleBase,
    background: failed ? '#ef4444' : '#2563eb',
    color: '#fff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
    opacity: pending ? 0.72 : 1,
  };

  const assistantBubble = {
    ...bubbleBase,
    background: isDark ? '#1f2937' : '#fff',
    color: isDark ? '#e2e8f0' : '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
  };

  const toolBubble = {
    ...bubbleBase,
    background: isDark ? '#17251a' : '#f0fdf4',
    color: isDark ? '#86efac' : '#166534',
    alignSelf: 'flex-start',
    border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
    fontSize: 12,
  };

  const style = isUser ? userBubble : (message.role === 'tool' ? toolBubble : assistantBubble);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={style}>
        {message.role === 'tool' && (
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
            {message.toolCall?.toolName || 'tool'}
          </div>
        )}
        <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
      </div>
      <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 3, paddingLeft: isUser ? 0 : 4 }}>
        {formatTime(message.createdAt)}
        {pending && <span style={{ marginLeft: 6 }}>enviando</span>}
        {failed && <span style={{ marginLeft: 6 }}>no enviado</span>}
      </div>
    </div>
  );
};

export default AIMessageBubble;
