import React, { useState, useEffect, useCallback } from 'react';
import { FaComments, FaPaperPlane, FaCircle, FaSearch, FaSync, FaHome, FaEnvelope, FaPhone, FaCalendarAlt, FaUsers, FaGlobe } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const ChatInterno = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();
  const [mensajeNuevo, setMensajeNuevo] = useState('');
  const [chatActivo, setChatActivo] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [agentChats, setAgentChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'agents', 'web'
  const [chatMessages, setChatMessages] = useState([]);

  const formatTimeLabel = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} días`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      // Load both enquiries and agent conversations in parallel
      const [items, agentConversations] = await Promise.all([
        crmService.activities.getAll(),
        crmService.chat.getConversations().catch(() => []),
      ]);

      // Process website enquiries
      const enquiries = (Array.isArray(items) ? items : [])
        .filter((item) => item.type === 'enquiry' || item.type === 'visit_scheduled')
        .map((item) => {
          const meta = item.metadata || {};
          const contact = meta.contact || {};
          const property = meta.property || {};
          const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();

          return {
            id: item._id,
            nombre: contact.fullName || 'Sin nombre',
            email: contact.email || '',
            phone: contact.phone || '',
            avatar: item.type === 'visit_scheduled' ? '📅' : '💬',
            ultimoMensaje: item.notes || (item.type === 'visit_scheduled' ? 'Solicitud de visita' : 'Solicitud de información'),
            hora: formatTimeLabel(createdAt),
            noLeidos: item.metadata?.read ? 0 : 1,
            online: false,
            rol: item.type === 'visit_scheduled' ? 'Visita Programada' : 'Consulta Web',
            tipo: item.type,
            source: 'web',
            propiedad: property.title || '',
            propiedadSlug: property.slug || '',
            createdAt,
            raw: item,
          };
        });

      // Process agent conversations
      const agentChatsData = (Array.isArray(agentConversations) ? agentConversations : [])
        .map((conv) => {
          const partner = conv.partner || {};
          const lastMsg = conv.lastMessage || {};
          const createdAt = lastMsg.createdAt ? new Date(lastMsg.createdAt) : new Date();

          return {
            id: partner._id || conv._id,
            nombre: partner.nombre || partner.username || 'Agente',
            email: partner.email || '',
            phone: '',
            avatar: partner.avatar || '👤',
            ultimoMensaje: lastMsg.content || 'Sin mensajes',
            hora: formatTimeLabel(createdAt),
            noLeidos: conv.unreadCount || 0,
            online: partner.online || false,
            rol: partner.role === 'admin' ? 'Administrador' : 'Agente',
            tipo: 'agent_chat',
            source: 'agent',
            propiedad: '',
            propiedadSlug: '',
            createdAt,
            partnerId: partner._id,
            raw: conv,
          };
        });

      setConversaciones(enquiries.sort((a, b) => b.createdAt - a.createdAt));
      setAgentChats(agentChatsData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Combine and filter based on active tab
  const getDisplayedConversations = () => {
    let items = [];
    if (activeTab === 'all') {
      items = [...conversaciones, ...agentChats];
    } else if (activeTab === 'agents') {
      items = agentChats;
    } else {
      items = conversaciones;
    }

    // Sort by date
    items.sort((a, b) => b.createdAt - a.createdAt);

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter((conv) => conv.nombre.toLowerCase().includes(term)
        || conv.email.toLowerCase().includes(term)
        || (conv.propiedad && conv.propiedad.toLowerCase().includes(term))
        || conv.ultimoMensaje.toLowerCase().includes(term));
    }

    return items;
  };

  const filteredConversaciones = getDisplayedConversations();
  const totalNoLeidos = conversaciones.reduce((sum, conv) => sum + conv.noLeidos, 0);
  const totalAgentNoLeidos = agentChats.reduce((sum, conv) => sum + conv.noLeidos, 0);
  const totalAllNoLeidos = totalNoLeidos + totalAgentNoLeidos;

  const loadChatHistory = async (partnerId) => {
    try {
      const messages = await crmService.chat.getHistory(partnerId, { limit: 50 });
      setChatMessages(Array.isArray(messages) ? messages.reverse() : []);
    } catch (e) {
      console.error('Error loading chat history:', e);
      setChatMessages([]);
    }
  };

  const handleEnviarMensaje = async () => {
    if (mensajeNuevo.trim() && chatActivo) {
      if (chatActivo.source === 'agent' && chatActivo.partnerId) {
        try {
          await crmService.chat.send(chatActivo.partnerId, mensajeNuevo.trim());
          setMensajeNuevo('');
          // Reload chat history
          loadChatHistory(chatActivo.partnerId);
        } catch (e) {
          console.error('Error sending message:', e);
        }
      } else {
        // For web enquiries, just clear - would need note saving logic
        setMensajeNuevo('');
      }
    }
  };

  const markAsRead = async (conv) => {
    try {
      if (conv.source === 'agent' && conv.partnerId) {
        // Mark agent messages as read
        await crmService.chat.markAsRead(conv.partnerId);
        setAgentChats((prev) => prev.map((c) => (c.id === conv.id ? { ...c, noLeidos: 0 } : c)));
      } else if (conv.source === 'web' && conv.raw) {
        // Mark web enquiry as read
        const updatedMeta = { ...(conv.raw.metadata || {}), read: true };
        await crmService.activities.update(conv.id, { metadata: updatedMeta });
        setConversaciones((prev) => prev.map((c) => (c.id === conv.id ? { ...c, noLeidos: 0 } : c)));
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const handleOpenChat = async (conv) => {
    setChatActivo(conv);
    if (conv.noLeidos > 0) {
      markAsRead(conv);
    }
    // Load chat history for agent conversations
    if (conv.source === 'agent' && conv.partnerId) {
      loadChatHistory(conv.partnerId);
    } else {
      setChatMessages([]);
    }
  };

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] rounded-lg w-[420px] shadow-xl z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-600">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaComments className="text-2xl" style={{ color: currentColor }} />
            {totalAllNoLeidos > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalAllNoLeidos > 9 ? '9+' : totalAllNoLeidos}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-gray-200">Mensajes</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {agentChats.length} chats · {conversaciones.length} consultas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadMessages}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Actualizar"
          >
            <FaSync className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-600">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'all'
              ? 'border-b-2 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          style={activeTab === 'all' ? { borderColor: currentColor, color: currentColor } : {}}
        >
          Todos
          {totalAllNoLeidos > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {totalAllNoLeidos}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'agents'
              ? 'border-b-2 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          style={activeTab === 'agents' ? { borderColor: currentColor, color: currentColor } : {}}
        >
          <FaUsers className="text-xs" /> Agentes
          {totalAgentNoLeidos > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {totalAgentNoLeidos}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('web')}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'web'
              ? 'border-b-2 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
          style={activeTab === 'web' ? { borderColor: currentColor, color: currentColor } : {}}
        >
          <FaGlobe className="text-xs" /> Web
          {totalNoLeidos > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {totalNoLeidos}
            </span>
          )}
        </button>
      </div>

      {/* Buscador */}
      <div className="p-3 border-b dark:border-gray-600">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Lista de Conversaciones */}
      {!chatActivo ? (
        <div className="max-h-80 overflow-y-auto">
          {loading && filteredConversaciones.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FaSync className="animate-spin text-2xl mx-auto mb-2" />
              <p className="text-sm">Cargando mensajes...</p>
            </div>
          )}
          {!loading && filteredConversaciones.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FaComments className="text-4xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {activeTab === 'agents' ? 'No hay conversaciones con agentes'
                  : activeTab === 'web' ? 'No hay consultas del sitio web'
                    : 'No hay mensajes'}
              </p>
              <p className="text-xs mt-1">
                {activeTab === 'agents' ? 'Inicia una conversación desde el chat interno'
                  : activeTab === 'web' ? 'Las consultas del sitio web aparecerán aquí'
                    : 'Los mensajes aparecerán aquí'}
              </p>
            </div>
          )}
          {filteredConversaciones.map((conv) => (
            <div
              key={`${conv.source}-${conv.id}`}
              onClick={() => handleOpenChat(conv)}
              className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                conv.noLeidos > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  {conv.source === 'agent' ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {conv.nombre.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="text-3xl w-10 h-10 flex items-center justify-center">{conv.avatar}</div>
                  )}
                  {conv.source === 'agent' && conv.online && (
                    <FaCircle className="absolute bottom-0 right-0 text-green-500 text-xs" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm dark:text-gray-200 truncate">
                      {conv.nombre}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {conv.hora}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1 flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      conv.source === 'agent'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : conv.tipo === 'visit_scheduled'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                    >
                      {conv.source === 'agent' ? (conv.online ? '● En línea' : conv.rol) : conv.rol}
                    </span>
                  </p>
                  {conv.propiedad && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mb-1">
                      <FaHome className="flex-shrink-0" /> {conv.propiedad}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                      {conv.ultimoMensaje}
                    </p>
                    {conv.noLeidos > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
                        {conv.noLeidos}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista de Detalle - Agent Chat o Web Enquiry */
        <div className="flex flex-col h-[450px]">
          {/* Header del Chat */}
          <div className="p-3 border-b dark:border-gray-600 flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setChatActivo(null); setChatMessages([]); }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-lg"
            >
              ←
            </button>
            {chatActivo.source === 'agent' ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {chatActivo.nombre.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="text-2xl">{chatActivo.avatar}</div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-sm dark:text-gray-200">{chatActivo.nombre}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {chatActivo.source === 'agent' && chatActivo.online && (
                  <FaCircle className="text-green-500 text-[8px]" />
                )}
                {chatActivo.rol}
              </p>
            </div>
          </div>

          {/* Content Area */}
          {chatActivo.source === 'agent' ? (
            /* Agent Chat Messages */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <FaComments className="text-3xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay mensajes aún</p>
                    <p className="text-xs">Envía un mensaje para iniciar la conversación</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isOwn = msg.senderId !== chatActivo.partnerId;
                    return (
                      <div key={msg._id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                          isOwn
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                        }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                            {msg.createdAt ? formatTimeLabel(new Date(msg.createdAt)) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mensajeNuevo}
                    onChange={(e) => setMensajeNuevo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleEnviarMensaje}
                    className="p-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: currentColor }}
                    title="Enviar mensaje"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Web Enquiry Detail */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                {/* Info de Contacto */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <h5 className="font-semibold text-sm dark:text-gray-200 mb-3">Información de Contacto</h5>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="font-medium">👤</span> {chatActivo.nombre}
                    </p>
                    {chatActivo.email && (
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <FaEnvelope className="text-gray-400" />
                        <a href={`mailto:${chatActivo.email}`} className="text-blue-500 hover:underline">{chatActivo.email}</a>
                      </p>
                    )}
                    {chatActivo.phone && (
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <FaPhone className="text-gray-400" />
                        <a href={`tel:${chatActivo.phone}`} className="text-blue-500 hover:underline">{chatActivo.phone}</a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Info de Propiedad */}
                {chatActivo.propiedad && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                    <h5 className="font-semibold text-sm dark:text-gray-200 mb-2">Propiedad de Interés</h5>
                    <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                      <FaHome className="text-gray-400" /> {chatActivo.propiedad}
                    </p>
                  </div>
                )}

                {/* Mensaje */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <h5 className="font-semibold text-sm dark:text-gray-200 mb-2">Mensaje</h5>
                  <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {chatActivo.ultimoMensaje || 'Sin mensaje adicional'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <FaCalendarAlt /> {chatActivo.createdAt.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Acciones Rápidas */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <h5 className="font-semibold text-sm dark:text-gray-200 mb-3">Acciones Rápidas</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {chatActivo.email && (
                      <a
                        href={`mailto:${chatActivo.email}?subject=Re: Consulta sobre ${chatActivo.propiedad || 'propiedad'}`}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        <FaEnvelope /> Responder Email
                      </a>
                    )}
                    {chatActivo.phone && (
                      <a
                        href={`https://wa.me/${chatActivo.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        <FaPhone /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Notas internas */}
              <div className="p-3 border-t dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mensajeNuevo}
                    onChange={(e) => setMensajeNuevo(e.target.value)}
                    placeholder="Agregar nota interna..."
                    className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleEnviarMensaje}
                    className="p-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: currentColor }}
                    title="Guardar nota"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      {!chatActivo && (
        <div className="p-3 border-t dark:border-gray-600 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/crm/chat"
              className="py-2 px-3 rounded-lg font-medium transition-colors text-sm text-center border flex items-center justify-center gap-1"
              style={{ borderColor: currentColor, color: currentColor }}
            >
              <FaUsers className="text-xs" /> Chat Interno
            </a>
            <a
              href="/crm/consultas"
              className="py-2 px-3 rounded-lg font-medium transition-colors text-sm text-center border flex items-center justify-center gap-1"
              style={{ borderColor: currentColor, color: currentColor }}
            >
              <FaGlobe className="text-xs" /> Consultas Web
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterno;
