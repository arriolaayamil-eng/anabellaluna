const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Propiedad = require('./models/Propiedad');
const Cliente = require('./models/Cliente');
const Agente = require('./models/Agente');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return console.error('MONGODB_URI not set');
  await mongoose.connect(uri);
  console.log('Connected to DB, seeding...');
  const resetDemo = process.argv.includes('--reset-demo');

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await User.findOneAndUpdate(
    { username: adminUsername },
    { $set: { password_hash: adminHash, role: 'admin' } },
    { upsert: true, new: true }
  ).exec();
  console.log('Admin user ensured:', { id: admin._id.toString(), username: admin.username, role: admin.role });

  if (resetDemo) {
    await Propiedad.deleteMany({});
    await Cliente.deleteMany({});
    await Agente.deleteMany({});

    const cliente = await Cliente.create({ nombre: 'Cliente Demo', email: 'cli@example.com' });
    const agente = await Agente.create({ nombre: 'Agente Demo', email: 'agent@example.com' });
    await Propiedad.create({ title: 'Depto Demo', description: 'Demo', price: 100000, ownerId: cliente._id, agentId: agente._id });
    console.log('Demo data reset complete');
  }

  console.log('Seeding complete');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
