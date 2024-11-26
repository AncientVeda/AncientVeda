const request = require('supertest');
const { app, server } = require('../../server');
const mongoose = require('mongoose');

describe('Product Routes', () => {
  let adminToken;
  let userToken;
  const validCategoryId = '674327309837fa5461d45f5e'; // Beispiel-Kategorie-ID

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/users/login')
      .send({ email: 'admin@example.com', password: 'adminpass123' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/users/login')
      .send({ email: 'user@example.com', password: 'userpass123' });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'Testprodukt',
        price: 19.99,
        stock: 10,
        category: validCategoryId,
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Produkt erfolgreich erstellt.');
      expect(res.body.product).toMatchObject({
        name: 'Testprodukt',
        price: 19.99,
        stock: 10,
        category: validCategoryId,
      });
    });

    it('should return 401 for invalid token', async () => {
      const newProduct = {
        name: 'Unauthorized Product',
        price: 15.99,
        stock: 5,
        category: validCategoryId,
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer invalidToken`) // Ungültiger Token
        .send(newProduct);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Ungültiger Token'); // 401 Nachricht
    });

    it('should return 403 for non-admin users', async () => {
      const newProduct = {
        name: 'Unauthorized Product',
        price: 15.99,
        stock: 5,
        category: validCategoryId,
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProduct);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Nur Admins dürfen Produkte hinzufügen.'); // 403 Nachricht
    });

    it('should return 400 if category does not exist', async () => {
      const invalidCategoryProduct = {
        name: 'Invalid Category Product',
        price: 25.99,
        stock: 20,
        category: '674327309837fa5461d45f5z', // Ungültige Kategorie-ID
      };

      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`) // Gültiger Admin-Token
        .send(invalidCategoryProduct);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Kategorie existiert nicht.'); // 400 Nachricht
    });
  });
});

