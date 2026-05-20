import { useState, useCallback, useEffect, useRef } from 'react';
import aiService from '../services/aiService';
import socketService from '../services/socketService';

export function useAIChat(conversationId) {
  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [pendingTool, setPendingTool] = useState(null);

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Cargar historial al montar
  useEffect(() => {
    if (!conversationId) return;
    aiService.getMessages(conversationId)
      .then((msgs) => setMessages(msgs || []))
      .catch((err) => setError(err.message));
  }, [conversationId]);

  // Suscribir a eventos Socket.IO
  useEffect(() => {
    socketService.connect();

    const handleApprovalRequired = (data) => {
      if (data.conversationId === conversationIdRef.current) {
        setPendingTool(data);
      }
    };

    const handleExecutionCompleted = (data) => {
      if (data.success) setPendingTool(null);
    };

    socketService.on('ai:approval_required',   handleApprovalRequired);
    socketService.on('ai:execution_completed', handleExecutionCompleted);

    return () => {
      socketService.off('ai:approval_required',   handleApprovalRequired);
      socketService.off('ai:execution_completed', handleExecutionCompleted);
    };
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !conversationIdRef.current || loading) return;

    setError(null);
    setLoading(true);

    // Optimistic user message
    const optimisticId = `opt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { _id: optimisticId, role: 'user', content: text, createdAt: new Date().toISOString() },
    ]);

    try {
      const result = await aiService.sendMessage(conversationIdRef.current, text);

      // Recargar mensajes reales desde servidor
      const fresh = await aiService.getMessages(conversationIdRef.current);
      setMessages(fresh || []);

      return result;
    } catch (err) {
      setError(err.message);
      // Remover mensaje optimista
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const approveTool = useCallback(async (executionId) => {
    try {
      await aiService.approveTool(executionId);
      setPendingTool(null);
      const fresh = await aiService.getMessages(conversationIdRef.current);
      setMessages(fresh || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const rejectTool = useCallback(async (executionId, reason) => {
    try {
      await aiService.rejectTool(executionId, reason);
      setPendingTool(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { messages, loading, error, pendingTool, sendMessage, approveTool, rejectTool };
}

export default useAIChat;
