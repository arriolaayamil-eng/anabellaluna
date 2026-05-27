const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
let mongoServer;
let adminToken;

jest.setTimeout(30000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  // require app after setting env
  app = require('../server');

  const adminUsername = `admin${Date.now()}`;
  await request(app).post('/auth/register').send({ username: adminUsername, password: 'secret123', role: 'admin' });
  const resAdminLogin = await request(app).post('/auth/login').send({ username: adminUsername, password: 'secret123' });
  adminToken = resAdminLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('register and login flow', async () => {
  const username = `user${Date.now()}`;
  const resReg = await request(app).post('/auth/public-register').send({ username, password: 'secret123' });
  expect(resReg.statusCode).toBe(200);
  expect(resReg.body).toHaveProperty('token');

  const resLogin = await request(app).post('/auth/login').send({ username, password: 'secret123' });
  expect(resLogin.statusCode).toBe(200);
  expect(resLogin.body).toHaveProperty('token');
});

test('CRM routes require agent/admin with agenteId', async () => {
  const publicUsername = `public${Date.now()}`;
  const resPublicReg = await request(app).post('/auth/public-register').send({ username: publicUsername, password: 'secret123' });
  const publicToken = resPublicReg.body.token;

  // Public user should be forbidden from CRM
  const resForbidden = await request(app)
    .get('/crm/reports/types')
    .set('Authorization', `Bearer ${publicToken}`);
  expect(resForbidden.statusCode).toBe(403);

  // Admin can access CRM
  const resAdminOk = await request(app)
    .get('/crm/reports/types')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(resAdminOk.statusCode).toBe(200);
});
