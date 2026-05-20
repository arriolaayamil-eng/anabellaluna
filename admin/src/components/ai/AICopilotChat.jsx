import React, { useRef, useEffect, useState } from 'react';
import AIMessageBubble from './AIMessageBubble';
import AIToolApproval  from './AIToolApproval';
import useAIChat       from '../../hooks/useAIChat';

const AICopilotChat = ({ conversationId, currentMode }) => {
  const { messages, loading, error, pendingTool, sendMessage, approveTool, rejectTool } =
    useAIChat(conversationId);

  const [input,       setInput]       = useState('');
  const [approving,   setApproving]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const isDark    = currentMode === 'Dark';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e && e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApprove = async (executionId) => {
    setApproving(true);
    await approveTool(executionId);
    setApproving(false);
  };

  const handleReject = async (executionId, reason) => {
    setApproving(true);
    await rejectTool(executionId, reason);
    setApproving(false);
  };

  const containerStyle = {
    display:       'flex',
    flexDirection: 'column',
    height:        '100%',
    minHeight:     500,
    background:    isDark ? '#0f172a' : '#f8fafc',
    borderRadius:  12,
    overflow:      'hidden',
  };

  const messagesStyle = {
    flex:      1,
    overflowY: 'auto',
    padding:   '20px 16px',
    display:   'flex',
    flexDirection: 'column',
    gap:       4,
  };

  const inputAreaStyle = {
    padding:    '12px 16px',
    borderTop:  isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
    background: isDark ? '#1e293b' : '#fff',
    display:    'flex',
    gap:        10,
    alignItems: 'flex-end',
  };

  const textareaStyle = {
    flex:         1,
    background:   isDark ? '#0f172a' : '#f1f5f9',
    border:       `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
    borderRadius: 10,
    padding:      '10px 14px',
    fontSize:     14,
    color:        isDark ? '#e2e8f0' : '#1e293b',
    resize:       'none',
    minHeight:    44,
    maxHeight:    120,
    outline:      'none',
    lineHeight:   1.5,
    fontFamily:   'inherit',
  };

  const sendBtnStyle = {
    padding:      '10px 18px',
    borderRadius: 10,
    border:       'none',
    background:   loading ? '#818cf8' : '#4F46E5',
    color:        '#fff',
    fontWeight:   600,
    fontSize:     14,
    cursor:       loading || !input.trim() ? 'not-allowed' : 'pointer',
    opacity:      (!input.trim() && !loading) ? 0.5 : 1,
    transition:   'background 0.2s',
    height:       44,
  };

  const emptyStyle = {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    color:          isDark ? '#475569' : '#94a3b8',
    textAlign:      'center',
    padding:        32,
  };

  return (
    <>
      {pendingTool && (
        <AIToolApproval
          pendingTool={pendingTool}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={approving}
          currentMode={currentMode}
        />
      )}

      <div style={containerStyle}>
        <div style={messagesStyle}>
          {messages.length === 0 && !loading && (
            <div style={emptyStyle}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                AI Marketing Copilot
              </div>
              <div style={{ fontSize: 13 }}>
                Preguntame sobre tus campañas, métricas, ROAS, presupuestos o estrategias.
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <AIMessageBubble
              key={msg._id}
              message={msg}
              currentMode={currentMode}
            />
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}>
              <div style={{
                display: 'flex', gap: 4,
              }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: isDark ? '#6366f1' : '#818cf8',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8' }}>
                AI pensando...
              </span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, background: isDark ? '#2d1a1a' : '#fef2f2',
              border: '1px solid #fca5a5', color: isDark ? '#fca5a5' : '#dc2626', fontSize: 13,
              alignSelf: 'flex-start', maxWidth: '80%',
            }}>
              Error: {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={inputAreaStyle}>
          <textarea
            ref={inputRef}
            style={textareaStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            disabled={loading}
          />
          <button
            style={sendBtnStyle}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? '⏳' : '→'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
};

export default AICopilotChat;
