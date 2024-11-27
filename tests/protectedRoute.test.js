
const request = require('supertest');
const app = require('../app'); // Importiere dein Express-App-Setup
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('GET /users/protected-data', () => {
  let token;

  beforeAll(async () => {
    console.log('Verbindung zu MongoDB wird hergestellt...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Verbindung erfolgreich!');

    console.log('Datenbankbereinigung und Setup...');
    await User.deleteMany({});
    console.log('Datenbankbereinigung erfolgreich!');

    // Testbenutzer erstellen
    const testUser = new User({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password_hash: await bcrypt.hash('testpass123', 10),
      role: 'customer',
    });

    await testUser.save();
    console.log('Testbenutzer erstellt.');

    // JWT-Token generieren
    token = jwt.sign({ userId: testUser._id, role: testUser.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log('JWT-Token generiert:', token);
  });

  afterAll(async () => {
    console.log('Datenbankbereinigung nach den Tests...');
    await User.deleteMany({});
    console.log('Datenbankbereinigung erfolgreich!');

    await mongoose.disconnect();
    console.log('Verbindung zu MongoDB geschlossen.');
  });

  it('sollte Zugriff auf die geschützte Route gewähren, wenn ein gültiger Token gesendet wird', async () => {
    const res = await request(app)
      .get('/users/protected-data')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Zugriff erlaubt.');
    expect(res.body.data).toHaveProperty('userId');
    expect(res.body.data).toHaveProperty('role', 'customer');
  });

  it('sollte Zugriff verweigern, wenn kein Token gesendet wird', async () => {
    const res = await request(app).get('/users/protected-data');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Kein Token bereitgestellt');
  });

  it('sollte Zugriff verweigern, wenn ein ungültiger Token gesendet wird', async () => {
    const res = await request(app)
      .get('/users/protected-data')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Ungültiger oder abgelaufener Token');
  });
});

