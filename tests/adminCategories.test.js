const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Category = require('../models/Category');
const User = require('../models/User');
const bcrypt = require('bcrypt');

describe('Admin Categories API', () => {
  let adminToken;
  let nonAdminToken;
  let categoryId;

  beforeAll(async () => {
    // Verbinde mit der Datenbank
    if (!mongoose.connection.readyState) {
      await mongoose.connect(
        'mongodb+srv://AncientVeda:root@cluster0.6z90s.mongodb.net/AncientVedas?retryWrites=true&w=majority',
        { useNewUrlParser: true, useUnifiedTopology: true }
      );
    }

    // Admin-Benutzer erstellen
    const hashedPassword = await bcrypt.hash('securepassword', 10);
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin',
      });
    }

    // Non-Admin-Benutzer erstellen
    let nonAdmin = await User.findOne({ email: 'user@example.com' });
    if (!nonAdmin) {
      nonAdmin = await User.create({
        name: 'Regular User',
        email: 'user@example.com',
        password_hash: hashedPassword,
        role: 'user',
      });
    }

    // Admin-Token generieren
    const adminLogin = await request(app)
      .post('/users/login')
      .send({ email: 'admin@example.com', password: 'securepassword' });
    adminToken = adminLogin.body.token;

    // Non-Admin-Token generieren
    const nonAdminLogin = await request(app)
      .post('/users/login')
      .send({ email: 'user@example.com', password: 'securepassword' });
    nonAdminToken = nonAdminLogin.body.token;
  });

  afterAll(async () => {
    await Category.deleteMany();
    await User.deleteMany();
    await mongoose.connection.close();
  });

  it('should allow an admin to create a category', async () => {
    const res = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Kategorie',
        description: 'Dies ist eine Testkategorie',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Test Kategorie');
    categoryId = res.body._id; // Speichere die Kategorie-ID für spätere Tests
  });

  it('should allow an admin to fetch all categories', async () => {
    const res = await request(app)
      .get('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should allow an admin to update a category', async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Aktualisierte Kategorie',
        description: 'Aktualisierte Beschreibung',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Aktualisierte Kategorie');
  });

  it('should allow an admin to delete a category', async () => {
    const res = await request(app)
      .delete(`/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Kategorie erfolgreich gelöscht');
  });

  it('should deny access to non-admins for creating a category', async () => {
    const res = await request(app)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .send({
        name: 'Nicht-Erlaubte Kategorie',
        description: 'Beschreibung der nicht-erlaubten Kategorie',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Zugriff verweigert: Nur für Admins!');
  });

  it('should deny access to non-admins for updating a category', async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .send({
        name: 'Nicht-Erlaubte Aktualisierung',
        description: 'Beschreibung der nicht-erlaubten Aktualisierung',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Zugriff verweigert: Nur für Admins!');
  });

  it('should deny access to non-admins for deleting a category', async () => {
    const res = await request(app)
      .delete(`/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${nonAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Zugriff verweigert: Nur für Admins!');
  });
});

