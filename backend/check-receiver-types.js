require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app_inmobiliaria';

async function checkReceiverTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const agentId = '695808840288e274f83fcdc5';
    const adminId = '6955b997ced2ce3803450a99';
    
    const msgs = await Message.find({
      $or: [
        { senderId: agentId },
        { receiverId: agentId }
      ]
    }).select('senderId receiverId senderType receiverType content createdAt').lean();
    
    console.log('Messages involving agent:');
    console.log('');
    msgs.forEach((m, idx) => {
      const senderLabel = m.senderId.toString() === agentId ? 'AGENT' : 'ADMIN';
      const receiverLabel = m.receiverId.toString() === agentId ? 'AGENT' : 'ADMIN';
      console.log(`${idx + 1}. ${senderLabel} → ${receiverLabel}`);
      console.log(`   senderType: ${m.senderType}, receiverType: ${m.receiverType}`);
      console.log(`   senderId: ${m.senderId}`);
      console.log(`   receiverId: ${m.receiverId}`);
      console.log(`   content: "${m.content.substring(0, 40)}"`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkReceiverTypes();
