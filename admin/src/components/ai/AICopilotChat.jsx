import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import AIMessageBubble from './AIMessageBubble';
import AIToolApproval from './AIToolApproval';
import useAIChat from '../../hooks/useAIChat';

const AICopilotChat = ({ conversationId, currentMode }) => {
  const { messages, loading, hydrating, error, pendingTool, sendMessage, approveTool, rejectTool } =
    useAIChat(conversationId);

  const [input, setInput] = useState('');
  const [approving, setApproving] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const nearBottomRef = useRef(true);
  const isDark = currentMode === 'Dark';

  const draftKey = `ai-chat:${conversationId}:draft`;
  const scrollKey = `ai-chat:${conversationId}:scroll`;

  useEffect(() => {
    try {
      setInput(localStorage.getItem(draftKey) || '');
    } catch {
      setInput('');
    }
  }, [draftKey]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, input);
    } catch {
      // keep typing even when storage is unavailable
    }
  }, [draftKey, input]);

  useLayoutEffect(() => {
    setViewportReady(false);
  }, [conversationId]);

  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (!el || hydrating) return;

    const saved = Number(localStorage.getItem(scrollKey));
    const nextTop = Number.isFinite(saved) && saved > 0
      ? Math.min(saved, el.scrollHeight)
      : el.scrollHeight;

    el.scrollTop = nextTop;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setViewportReady(true);
  }, [hydrating, messages.length, scrollKey]);

  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (!el || !viewportReady || hydrating) return;
    if (nearBottomRef.current || loading) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, loading, viewportReady, hydrating]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    try {
      localStorage.setItem(scrollKey, String(el.scrollTop));
    } catch {
      // ignore
    }
  };

  const handleSend = async (e) => {
    e && e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    nearBottomRef.current = true;
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
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 500,
    background: isDark ? '#0f172a' : '#f8fafc',
    borderRadius: 16,
    overflow: 'hidden',
    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb',
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    opacity: viewportReady || hydrating ? 1 : 0,
    transition: 'opacity 0.12s ease',
  };

  const inputAreaStyle = {
    padding: '12px 16px',
    borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb',
    background: isDark ? '#111827' : '#fff',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
  };

  const textareaStyle = {
    flex: 1,
    background: isDark ? '#0f172a' : '#f9fafb',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
    borderRadius: 18,
    padding: '10px 14px',
    fontSize: 14,
    color: isDark ? '#e2e8f0' : '#1e293b',
    resize: 'none',
    minHeight: 44,
    maxHeight: 140,
    outline: 'none',
    lineHeight: 1.5,
    fontFamily: 'inherit',
    overflow: 'auto',
  };

  const sendBtnStyle = {
    width: 44,
    height: 44,
    borderRadius: 18,
    border: 'none',
    background: loading || !input.trim() ? (isDark ? '#374151' : '#e5e7eb') : '#2563eb',
    color: loading || !input.trim() ? (isDark ? '#9ca3af' : '#94a3b8') : '#fff',
    fontWeight: 700,
    fontSize: 16,
    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
    transition: 'background 0.16s, transform 0.16s',
  };

  const emptyStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: isDark ? '#6b7280' : '#94a3b8',
    textAlign: 'center',
    padding: 32,
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
        <div ref={messagesRef} style={messagesStyle} onScroll={handleMessagesScroll}>
          {hydrating && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  style={{
                    width: item === 1 ? '62%' : '78%',
                    height: item === 1 ? 34 : 48,
                    borderRadius: 18,
                    background: isDark ? '#1f2937' : '#e5e7eb',
                    opacity: 0.7,
                    alignSelf: item === 1 ? 'flex-end' : 'flex-start',
                  }}
                />
              ))}
            </div>
          )}

          {messages.length === 0 && !loading && !hydrating && (
            <div style={emptyStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                Asistente listo
              </div>
              <div style={{ fontSize: 13 }}>
                Escribí como si hablaras con una persona del equipo.
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
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 5, padding: '10px 13px' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isDark ? '#60a5fa' : '#93c5fd',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: isDark ? '#2d1a1a' : '#fef2f2',
              border: '1px solid #fca5a5',
              color: isDark ? '#fca5a5' : '#dc2626',
              fontSize: 13,
              alignSelf: 'flex-start',
              maxWidth: '80%',
            }}
            >
              {error}
            </div>
          )}
        </div>

        <div style={inputAreaStyle}>
          <textarea
            ref={inputRef}
            style={textareaStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensaje"
            rows={1}
            disabled={loading}
          />
          <button
            type="button"
            style={sendBtnStyle}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            title="Enviar"
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
};

export default AICopilotChat;
