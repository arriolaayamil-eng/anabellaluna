import { useState, useCallback, useEffect, useRef } from 'react';
import aiService     from '../services/aiService';
import socketService from '../services/socketService';

const CACHE_LIMIT = 120;

function cacheKey(conversationId) {
  return `ai-chat:${conversationId}:messages`;
}

function readCachedMessages(conversationId) {
  if (!conversationId || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(cacheKey(conversationId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedMessages(conversationId, messages) {
  if (!conversationId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(cacheKey(conversationId), JSON.stringify((messages || []).slice(-CACHE_LIMIT)));
  } catch {
    // localStorage can be full or disabled.
  }
}

function mergeMessages(messages) {
  const byId = new Map();
  (messages || []).forEach((message) => {
    if (!message || (!message._id && !message.content)) return;
    const key = String(message._id || `${message.role}:${message.createdAt}:${message.content}`);
    byId.set(key, message);
  });
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function newClientMessageId() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useAIChat(conversationId) {
  const [messages, setMessages] = useState(() => readCachedMessages(conversationId));
  const [hydrating, setHydrating] = useState(Boolean(conversationId && readCachedMessages(conversationId).length === 0));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [pendingTool, setPendingTool] = useState(null);

  const convIdRef = useRef(conversationId);
  convIdRef.current = conversationId;
  const sendingRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!conversationId) {
      setMessages([]);
      setHydrating(false);
      return () => { active = false; };
    }

    const cached = readCachedMessages(conversationId);
    setMessages(cached);
    setHydrating(cached.length === 0);
    setError(null);

    aiService.getMessages(conversationId)
      .then((msgs) => {
        if (!active) return;
        const nextMessages = mergeMessages(msgs || []);
        setMessages(nextMessages);
        writeCachedMessages(conversationId, nextMessages);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setHydrating(false); });
    return () => { active = false; };
  }, [conversationId]);

  useEffect(() => {
    socketService.connect();

    const handleApproval = (data) => {
      if (data.conversationId === convIdRef.current) setPendingTool(data);
    };
    const handleCompleted = (data) => {
      if (data.success) setPendingTool(null);
    };

    socketService.on('ai:approval_required',   handleApproval);
    socketService.on('ai:execution_completed', handleCompleted);
    return () => {
      socketService.off('ai:approval_required',   handleApproval);
      socketService.off('ai:execution_completed', handleCompleted);
    };
  }, []);

  useEffect(() => {
    writeCachedMessages(conversationId, messages);
  }, [conversationId, messages]);

  const sendMessage = useCallback(async (text) => {
    const cleanText = String(text || '').trim();
    if (!cleanText || !convIdRef.current || sendingRef.current) return null;
    setError(null);
    sendingRef.current = true;
    setSending(true);

    const clientMessageId = newClientMessageId();
    const optimisticId = `pending-${clientMessageId}`;
    const optimisticMessage = {
      _id: optimisticId,
      role: 'user',
      content: cleanText,
      createdAt: new Date().toISOString(),
      metadata: { clientMessageId, pending: true },
    };
    setMessages((prev) => mergeMessages([...prev, optimisticMessage]));

    try {
      const result = await aiService.sendMessage(convIdRef.current, cleanText, clientMessageId);
      if (!result || !result.assistantMessageId) {
        throw new Error('No se pudo confirmar la respuesta en el servidor.');
      }

      const confirmedAssistant = result.content ? {
        _id: result.assistantMessageId,
        role: 'assistant',
        content: result.content,
        createdAt: new Date().toISOString(),
        provider: result.provider || '',
        tokensUsed: result.usage?.total_tokens || 0,
      } : null;

      setMessages((prev) => {
        const withoutPending = prev.filter((m) => m._id !== optimisticId);
        return mergeMessages([
          ...withoutPending,
          { ...optimisticMessage, _id: result.userMessageId || optimisticId, metadata: { clientMessageId, confirmed: true } },
          ...(confirmedAssistant ? [confirmedAssistant] : []),
        ]);
      });

      const fresh = await aiService.getMessages(convIdRef.current);
      setMessages(mergeMessages(fresh || []));
      return result;
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.map((m) => (
        m._id === optimisticId
          ? { ...m, metadata: { ...(m.metadata || {}), pending: false, failed: true } }
          : m
      )));
      return null;
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, []);

  const approveTool = useCallback(async (executionId) => {
    try {
      await aiService.approveTool(executionId);
      setPendingTool(null);
      const fresh = await aiService.getMessages(convIdRef.current);
      setMessages(mergeMessages(fresh || []));
    } catch (err) { setError(err.message); }
  }, []);

  const rejectTool = useCallback(async (executionId, reason) => {
    try {
      await aiService.rejectTool(executionId, reason);
      setPendingTool(null);
    } catch (err) { setError(err.message); }
  }, []);

  return { messages, loading: sending, sending, hydrating, error, pendingTool, sendMessage, approveTool, rejectTool };
}

export default useAIChat;
