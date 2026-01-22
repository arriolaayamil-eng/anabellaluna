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
  // register and login
  const username = `user${Date.now()}`;
  await request(app).post('/auth/register').send({ username, password: 'secret123' });
  const resLogin = await request(app).post('/auth/login').send({ username, password: 'secret123' });
  const token = resLogin.body.token;

  const tarea = { title: 'Test tarea', summary: 'test' };
  const resCreate = await request(app).post('/crm/tareas').set('Authorization', `Bearer ${token}`).send(tarea);
  expect(resCreate.statusCode).toBe(201);
  expect(resCreate.body).toHaveProperty('_id');
});
