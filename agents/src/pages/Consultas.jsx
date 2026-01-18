import React, { useEffect, useMemo, useState, useRef } from 'react';
import { FaEnvelope, FaCalendarCheck, FaPhone, FaHome, FaSync, FaUser, FaClock, FaFilter, FaSearch, FaComments, FaPaperPlane, FaCircle, FaCheck, FaCheckDouble, FaUserCircle, FaBuilding } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const Consultas = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('consultas');
  
  // Property inquiries state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Chat state
  const [agents, setAgents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const wasAtBottomRef = useRef(true);
  
  // Get current agent ID from localStorage
  const currentAgentId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.agenteId || user._id || null;
    } catch {
      return null;
    }
  }, []);

  const normalized = useMemo(() => {
    return (Array.isArray(items) ? items : []).map((it) => {
      const md = it && it.metadata ? it.metadata : {};
      const contact = md.contact || {};
      const prop = md.property || {};
      return {
        id: it._id || it.id,
        createdAt: it.createdAt || it.updatedAt,
        type: it.type || '',
        notes: it.notes || '',
        contact: {
          fullName: contact.fullName || '',
          email: contact.email || '',
          phone: contact.phone || '',
        },
        property: {
          title: prop.title || '',
          slug: prop.slug || '',
          id: prop.id || it.propertyId || '',
        },
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = normalized;
    if (filter === 'enquiry') result = result.filter(r => r.type === 'enquiry');
    if (filter === 'visit') result = result.filter(r => r.type === 'visit_scheduled');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.contact.fullName.toLowerCase().includes(term) ||
        r.contact.email.toLowerCase().includes(term) ||
        r.property.title.toLowerCase().includes(term) ||
        r.notes.toLowerCase().includes(term)
      );
    }
    return result;
  }, [normalized, filter, searchTerm]);

  const stats = useMemo(() => ({
    total: normalized.length,
    enquiries: normalized.filter(r => r.type === 'enquiry').length,
    visits: normalized.filter(r => r.type === 'visit_scheduled').length,
  }), [normalized]);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const enquiries = await crmService.activities.getAll({ type: 'enquiry' });
      const visits = await crmService.activities.getAll({ type: 'visit_scheduled' });
      const merged = []
        .concat(Array.isArray(enquiries) ? enquiries : [])
        .concat(Array.isArray(visits) ? visits : []);
      merged.sort((a, b) => {
        const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return tb - ta;
      });
      setItems(merged);
    } catch (e) {
      setError(e?.message || 'Error al cargar consultas');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Chat functions
  const loadAgents = async () => {
    try {
      const data = await crmService.chat.getAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  const loadConversations = async () => {
    if (!currentAgentId) return;
    try {
      const data = await crmService.chat.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (partnerId, forceUpdate = false) => {
    if (!currentAgentId || !partnerId) return;
    
    // Only show loading on initial load or forced update
    if (forceUpdate || previousMessageCountRef.current === 0) {
      setChatLoading(true);
    }
    
    try {
      const data = await crmService.chat.getHistory(partnerId);
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
          
          // Mark new messages as read (fire and forget)
          crmService.chat.markAsRead(partnerId).catch(err => {
            console.error('Error marking messages as read:', err);
          });
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      if (forceUpdate || previousMessageCountRef.current === 0) {
        setChatLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentAgentId) return;
    setSendingMessage(true);
    try {
      // Determine receiverType based on whether it's ERP or agent
      const receiverType = selectedChat.isErp ? 'erp' : 'agent';
      const data = await crmService.chat.send(selectedChat._id, newMessage.trim(), { receiverType });
      
      // Add message to state and update count
      setMessages(prev => [...prev, data]);
      previousMessageCountRef.current += 1;
      setNewMessage('');
      
      // Scroll to bottom within container
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
      
      loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };


  const selectChat = (agent) => {
    setSelectedChat(agent);
    previousMessageCountRef.current = 0;
    wasAtBottomRef.current = true;
    loadMessages(agent._id, true);
    
    // Mark messages as read when selecting conversation
    crmService.chat.markAsRead(agent._id).catch(err => {
      console.error('Error marking messages as read:', err);
    });
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  // Load chat data when tab changes
  useEffect(() => {
    if (activeTab === 'chat' && currentAgentId) {
      loadAgents();
      loadConversations();
    }
  }, [activeTab, currentAgentId]);

  // Polling for new messages - 500ms for near real-time updates
  useEffect(() => {
    if (activeTab === 'chat' && selectedChat && currentAgentId) {
      const interval = setInterval(() => {
        loadMessages(selectedChat._id);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedChat, currentAgentId]);

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
      <Header category="CRM" title="📬 Consultas y Mensajes" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('consultas')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'consultas'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
              : `${currentMode === 'Dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
          }`}
        >
          <FaHome className="text-lg" />
          Consultas de Propiedades
          {stats.total > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'consultas' ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
            }`}>
              {stats.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
              : `${currentMode === 'Dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
          }`}
        >
          <FaComments className="text-lg" />
          Chat Interno
          {conversations.filter(c => c.unreadCount > 0).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white animate-pulse">
              {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
            </span>
          )}
        </button>
      </div>

      {/* TAB: Consultas de Propiedades */}
      {activeTab === 'consultas' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              onClick={() => setFilter('all')}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                filter === 'all' 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                </div>
                <div className={`p-3 rounded-full ${currentMode === 'Dark' ? 'bg-blue-900/50' : 'bg-blue-500'}`}>
                  <FaEnvelope className="text-xl text-white" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setFilter('enquiry')}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                filter === 'enquiry' 
                  ? 'ring-2 ring-purple-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Consultas</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.enquiries}</p>
                </div>
                <div className={`p-3 rounded-full ${currentMode === 'Dark' ? 'bg-purple-900/50' : 'bg-purple-500'}`}>
                  <FaEnvelope className="text-xl text-white" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setFilter('visit')}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                filter === 'visit' 
                  ? 'ring-2 ring-green-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gradient-to-br from-green-50 to-green-100'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visitas Programadas</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.visits}</p>
                </div>
                <div className={`p-3 rounded-full ${currentMode === 'Dark' ? 'bg-green-900/50' : 'bg-green-500'}`}>
                  <FaCalendarCheck className="text-xl text-white" />
                </div>
              </div>
            </div>
          </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className={`flex-1 max-w-md relative ${currentMode === 'Dark' ? 'text-gray-100' : ''}`}>
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, propiedad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
              currentMode === 'Dark' 
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {filteredItems.map((row) => (
          <div 
            key={row.id} 
            className={`rounded-xl overflow-hidden transition-all hover:shadow-lg ${
              currentMode === 'Dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
            }`}
          >
            {/* Card Header */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              row.type === 'visit_scheduled' 
                ? (currentMode === 'Dark' ? 'bg-green-900/30 border-b border-green-800' : 'bg-green-50 border-b border-green-200')
                : (currentMode === 'Dark' ? 'bg-purple-900/30 border-b border-purple-800' : 'bg-purple-50 border-b border-purple-200')
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  row.type === 'visit_scheduled' 
                    ? (currentMode === 'Dark' ? 'bg-green-800' : 'bg-green-500')
                    : (currentMode === 'Dark' ? 'bg-purple-800' : 'bg-purple-500')
                }`}>
                  {row.type === 'visit_scheduled' 
                    ? <FaCalendarCheck className="text-white" />
                    : <FaEnvelope className="text-white" />
                  }
                </div>
                <div>
                  <span className={`font-semibold ${
                    row.type === 'visit_scheduled'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-purple-700 dark:text-purple-300'
                  }`}>
                    {row.type === 'visit_scheduled' ? 'Solicitud de Visita' : 'Consulta'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FaClock className="text-xs" />
                {formatDate(row.createdAt)}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Contacto
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      currentMode === 'Dark' ? 'bg-gray-700' : 'bg-gray-400'
                    }`}>
                      {row.contact.fullName ? row.contact.fullName.charAt(0).toUpperCase() : <FaUser />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {row.contact.fullName || 'Sin nombre'}
                      </p>
                      {row.contact.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaEnvelope className="text-xs" /> {row.contact.email}
                        </p>
                      )}
                      {row.contact.phone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaPhone className="text-xs" /> {row.contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Propiedad
                  </h4>
                  {row.property.title ? (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        currentMode === 'Dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                      }`}>
                        <FaHome className="text-blue-500" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{row.property.title}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin propiedad asociada</p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-3 md:col-span-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mensaje
                  </h4>
                  {row.notes ? (
                    <p className={`text-sm leading-relaxed p-3 rounded-lg ${
                      currentMode === 'Dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {row.notes}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin mensaje</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredItems.length === 0 && (
          <div className={`text-center py-16 rounded-xl ${
            currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <FaEnvelope className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm || filter !== 'all' ? 'No se encontraron resultados' : 'No hay consultas todavía'}
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilter('all'); }}
                className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
        </>
      )}

      {/* TAB: Chat Interno */}
      {activeTab === 'chat' && (
        <div className={`rounded-2xl overflow-hidden border ${currentMode === 'Dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`} style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="flex h-full">
            
            {/* Sidebar - Lista de Agentes y Conversaciones */}
            <div className={`w-80 flex-shrink-0 border-r ${currentMode === 'Dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex flex-col`}>
              
              {/* Header */}
              <div className={`p-4 border-b ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="font-bold text-lg dark:text-gray-100 flex items-center gap-2">
                  <FaComments className="text-blue-500" />
                  Chat Interno
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Comunícate con otros agentes y ERP</p>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.filter(c => !c.partner?.isErp).length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">CONVERSACIONES RECIENTES</p>
                    {conversations.filter(c => !c.partner?.isErp).map((conv) => (
                      <div
                        key={conv.partner?._id}
                        onClick={() => selectChat(conv.partner)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                          selectedChat?._id === conv.partner?._id
                            ? 'bg-blue-500 text-white'
                            : `${currentMode === 'Dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`
                        }`}
                      >
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                          selectedChat?._id === conv.partner?._id ? 'bg-white/20' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {conv.partner?.avatar ? (
                            <img src={conv.partner.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(conv.partner?.nombre)
                          )}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold truncate ${selectedChat?._id === conv.partner?._id ? '' : 'dark:text-gray-100'}`}>
                              {conv.partner?.nombre || 'Sin nombre'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${selectedChat?._id === conv.partner?._id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                            {conv.lastMessage?.content || 'Sin mensajes'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Agents */}
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">TODOS LOS AGENTES</p>
                  {agents.map((agent) => (
                    <div
                      key={agent._id}
                      onClick={() => selectChat(agent)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                        selectedChat?._id === agent._id
                          ? 'bg-blue-500 text-white'
                          : `${currentMode === 'Dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        selectedChat?._id === agent._id ? 'bg-white/20' : 'bg-gradient-to-br from-purple-400 to-purple-600'
                      }`}>
                        {agent.avatar ? (
                          <img src={agent.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(agent.nombre)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${selectedChat?._id === agent._id ? '' : 'dark:text-gray-100'}`}>
                          {agent.nombre}
                        </p>
                        <p className={`text-xs truncate ${selectedChat?._id === agent._id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                          {agent.cargo || 'Agente'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {agents.length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">
                      No hay otros agentes
                    </p>
                  )}
                </div>

                {/* ERP Chat Option */}
                <div className="p-2 border-t dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">ADMINISTRACIÓN</p>
                  {conversations.filter(c => c.partner?.isErp).map((conv) => (
                    <div
                      key={conv.partner?._id}
                      onClick={() => selectChat(conv.partner)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                        selectedChat?._id === conv.partner?._id
                          ? 'bg-emerald-500 text-white'
                          : `${currentMode === 'Dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        selectedChat?._id === conv.partner?._id ? 'bg-white/20' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                      }`}>
                        <FaBuilding className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${selectedChat?._id === conv.partner?._id ? '' : 'dark:text-gray-100'}`}>
                          {conv.partner?.nombre || 'ERP Administrativo'}
                        </p>
                        <p className={`text-xs truncate ${selectedChat?._id === conv.partner?._id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                          {conv.lastMessage?.content || 'Soporte y consultas'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
                  {conversations.filter(c => c.partner?.isErp).length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-2 text-xs">
                      Espera un mensaje del ERP para iniciar conversación
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 border-b ${currentMode === 'Dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-blue-400 to-blue-600">
                        {selectedChat.avatar ? (
                          <img src={selectedChat.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(selectedChat.nombre)
                        )}
                      </div>
                      <div>
                        <p className="font-bold dark:text-gray-100">{selectedChat.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaCircle className="text-green-500 text-[8px]" />
                          En línea
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div ref={messagesContainerRef} className={`flex-1 overflow-y-auto p-4 space-y-4 ${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    {chatLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <FaComments className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No hay mensajes aún</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Envía el primer mensaje</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => {
                          const isOwn = msg.senderId?._id === currentAgentId || msg.senderId === currentAgentId;
                          const showDate = index === 0 || 
                            formatMessageDate(msg.createdAt) !== formatMessageDate(messages[index - 1]?.createdAt);
                          
                          return (
                            <React.Fragment key={msg._id || index}>
                              {showDate && (
                                <div className="flex justify-center my-4">
                                  <span className={`px-3 py-1 rounded-full text-xs ${currentMode === 'Dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'} shadow-sm`}>
                                    {formatMessageDate(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                                  <div className={`px-4 py-3 rounded-2xl ${
                                    isOwn
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                                      : `${currentMode === 'Dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} rounded-bl-md shadow-sm`
                                  }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}>
                                    <span>{formatMessageTime(msg.createdAt)}</span>
                                    {isOwn && (
                                      msg.read 
                                        ? <FaCheckDouble className="text-blue-400" />
                                        : <FaCheck />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className={`p-4 border-t ${currentMode === 'Dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Escribe un mensaje..."
                        className={`flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-all ${
                          currentMode === 'Dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-gray-100 border-gray-200 text-gray-900'
                        }`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FaPaperPlane />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center mb-6">
                    <FaComments className="text-4xl text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-gray-100 mb-2">Chat Interno</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Selecciona un agente de la lista para iniciar una conversación. 
                    Tu historial de mensajes se guardará automáticamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultas;
