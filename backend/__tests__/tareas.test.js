const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('tareas protected create', async () => {
  const adminUsername = `admin${Date.now()}`;
  await request(app).post('/auth/register').send({ username: adminUsername, password: 'secret123', role: 'admin' });
  const resLoginAdmin = await request(app).post('/auth/login').send({ username: adminUsername, password: 'secret123' });
  const adminToken = resLoginAdmin.body.token;

  const agentUsername = `agent${Date.now()}@example.com`;
  const agentPassword = 'secret123';
  await request(app)
    .post('/crm/agentes/create-with-user')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Test Agent', email: agentUsername, username: agentUsername, password: agentPassword });
  const resLoginAgent = await request(app).post('/auth/login').send({ username: agentUsername, password: agentPassword });
  const agentToken = resLoginAgent.body.token;

  const tarea = { title: 'Test tarea', summary: 'test' };
  const resCreate = await request(app).post('/crm/tareas').set('Authorization', `Bearer ${agentToken}`).send(tarea);
  expect(resCreate.statusCode).toBe(201);
  expect(resCreate.body).toHaveProperty('_id');
});
