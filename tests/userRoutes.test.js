require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Passe den Pfad zur App an

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('User Authentication API', () => {
  let token;

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({
        email: 'jguser@example.com',
        password: 'testpa23',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Registrierung erfolgreich.');
  });

  test('should log in a user and return a token', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpass123',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // Speichern des Tokens für weitere Tests
  });

  test('should access protected route with valid token', async () => {
    const res = await request(app)
      .get('/protected-route')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Zugriff erlaubt.');
  });

  test('should deny access with invalid token', async () => {
    const res = await request(app)
      .get('/protected-route')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Ungültiger oder abgelaufener Token.');
  });
});

