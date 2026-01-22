const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  // require app after setting env
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('register and login flow', async () => {
  const username = `user${Date.now()}`;
  const resReg = await request(app).post('/auth/register').send({ username, password: 'secret123' });
  expect(resReg.statusCode).toBe(200);
  expect(resReg.body).toHaveProperty('id');

  const resLogin = await request(app).post('/auth/login').send({ username, password: 'secret123' });
  expect(resLogin.statusCode).toBe(200);
  expect(resLogin.body).toHaveProperty('token');
});
