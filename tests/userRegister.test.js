jest.setTimeout(80000); // Timeout auf 20 Sekunden erhöhen
const mongoose = require('mongoose');
require('dotenv').config();
const request = require('supertest');
const app = require('../app'); // App importieren
const User = require('../models/User'); // User-Modell

describe('POST /users/register', () => {
beforeAll(async () => {
  console.log('Verbindung zu MongoDB wird hergestellt...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Verbindung erfolgreich!');
    console.log('Datenbankbereinigung und Setup...');
    await User.deleteMany({}); // Löschen aller Benutzer vor den Tests
    console.log('Datenbankbereinigung erfolgreich!');
  } catch (err) {
    console.error('Fehler bei der Verbindung oder Bereinigung:', err);
    throw err; // Brich den Test ab, wenn die Verbindung fehlschlägt
  }
});


  afterAll(async () => {
    console.log('Datenbankbereinigung nach den Tests...');
    await User.deleteMany({}); // Löschen aller Benutzer nach den Tests
  });

  test('sollte einen neuen Benutzer erfolgreich registrieren', async () => {
    const res = await request(app).post('/users/register').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'testpass123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Benutzer erfolgreich registriert.');
    expect(res.body.user).toHaveProperty('email', 'johndoe@example.com');
    expect(res.body.user).toHaveProperty('name', 'John Doe');
  });

test('sollte Fehler zurückgeben, wenn der Name fehlt', async () => {
  const res = await request(app).post('/users/register').send({
    email: 'missingname@example.com',
    password: 'testpass123',
    role: 'customer',
  });

  expect(res.status).toBe(400); // Fehler erwartet
  expect(res.body.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        msg: 'Name ist erforderlich.',
        path: 'name',
      }),
    ])
  );
});

test('sollte Fehler zurückgeben, wenn die E-Mail ungültig ist', async () => {
  const res = await request(app).post('/users/register').send({
    name: 'Invalid Email User',
    email: 'invalid-email',
    password: 'testpass123',
    role: 'customer',
  });

  expect(res.status).toBe(400); // Fehler erwartet
  expect(res.body.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        msg: 'Bitte eine gültige E-Mail-Adresse angeben.',
        path: 'email',
      }),
    ])
  );
});

test('sollte Fehler zurückgeben, wenn das Passwort zu kurz ist', async () => {
  const res = await request(app).post('/users/register').send({
    name: 'Short Password User',
    email: 'shortpassword@example.com',
    password: '123',
    role: 'customer',
  });

  expect(res.status).toBe(400); // Fehler erwartet
  expect(res.body.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        msg: 'Passwort muss mindestens 6 Zeichen lang sein.',
        path: 'password',
      }),
    ])
  );
});

  test('sollte Fehler zurückgeben, wenn die E-Mail bereits registriert ist', async () => {
    // Benutzer registrieren
    await request(app).post('/users/register').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'testpass123',
    });

    // Versuch, denselben Benutzer erneut zu registrieren
    const res = await request(app).post('/users/register').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'testpass123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'E-Mail ist bereits registriert.');
  });
});

