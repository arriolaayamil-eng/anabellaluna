require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./models/Message');
const Agente = require('./models/Agente');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app_inmobiliaria';

async function testConversations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const agentId = '695808840288e274f83fcdc5'; // Eric's Agente ID
    const adminUserId = '6955b997ced2ce3803450a99'; // Admin User ID
    
    console.log('=== TESTING AGENT PERSPECTIVE ===');
    console.log('Agent (Eric) ID:', agentId);
    console.log('Admin User ID:', adminUserId);
    console.log('');

    // Find all messages involving the agent
    const allMessages = await Message.find({
      $or: [
        { senderId: new mongoose.Types.ObjectId(agentId) },
        { receiverId: new mongoose.Types.ObjectId(agentId) }
      ]
    }).sort({ createdAt: 1 }).lean();

    console.log('Total messages for agent:', allMessages.length);
    console.log('');

    if (allMessages.length > 0) {
      console.log('Messages breakdown:');
      allMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.senderType} → ${msg.receiverType}`);
        console.log(`     senderId: ${msg.senderId}`);
        console.log(`     receiverId: ${msg.receiverId}`);
        console.log(`     content: "${msg.content.substring(0, 50)}..."`);
        console.log(`     read: ${msg.read}`);
        console.log(`     createdAt: ${msg.createdAt}`);
        console.log('');
      });
    }

    // Simulate the /conversations endpoint logic
    console.log('=== SIMULATING /conversations ENDPOINT ===');
    console.log('');

    const userId = new mongoose.Types.ObjectId(agentId);

    // Get messages sent by agent
    const sentMessages = await Message.aggregate([
      { $match: { senderId: userId } },
      { $group: { _id: { oderable: '$receiverId', type: '$receiverType' } } }
    ]);

    console.log('Sent to partners:', sentMessages.length);
    sentMessages.forEach(m => {
      if (m._id && m._id.oderable) {
        console.log(`  Partner: ${m._id.oderable}, type: ${m._id.type || 'agent'}`);
      }
    });
    console.log('');

    // Get messages received by agent
    const receivedMessages = await Message.aggregate([
      { $match: { receiverId: userId } },
      { $group: { _id: { oderable: '$senderId', type: '$senderType' } } }
    ]);

    console.log('Received from partners:', receivedMessages.length);
    receivedMessages.forEach(m => {
      if (m._id && m._id.oderable) {
        console.log(`  Partner: ${m._id.oderable}, type: ${m._id.type || 'agent'}`);
      }
    });
    console.log('');

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

    console.log('Unique conversation partners:', partnersMap.size);
    console.log('');

    // Process each partner
    for (const [key, partner] of partnersMap.entries()) {
      console.log(`--- Partner: ${partner.id} (${partner.type}) ---`);
      
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
            console.log('  Admin User fallback: Administración ERP (isErp: true)');
          } else {
            console.log('  Agent partner: NOT FOUND');
          }
        } else {
          console.log('  Agent partner:', partnerInfo.nombre);
        }
      } else {
        // ERP user
        partnerInfo = {
          _id: partner.id,
          nombre: 'Administración ERP',
          email: 'admin@sistema.com',
          avatar: null,
          cargo: 'Administrador',
          isErp: true
        };
        console.log('  ERP partner: Administración ERP');
      }
      
      if (partnerInfo) {
        const partnerObjId = new mongoose.Types.ObjectId(partner.id);
        const userObjId = new mongoose.Types.ObjectId(agentId);
        
        // Get last message
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userObjId, receiverId: partnerObjId },
            { senderId: partnerObjId, receiverId: userObjId }
          ]
        }).sort({ createdAt: -1 }).lean();
        
        if (lastMessage) {
          console.log('  Last message:', lastMessage.content.substring(0, 50) + '...');
          console.log('  Last message date:', lastMessage.createdAt);
        } else {
          console.log('  ❌ No messages found between agent and this partner!');
        }
        
        // Get unread count
        const unreadCount = await Message.countDocuments({
          senderId: partnerObjId,
          receiverId: userObjId,
          read: false
        });
        
        console.log('  Unread count:', unreadCount);
        console.log('');
      }
    }

    // Test message history endpoint simulation
    console.log('=== SIMULATING /history/:partnerId ENDPOINT ===');
    console.log('Getting history with admin:', adminUserId);
    console.log('');

    const currentUserId = new mongoose.Types.ObjectId(agentId);
    const partnerIdForHistory = new mongoose.Types.ObjectId(adminUserId);

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: partnerIdForHistory },
        { senderId: partnerIdForHistory, receiverId: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    console.log('Messages in history:', messages.length);
    if (messages.length > 0) {
      messages.forEach((msg, idx) => {
        const direction = msg.senderId.toString() === agentId ? 'Agent → Admin' : 'Admin → Agent';
        console.log(`  ${idx + 1}. ${direction}: "${msg.content.substring(0, 40)}..."`);
      });
    } else {
      console.log('  ⚠️  NO MESSAGES FOUND! This is the problem!');
      console.log('  Checking if messages exist with different IDs...');
      
      // Check all messages with admin as sender or receiver
      const adminMessages = await Message.find({
        $or: [
          { senderId: new mongoose.Types.ObjectId(adminUserId) },
          { receiverId: new mongoose.Types.ObjectId(adminUserId) }
        ]
      }).lean();
      
      console.log('  Messages involving admin ID:', adminMessages.length);
      if (adminMessages.length > 0) {
        adminMessages.forEach(msg => {
          console.log(`    ${msg.senderType} (${msg.senderId}) → ${msg.receiverType} (${msg.receiverId})`);
        });
      }
    }

    console.log('');
    console.log('✓ Test complete');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testConversations();
