const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Agente = require('../models/Agente');
const User = require('../models/User');
const { authenticateToken } = require('../auth');

// Helper to validate ObjectId
function isValidObjectId(id) {
  if (!id) return false;
  try {
    return mongoose.Types.ObjectId.isValid(id) && 
           (String(new mongoose.Types.ObjectId(id)) === String(id));
  } catch {
    return false;
  }
}

// Helper to get user info from token
// Token structure: { sub: userId, username, role, agenteId }
// - For agents: agenteId is set (or we lookup by email), sub is User._id
// - For admins: agenteId is null, sub is User._id (use sub as the ID)
async function getUserFromToken(req) {
  const user = req.user || {};
  
  // If agenteId is set in token, use it
  if (user.agenteId) {
    return {
      id: String(user.agenteId),
      type: 'agent',
      role: user.role || 'agent'
    };
  }
  
  // For admin users, use sub (User._id)
  if (user.role === 'admin') {
    return {
      id: user.sub ? String(user.sub) : null,
      type: 'erp',
      role: 'admin'
    };
  }
  
  // For agents without agenteId in token, try to find by username/email
  if (user.role === 'agent' && user.username) {
    try {
      const agente = await Agente.findOne({ email: user.username }).select('_id').lean();
      if (agente) {
        return {
          id: String(agente._id),
          type: 'agent',
          role: 'agent'
        };
      }
    } catch (err) {
      console.error('Error looking up agente:', err);
    }
  }
  
  // Fallback to sub
  return {
    id: user.sub ? String(user.sub) : null,
    type: user.role === 'admin' ? 'erp' : 'agent',
    role: user.role || 'agent'
  };
}

// ==================== AGENTS LIST ====================

// Get all agents for chat list (excluding current user)
router.get('/agents', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const query = currentUser.id ? { _id: { $ne: currentUser.id } } : {};
    
    const agents = await Agente.find(query)
      .select('nombre email avatar cargo especialidad metadata.online metadata.lastSeen')
      .sort({ nombre: 1 })
      .lean();
    
    // Format response with online status
    const formattedAgents = agents.map(agent => ({
      _id: agent._id,
      nombre: agent.nombre,
      email: agent.email,
      avatar: agent.avatar,
      cargo: agent.cargo,
      especialidad: agent.especialidad,
      online: agent.metadata?.online || false,
      lastSeen: agent.metadata?.lastSeen
    }));
    
    res.json(formattedAgents);
  } catch (error) {
    console.error('Error fetching agents for chat:', error);
    res.status(500).json({ error: 'Error al obtener agentes' });
  }
});

// ==================== CONVERSATIONS ====================

// Get conversations list for current user (with last message and unread count)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!isValidObjectId(currentUser.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(currentUser.id);
    
    // Get all unique conversation partners
    const sentMessages = await Message.aggregate([
      { $match: { senderId: userId } },
      { $group: { _id: { oderable: '$receiverId', type: '$receiverType' } } }
    ]);
    
    const receivedMessages = await Message.aggregate([
      { $match: { receiverId: userId } },
      { $group: { _id: { oderable: '$senderId', type: '$senderType' } } }
    ]);
    
    // Combine partners
    const partnersMap = new Map();
    [...sentMessages, ...receivedMessages].forEach(m => {
      if (m._id?.oderable) {
        const key = m._id.oderable.toString();
        if (!partnersMap.has(key)) {
          partnersMap.set(key, { id: m._id.oderable, type: m._id.type || 'agent' });
        }
      }
    });
    
    // Get agent details and last message for each partner
    const conversations = await Promise.all(
      Array.from(partnersMap.values()).map(async (partner) => {
        let partnerInfo = null;
        
        if (partner.type === 'agent') {
          partnerInfo = await Agente.findById(partner.id)
            .select('nombre email avatar cargo metadata.online metadata.lastSeen')
            .lean();
          
          // Fallback: if Agente not found, check if it's an admin User
          if (!partnerInfo) {
            const userDoc = await User.findById(partner.id).select('role username').lean();
            if (userDoc && userDoc.role === 'admin') {
              partnerInfo = {
                _id: partner.id,
                nombre: 'Administración ERP',
                email: 'admin@sistema.com',
                avatar: null,
                cargo: 'Administrador',
                isErp: true
              };
            }
          }
        } else {
          // ERP user - use a generic admin info
          partnerInfo = {
            _id: partner.id,
            nombre: 'Administración ERP',
            email: 'admin@sistema.com',
            avatar: null,
            cargo: 'Administrador',
            isErp: true
          };
        }
        
        if (!partnerInfo) return null;
        
        const partnerObjId = new mongoose.Types.ObjectId(partner.id);
        const userObjId = new mongoose.Types.ObjectId(currentUser.id);
        
        // Get last message
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userObjId, receiverId: partnerObjId },
            { senderId: partnerObjId, receiverId: userObjId }
          ]
        }).sort({ createdAt: -1 }).lean();
        
        // Get unread count
        const unreadCount = await Message.countDocuments({
          senderId: partnerObjId,
          receiverId: userObjId,
          read: false
        });
        
        return {
          partner: {
            _id: partnerInfo._id,
            nombre: partnerInfo.nombre,
            email: partnerInfo.email,
            avatar: partnerInfo.avatar,
            cargo: partnerInfo.cargo,
            online: partnerInfo.metadata?.online || false,
            lastSeen: partnerInfo.metadata?.lastSeen,
            isErp: partnerInfo.isErp || false
          },
          lastMessage,
          unreadCount,
          conversationId: Message.getConversationId(currentUser.id, partner.id.toString())
        };
      })
    );
    
    // Filter nulls and sort by last message date
    const validConversations = conversations
      .filter(c => c !== null)
      .sort((a, b) => {
        const dateA = a.lastMessage?.createdAt || new Date(0);
        const dateB = b.lastMessage?.createdAt || new Date(0);
        return new Date(dateB) - new Date(dateA);
      });
    
    res.json(validConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// ==================== MESSAGE HISTORY ====================

// Get messages between current user and a partner
router.get('/history/:partnerId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { partnerId } = req.params;
    const { limit = 50, before } = req.query;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!isValidObjectId(currentUser.id) || !isValidObjectId(partnerId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const query = {
      $or: [
        { senderId: new mongoose.Types.ObjectId(currentUser.id), receiverId: new mongoose.Types.ObjectId(partnerId) },
        { senderId: new mongoose.Types.ObjectId(partnerId), receiverId: new mongoose.Types.ObjectId(currentUser.id) }
      ]
    };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'nombre avatar')
      .populate('receiverId', 'nombre avatar')
      .lean();
    
    // Mark received messages as read
    await Message.updateMany(
      { 
        senderId: new mongoose.Types.ObjectId(partnerId), 
        receiverId: new mongoose.Types.ObjectId(currentUser.id), 
        read: false 
      },
      { $set: { read: true, readAt: new Date() } }
    );
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ==================== SEND MESSAGE ====================

// Send a new message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { receiverId, content, contentType = 'text', attachment, receiverType = 'agent' } = req.body;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'Sender ID required' });
    }
    
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Faltan campos requeridos (receiverId, content)' });
    }
    
    if (!isValidObjectId(currentUser.id) || !isValidObjectId(receiverId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Generate conversation ID
    const conversationId = Message.getConversationId(currentUser.id, receiverId);
    
    const message = new Message({
      senderId: currentUser.id,
      receiverId,
      content: content.trim(),
      contentType,
      attachment,
      conversationId,
      senderType: currentUser.type,
      receiverType
    });
    
    await message.save();
    
    // Populate sender info for response
    await message.populate('senderId', 'nombre avatar');
    await message.populate('receiverId', 'nombre avatar');
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// ==================== READ STATUS ====================

// Mark all messages from a partner as read
router.put('/read/:partnerId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { partnerId } = req.params;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const result = await Message.updateMany(
      { 
        senderId: new mongoose.Types.ObjectId(partnerId), 
        receiverId: new mongoose.Types.ObjectId(currentUser.id), 
        read: false 
      },
      { $set: { read: true, readAt: new Date() } }
    );
    
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Error al marcar como leído' });
  }
});

// Get unread count for current user
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!isValidObjectId(currentUser.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const userObjId = new mongoose.Types.ObjectId(currentUser.id);
    
    const unreadCount = await Message.countDocuments({
      receiverId: userObjId,
      read: false
    });
    
    // Get unread count per conversation
    const unreadByConversation = await Message.aggregate([
      { 
        $match: { 
          receiverId: userObjId, 
          read: false 
        } 
      },
      { 
        $group: { 
          _id: '$senderId', 
          count: { $sum: 1 },
          lastMessage: { $last: '$content' },
          lastMessageAt: { $last: '$createdAt' }
        } 
      }
    ]);
    
    res.json({ 
      total: unreadCount,
      byConversation: unreadByConversation
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Error al obtener mensajes no leídos' });
  }
});

// ==================== DELETE MESSAGE ====================

// Delete a message (only sender can delete)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { messageId } = req.params;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }
    
    // Only sender can delete
    if (message.senderId.toString() !== currentUser.id) {
      return res.status(403).json({ error: 'No autorizado para eliminar este mensaje' });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
});

// ==================== BROADCAST (ERP to all agents) ====================

// Send broadcast message from ERP to all agents
router.post('/broadcast', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    
    // Only admin/ERP can broadcast
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden enviar broadcasts' });
    }
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const { content, contentType = 'text' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Contenido requerido' });
    }
    
    // Get all agents
    const agents = await Agente.find().select('_id').lean();
    
    if (agents.length === 0) {
      return res.status(404).json({ error: 'No hay agentes registrados' });
    }
    
    // Create a message for each agent
    const messages = await Promise.all(
      agents.map(async (agent) => {
        const message = new Message({
          senderId: new mongoose.Types.ObjectId(currentUser.id),
          receiverId: agent._id,
          content: content.trim(),
          contentType,
          conversationId: Message.getConversationId(currentUser.id, agent._id.toString()),
          senderType: 'erp',
          receiverType: 'agent',
          metadata: { isBroadcast: true }
        });
        
        await message.save();
        return message;
      })
    );
    
    res.status(201).json({ 
      success: true, 
      sentTo: messages.length,
      message: 'Broadcast enviado a todos los agentes'
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Error al enviar broadcast' });
  }
});

// ==================== ONLINE STATUS ====================

// Update online status for current user
router.put('/status/online', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { online } = req.body;
    
    if (!currentUser.id || currentUser.type !== 'agent') {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    await Agente.findByIdAndUpdate(currentUser.id, {
      $set: {
        'metadata.online': online,
        'metadata.lastSeen': new Date()
      }
    });
    
    res.json({ success: true, online });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ==================== GROUP CHAT ====================

// Create or get a group conversation
router.post('/group/create', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { name, participantIds } = req.body;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({ error: 'Se requieren al menos 2 participantes' });
    }
    
    // Generate a unique group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create system message announcing group creation
    const systemMessage = new Message({
      senderId: currentUser.id,
      senderType: currentUser.type,
      conversationId: groupId,
      content: `Grupo "${name || 'Sin nombre'}" creado`,
      contentType: 'system',
      metadata: {
        isGroup: true,
        groupName: name || 'Sin nombre',
        participants: [currentUser.id, ...participantIds],
        createdBy: currentUser.id
      }
    });
    
    await systemMessage.save();
    
    res.status(201).json({
      groupId,
      name: name || 'Sin nombre',
      participants: [currentUser.id, ...participantIds],
      createdAt: systemMessage.createdAt
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Send message to a group
router.post('/group/:groupId/send', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { groupId } = req.params;
    const { content, contentType = 'text' } = req.body;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Contenido requerido' });
    }
    
    const message = new Message({
      senderId: currentUser.id,
      senderType: currentUser.type,
      conversationId: groupId,
      content: content.trim(),
      contentType,
      metadata: { isGroup: true }
    });
    
    await message.save();
    await message.populate('senderId', 'nombre avatar');
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Error al enviar mensaje al grupo' });
  }
});

// Get group messages
router.get('/group/:groupId/history', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, before } = req.query;
    
    const query = { conversationId: groupId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'nombre avatar')
      .lean();
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching group history:', error);
    res.status(500).json({ error: 'Error al obtener historial del grupo' });
  }
});

// ==================== TYPING INDICATOR (optional) ====================

// This would typically be handled via WebSockets, but here's a polling endpoint
router.post('/typing', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { partnerId, isTyping } = req.body;
    
    // In a real implementation, this would broadcast via WebSocket
    // For now, we just acknowledge the request
    res.json({ success: true, isTyping });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ==================== SEARCH MESSAGES ====================

// Search messages
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);
    const { q, limit = 20 } = req.query;
    
    if (!currentUser.id) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query too short (min 2 chars)' });
    }
    
    const messages = await Message.find({
      $and: [
        { 
          $or: [
            { senderId: new mongoose.Types.ObjectId(currentUser.id) },
            { receiverId: new mongoose.Types.ObjectId(currentUser.id) }
          ]
        },
        { content: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'nombre avatar')
      .populate('receiverId', 'nombre avatar')
      .lean();
    
    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Error al buscar mensajes' });
  }
});

module.exports = router;
