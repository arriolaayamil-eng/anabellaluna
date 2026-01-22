import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaComments, FaPaperPlane, FaSearch, FaSync, FaUsers, FaBroadcastTower, FaCheck, FaCheckDouble, FaCircle, FaUserTie, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import chatService from '../services/chatService';

const Mensajeria = () => {
  const { currentColor, currentMode } = useStateContext();
  const [agents, setAgents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState({ total: 0, byConversation: [] });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [view, setView] = useState('conversations'); // 'conversations' | 'agents'
  const messagesContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const wasAtBottomRef = useRef(true);


  const loadAgents = useCallback(async () => {
    try {
      const data = await chatService.getAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await chatService.getUnreadCount();
      setUnreadCount(data || { total: 0, byConversation: [] });
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  const loadMessages = useCallback(async (partnerId, forceUpdate = false) => {
    try {
      const data = await chatService.getHistory(partnerId, { limit: 100 });
      const newMessageCount = Array.isArray(data) ? data.length : 0;
      const hasNewMessages = newMessageCount > previousMessageCountRef.current;
      
      // Only update if there are new messages or it's a forced update
      if (hasNewMessages || forceUpdate || previousMessageCountRef.current === 0) {
        setMessages(Array.isArray(data) ? data : []);
        previousMessageCountRef.current = newMessageCount;
        
        // If there are new messages, scroll to bottom and mark as read
        if (hasNewMessages) {
          setTimeout(() => {
            const container = messagesContainerRef.current;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }, 50);
          
          // Mark new messages as read
          chatService.markAsRead(partnerId).catch(err => {
            console.error('Error marking messages as read:', err);
          });
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAgents(), loadConversations(), loadUnreadCount()]);
    setLoading(false);
  }, [loadAgents, loadConversations, loadUnreadCount]);

  useEffect(() => {
    loadData();
    
    // Poll for new messages - 500ms for near real-time, agent status every 10 seconds
    pollIntervalRef.current = setInterval(() => {
      if (selectedChat) {
        loadMessages(selectedChat._id);
      }
    }, 500);
    
    // Separate interval for agent status and conversations
    const statusIntervalRef = setInterval(() => {
      loadAgents();
      loadConversations();
      loadUnreadCount();
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      clearInterval(statusIntervalRef);
    };
  }, [loadData, loadAgents, loadConversations, loadUnreadCount, loadMessages, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      previousMessageCountRef.current = 0;
      wasAtBottomRef.current = true;
      loadMessages(selectedChat._id, true);
      
      // Mark messages as read when selecting conversation
      chatService.markAsRead(selectedChat._id).catch(err => {
        console.error('Error marking messages as read:', err);
      });
    }
  }, [selectedChat, loadMessages]);

  const handleSelectAgent = (agent) => {
    setSelectedChat(agent);
    setView('conversations');
  };

  const handleSelectConversation = (conv) => {
    setSelectedChat(conv.partner);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      await chatService.send(selectedChat._id, newMessage.trim());
      setNewMessage('');
      
      // Update message count after sending
      previousMessageCountRef.current += 1;
      
      // Scroll to bottom within container
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
      
      // Force refresh to get the sent message
      await loadMessages(selectedChat._id, true);
      await loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || sendingBroadcast) return;

    setSendingBroadcast(true);
    try {
      const result = await chatService.broadcast(broadcastMessage.trim());
      alert(`Mensaje enviado a ${result.sentTo} agentes`);
      setBroadcastMessage('');
      setShowBroadcastModal(false);
      await loadConversations();
    } catch (err) {
      console.error('Error sending broadcast:', err);
      alert('Error al enviar el mensaje');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const filteredAgents = agents.filter(agent => 
    agent.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.partner?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.partner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardBase = `rounded-xl shadow-md ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'}`;

  return (
    <div className="m-2 md:m-6 mt-24 p-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-3">
            <FaComments style={{ color: currentColor }} />
            Mensajería Interna
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Comunicación directa con los agentes del CRM
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: currentColor }}
          >
            <FaBroadcastTower /> Enviar a Todos
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all hover:shadow-md"
            style={{ borderColor: currentColor, color: currentColor }}
          >
            <FaSync className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBase} p-4 flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <FaUsers className="text-2xl text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{agents.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Agentes</p>
          </div>
        </div>
        <div className={`${cardBase} p-4 flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <FaComments className="text-2xl text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{conversations.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Conversaciones</p>
          </div>
        </div>
        <div className={`${cardBase} p-4 flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
            <FaCircle className="text-2xl text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{agents.filter(a => a.online).length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">En Línea</p>
          </div>
        </div>
        <div className={`${cardBase} p-4 flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
            <FaComments className="text-2xl text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{unreadCount.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin Leer</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${cardBase} overflow-hidden`} style={{ height: 'calc(100vh - 380px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Sidebar - Conversations/Agents List */}
          <div className={`w-full md:w-80 border-r ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col ${selectedChat && 'hidden md:flex'}`}>
            {/* Tabs */}
            <div className={`flex border-b ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setView('conversations')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  view === 'conversations' 
                    ? 'border-b-2 text-current' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                style={view === 'conversations' ? { borderColor: currentColor, color: currentColor } : {}}
              >
                Conversaciones
              </button>
              <button
                onClick={() => setView('agents')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  view === 'agents' 
                    ? 'border-b-2 text-current' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                style={view === 'agents' ? { borderColor: currentColor, color: currentColor } : {}}
              >
                Agentes ({agents.length})
              </button>
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    currentMode === 'Dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500' 
                      : 'bg-gray-50 border-gray-200 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSync className="animate-spin text-2xl text-gray-400" />
                </div>
              ) : view === 'conversations' ? (
                filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay conversaciones</p>
                    <p className="text-xs mt-1">Selecciona un agente para iniciar</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.partner._id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 cursor-pointer transition-colors border-b ${
                        currentMode === 'Dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                      } ${selectedChat?._id === conv.partner._id ? (currentMode === 'Dark' ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {conv.partner.nombre?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          {conv.partner.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm dark:text-white truncate">{conv.partner.nombre}</h4>
                            <span className="text-xs text-gray-500">{formatTime(conv.lastMessage?.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage?.content || 'Sin mensajes'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )
              ) : (
                filteredAgents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaUserTie className="text-4xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron agentes</p>
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
                    <div
                      key={agent._id}
                      onClick={() => handleSelectAgent(agent)}
                      className={`p-4 cursor-pointer transition-colors border-b ${
                        currentMode === 'Dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                      } ${selectedChat?._id === agent._id ? (currentMode === 'Dark' ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                            {agent.nombre?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          {agent.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm dark:text-white truncate">{agent.nombre}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{agent.cargo || 'Agente'}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          agent.online 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {agent.online ? 'En línea' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedChat && 'hidden md:flex'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className={`p-4 border-b ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-3`}>
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <FaChevronLeft className="text-gray-500" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedChat.nombre?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    {selectedChat.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold dark:text-white">{selectedChat.nombre}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedChat.online ? 'En línea' : selectedChat.lastSeen ? `Último acceso: ${formatTime(selectedChat.lastSeen)}` : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay mensajes</p>
                      <p className="text-xs mt-1">Envía el primer mensaje</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderType === 'erp' || msg.senderId?._id !== selectedChat._id;
                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isMe
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm'
                                  : currentMode === 'Dark'
                                    ? 'bg-gray-700 text-gray-200 rounded-bl-sm'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isMe ? 'justify-end' : ''}`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMe && (
                                msg.read ? <FaCheckDouble className="text-blue-500" /> : <FaCheck />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className={`p-4 border-t ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                        currentMode === 'Dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500'
                          : 'bg-gray-50 border-gray-200 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-3 rounded-xl text-white transition-all hover:shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: currentColor }}
                    >
                      <FaPaperPlane className={sendingMessage ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FaComments className="text-6xl mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">Selecciona una conversación</h3>
                  <p className="text-sm">Elige un agente de la lista para comenzar a chatear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBase} max-w-lg w-full p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <FaBroadcastTower style={{ color: currentColor }} />
                Mensaje para Todos los Agentes
              </h2>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Este mensaje será enviado a todos los agentes ({agents.length}) del sistema.
            </p>

            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={5}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 resize-none ${
                currentMode === 'Dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500'
                  : 'bg-gray-50 border-gray-200 focus:ring-blue-500'
              }`}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 py-3 rounded-xl border-2 font-medium transition-all hover:shadow-md"
                style={{ borderColor: currentColor, color: currentColor }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastMessage.trim() || sendingBroadcast}
                className="flex-1 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: currentColor }}
              >
                {sendingBroadcast ? (
                  <>
                    <FaSync className="animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Enviar a Todos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mensajeria;
