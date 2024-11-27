require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../app'); // Dein Express-App-Export
const User = require('../models/User');

describe('POST /users/login', () => {
  beforeAll(async () => {
    console.log('Verbindung zu MongoDB wird hergestellt...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Verbindung erfolgreich!');

    console.log('Datenbankbereinigung und Setup...');
    await User.deleteMany({});
    await User.create({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password_hash: await bcrypt.hash('testpass123', 10),
      role: 'customer',
    });
    console.log('Benutzer erstellt.');
  });

  afterAll(async () => {
    console.log('Datenbankbereinigung nach den Tests...');
    await User.deleteMany({});
    await mongoose.connection.close();
    console.log('Verbindung zu MongoDB geschlossen.');
  });

  it('sollte den Benutzer erfolgreich einloggen und ein Token zurückgeben', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'johndoe@example.com',
      password: 'testpass123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('message', 'Login erfolgreich!');
  });

  it('sollte einen Fehler zurückgeben, wenn die E-Mail ungültig ist', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'wrongemail@example.com',
      password: 'testpass123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Ungültige E-Mail oder Passwort.');
  });

  it('sollte einen Fehler zurückgeben, wenn das Passwort falsch ist', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'johndoe@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Ungültige E-Mail oder Passwort.');
  });

  it('sollte einen Fehler zurückgeben, wenn keine Daten gesendet werden', async () => {
    const res = await request(app).post('/users/login').send({});

    expect(res.status).toBe(400);

    // Struktur der zurückgegebenen Fehler überprüfen
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Ungültige E-Mail-Adresse', path: 'email' }),
        expect.objectContaining({ msg: 'Passwort ist erforderlich', path: 'password' }),
      ])
    );
  });
});

