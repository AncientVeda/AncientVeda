const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const bcrypt = require('bcrypt');

jest.setTimeout(30000); // Timeout erhöhen

describe('Admin API', () => {
  let adminToken;
  let nonAdminToken;
  let productId;
  let categoryId;

  beforeAll(async () => {
    try {
      if (!mongoose.connection.readyState) {
        await mongoose.connect('mongodb+srv://AncientVeda:root@cluster0.6z90s.mongodb.net/AncientVedas?retryWrites=true&w=majority', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      }

      const hashedPassword = await bcrypt.hash('securepassword', 10);
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin',
      });

      const nonAdmin = await User.create({
        name: 'Non-Admin User',
        email: 'user@example.com',
        password_hash: hashedPassword,
        role: 'user',
      });

      const adminLogin = await request(app)
        .post('/users/login')
        .send({ email: 'admin@example.com', password: 'securepassword' });
      adminToken = adminLogin.body.token;

      const nonAdminLogin = await request(app)
        .post('/users/login')
        .send({ email: 'user@example.com', password: 'securepassword' });
      nonAdminToken = nonAdminLogin.body.token;

      const product = await Product.create({
        name: 'Test Produkt',
        price: 10,
        description: 'Ein Testprodukt',
        category: new mongoose.Types.ObjectId(),
        stock: 100,
      });
      productId = product._id;

      const category = await Category.create({
        name: 'Test Kategorie',
        description: 'Eine Testkategorie',
      });
      categoryId = category._id;
    } catch (err) {
      console.error('Fehler in beforeAll:', err.message);
      throw err;
    }
  });

  afterAll(async () => {
    try {
      await User.deleteMany({ email: { $in: ['admin@example.com', 'user@example.com'] } });
      await Product.deleteMany({ name: 'Test Produkt' });
      await Category.deleteMany({ name: 'Test Kategorie' });
      await mongoose.connection.close();
    } catch (err) {
      console.error('Fehler in afterAll:', err.message);
    }
  });

  it('should allow an admin to get statistics', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('topProducts');
    expect(res.body).toHaveProperty('totalUsers');
  });

  it('should deny non-admins from accessing statistics', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${nonAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Zugriff verweigert: Nur für Admins!');
  });

  it('should allow an admin to add a product', async () => {
    const res = await request(app)
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Neues Produkt',
        price: 20,
        description: 'Ein weiteres Testprodukt',
        category: categoryId,
        stock: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Neues Produkt');
  });

  it('should deny non-admins from adding a product', async () => {
    const res = await request(app)
      .post('/admin/products')
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .send({
        name: 'Verbotenes Produkt',
        price: 30,
        description: 'Sollte nicht hinzugefügt werden',
        category: categoryId,
        stock: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Zugriff verweigert: Nur für Admins!');
  });

  it('should allow an admin to update a product', async () => {
    const res = await request(app)
      .put(`/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 15 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('price', 15);
  });

  it('should allow an admin to delete a product', async () => {
    const res = await request(app)
      .delete(`/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Produkt erfolgreich gelöscht');
  });

  it('should deny non-admins from deleting a product', async () => {
    const res = await request(app)
      .delete(`/admin/products/${productId}`)
      .set('Authorization', `Bearer ${nonAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Zugriff verweigert: Nur für Admins!');
  });
});

