import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import AIMessageBubble from './AIMessageBubble';
import { useAIChat }   from '../../hooks/useAIChat';
import { useStateContext } from '../../contexts/ContextProvider';
import aiService from '../../services/aiService';
import orbSvg from '../../assets/ai_orb.svg';

// ── Orb button ────────────────────────────────────────────────────────────────

const OrbButton = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    title="Asistente AI"
    style={{
      position:   'fixed',
      bottom:     24,
      right:      24,
      width:      64,
      height:     64,
      borderRadius: '50%',
      border:     'none',
      padding:    0,
      cursor:     'pointer',
      background: 'transparent',
      zIndex:     9999,
      boxShadow:  isOpen
        ? '0 0 0 3px #9b6dff, 0 8px 32px rgba(107,61,232,0.55)'
        : '0 4px 24px rgba(107,61,232,0.45)',
      transition: 'box-shadow 0.3s, transform 0.2s',
      transform:  isOpen ? 'scale(1.08)' : 'scale(1)',
      outline:    'none',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = isOpen ? 'scale(1.08)' : 'scale(1)'; }}
  >
    <img src={orbSvg} alt="AI" style={{ width: 64, height: 64, display: 'block', borderRadius: '50%' }} draggable={false} />
  </button>
);

// ── Floating chat panel ───────────────────────────────────────────────────────

const FloatingChat = ({ conversationId, onClose, isDark }) => {
  const { messages, loading, hydrating, error, sendMessage } = useAIChat(conversationId);

  const [input,   setInput]   = useState('');
  const [viewportReady, setViewportReady] = useState(false);
  const messagesRef = useRef(null);
  const inputRef  = useRef(null);
  const nearBottomRef = useRef(true);
  const draftKey = `ai-orb:${conversationId}:draft`;
  const scrollKey = `ai-orb:${conversationId}:scroll`;

  useEffect(() => {
    try { setInput(localStorage.getItem(draftKey) || ''); } catch { setInput(''); }
  }, [draftKey]);

  useEffect(() => {
    try { localStorage.setItem(draftKey, input); } catch { /* ignore */ }
  }, [draftKey, input]);

  useLayoutEffect(() => { setViewportReady(false); }, [conversationId]);

  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (!el || hydrating) return;
    const saved = Number(localStorage.getItem(scrollKey));
    el.scrollTop = Number.isFinite(saved) && saved > 0 ? Math.min(saved, el.scrollHeight) : el.scrollHeight;
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
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [input]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    try { localStorage.setItem(scrollKey, String(el.scrollTop)); } catch { /* ignore */ }
  };

  const handleSend = useCallback(async (e) => {
    e && e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    nearBottomRef.current = true;
    await sendMessage(text);
    inputRef.current?.focus();
  }, [input, loading, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const bg     = isDark ? '#0f172a' : '#fff';
  const border = isDark ? 'rgba(155,109,255,0.25)' : 'rgba(107,61,232,0.18)';

  return (
    <div style={{
      position:      'fixed',
      bottom:        100,
      right:         24,
      width:         360,
      maxWidth:      'calc(100vw - 32px)',
      height:        500,
      maxHeight:     'calc(100vh - 120px)',
      zIndex:        9998,
      display:       'flex',
      flexDirection: 'column',
      borderRadius:  18,
      overflow:      'hidden',
      background:    bg,
      border:        `1px solid ${border}`,
      boxShadow:     '0 24px 64px rgba(107,61,232,0.22), 0 4px 16px rgba(0,0,0,0.18)',
      animation:     'orbSlideIn 0.22s cubic-bezier(.34,1.56,.64,1)',
    }}>

      {/* Header */}
      <div style={{
        padding:    '13px 16px',
        background: isDark
          ? 'linear-gradient(135deg, #1e1040 0%, #2d1b6e 100%)'
          : 'linear-gradient(135deg, #6b3de8 0%, #9b6dff 100%)',
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        flexShrink: 0,
      }}>
        <img src={orbSvg} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Asistente AI</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 }}>
            {loading ? 'Escribiendo...' : 'Online'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* Messages */}
      <div style={{
        flex:          1,
        overflowY:     'auto',
        padding:       '14px 12px',
        display:       'flex',
        flexDirection: 'column',
        gap:           2,
        opacity:        viewportReady || hydrating ? 1 : 0,
        transition:     'opacity 0.12s ease',
      }}
      ref={messagesRef}
      onScroll={handleMessagesScroll}
      >
        {hydrating && messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                style={{
                  width: item === 1 ? '58%' : '76%',
                  height: item === 1 ? 30 : 42,
                  borderRadius: 16,
                  background: isDark ? '#1f2937' : '#e5e7eb',
                  opacity: 0.72,
                  alignSelf: item === 1 ? 'flex-end' : 'flex-start',
                }}
              />
            ))}
          </div>
        )}

        {messages.length === 0 && !loading && !hydrating && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#475569' : '#94a3b8',
            textAlign: 'center', padding: '20px 14px', gap: 10,
          }}>
            <img src={orbSvg} alt="" style={{ width: 48, height: 48, opacity: 0.8 }} />
            <div style={{ fontWeight: 600, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
              ¿En qué te ayudo?
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, maxWidth: 240 }}>
              Podés pedirme agendar citas, consultar clientes, revisar operaciones o pedir análisis.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 6 }}>
              {['Agendar cita', 'Ver mis clientes', 'Operaciones del mes', 'Campañas activas'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    padding: '4px 9px', borderRadius: 20,
                    border: `1px solid ${isDark ? 'rgba(155,109,255,0.3)' : 'rgba(107,61,232,0.2)'}`,
                    background: isDark ? 'rgba(155,109,255,0.08)' : 'rgba(107,61,232,0.05)',
                    color: isDark ? '#c084fc' : '#6b3de8',
                    fontSize: 11, cursor: 'pointer', fontWeight: 500,
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <AIMessageBubble key={msg._id} message={msg} isDark={isDark} />
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 5, padding: '8px 10px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#9b6dff',
                animation: 'orbBounce 1.2s infinite', animationDelay: `${i * 0.18}s`,
                display: 'inline-block',
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{
            padding: '7px 11px', borderRadius: 8,
            background: isDark ? '#2d1a1a' : '#fef2f2',
            border: '1px solid #fca5a5',
            color: isDark ? '#fca5a5' : '#dc2626',
            fontSize: 11, alignSelf: 'flex-start', maxWidth: '85%',
          }}>{error}</div>
        )}

      </div>

      {/* Input */}
      <div style={{
        padding: '9px 10px',
        borderTop: `1px solid ${border}`,
        background: isDark ? '#1e293b' : '#f8fafc',
        display: 'flex', gap: 7, alignItems: 'flex-end', flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje"
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: isDark ? '#0f172a' : '#fff',
            border: `1px solid ${isDark ? 'rgba(155,109,255,0.2)' : '#e2e8f0'}`,
            borderRadius: 18, padding: '8px 11px', fontSize: 12,
            color: isDark ? '#e2e8f0' : '#1e293b',
            resize: 'none', minHeight: 36, maxHeight: 90,
            outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: loading || !input.trim()
              ? (isDark ? '#334155' : '#e2e8f0')
              : 'linear-gradient(135deg, #6b3de8, #9b6dff)',
            color: loading || !input.trim() ? (isDark ? '#64748b' : '#94a3b8') : '#fff',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s',
          }}
        >{loading ? '...' : '↑'}</button>
      </div>
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────

const AIFloatingOrb = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';

  const [isOpen,         setIsOpen]         = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingConv,    setLoadingConv]    = useState(false);
  const contextKey = 'agent_assistant';

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    setLoadingConv(true);
    try {
      const existing = await aiService.getConversations({ context: contextKey });
      const conv = existing?.[0] || await aiService.createConversation({
        context: contextKey,
        title: 'Asistente AI',
        contextType: 'general',
      });
      const id   = conv._id || conv.id;
      setConversationId(id);
      return id;
    } catch (err) {
      console.error('[AIOrb] Failed to create conversation:', err.message);
      return null;
    } finally {
      setLoadingConv(false);
    }
  }, [conversationId, contextKey]);

  const handleToggle = async () => {
    if (!isOpen) await ensureConversation();
    setIsOpen((v) => !v);
  };

  return (
    <>
      <style>{`
        @keyframes orbSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes orbBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>

      <OrbButton onClick={handleToggle} isOpen={isOpen} />

      {isOpen && conversationId && !loadingConv && (
        <FloatingChat conversationId={conversationId} onClose={() => setIsOpen(false)} isDark={isDark} />
      )}

      {isOpen && loadingConv && (
        <div style={{
          position: 'fixed', bottom: 100, right: 24,
          padding: '14px 20px', borderRadius: 12,
          background: isDark ? '#1e293b' : '#fff',
          boxShadow: '0 8px 32px rgba(107,61,232,0.2)',
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 12, zIndex: 9998,
        }}>
          Iniciando conversación...
        </div>
      )}
    </>
  );
};

export default AIFloatingOrb;
