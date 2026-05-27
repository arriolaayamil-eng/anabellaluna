import { useState, useCallback, useEffect, useRef } from 'react';
import aiService     from '../services/aiService';
import socketService from '../services/socketService';

export function useAIChat(conversationId) {
  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [pendingTool, setPendingTool] = useState(null);

  const convIdRef = useRef(conversationId);
  convIdRef.current = conversationId;

  useEffect(() => {
    let active = true;
    if (!conversationId) {
      setMessages([]);
      return () => { active = false; };
    }
    setError(null);
    aiService.getMessages(conversationId)
      .then((msgs) => { if (active) setMessages(msgs || []); })
      .catch((err) => { if (active) setError(err.message); });
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

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !convIdRef.current || loading) return;
    setError(null);
    setLoading(true);
    const optimisticId = `opt-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: optimisticId, role: 'user', content: text, createdAt: new Date().toISOString() }]);
    try {
      await aiService.sendMessage(convIdRef.current, text);
      const fresh = await aiService.getMessages(convIdRef.current);
      setMessages(fresh || []);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const approveTool = useCallback(async (executionId) => {
    try {
      await aiService.approveTool(executionId);
      setPendingTool(null);
      const fresh = await aiService.getMessages(convIdRef.current);
      setMessages(fresh || []);
    } catch (err) { setError(err.message); }
  }, []);

  const rejectTool = useCallback(async (executionId, reason) => {
    try {
      await aiService.rejectTool(executionId, reason);
      setPendingTool(null);
    } catch (err) { setError(err.message); }
  }, []);

  return { messages, loading, error, pendingTool, sendMessage, approveTool, rejectTool };
}

export default useAIChat;
