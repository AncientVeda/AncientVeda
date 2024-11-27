const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../app');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

jest.setTimeout(30000); // Timeout erhöhen

describe('Orders API', () => {
  let token;
  let userId;
  let productId;

  beforeAll(async () => {
    try {
      // Stelle sicher, dass die Datenbankverbindung existiert
      if (!mongoose.connection.readyState) {
        await mongoose.connect('mongodb+srv://AncientVeda:root@cluster0.6z90s.mongodb.net/AncientVedas?retryWrites=true&w=majority', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
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
      userId = admin._id;

      // Benutzer einloggen, um Token zu erhalten
      const loginResponse = await request(app)
        .post('/users/login')
        .send({ email: 'admin@example.com', password: 'securepassword' });
      token = loginResponse.body.token;

      // Testprodukt erstellen
      const product = await Product.create({
        name: 'Test Produkt',
        description: 'Ein Testprodukt',
        price: 10,
        stock: 100,
        category: new mongoose.Types.ObjectId(),
      });
      productId = product._id;

      // Test-Warenkorb erstellen
      await Cart.create({
        userId,
        items: [{ productId, quantity: 2 }],
      });
    } catch (err) {
      console.error('Fehler in beforeAll:', err.message);
      throw err;
    }
  });

  afterAll(async () => {
    try {
      await Cart.deleteMany();
      await Order.deleteMany();
      await Product.deleteMany();
      await User.deleteMany();
      await mongoose.connection.close();
    } catch (err) {
      console.error('Fehler in afterAll:', err.message);
    }
  });

  beforeEach(async () => {
    // Bereinige und erstelle ein neues Test-Produkt und Warenkorb
    await Product.deleteMany();
    await Cart.deleteMany();

    const product = await Product.create({
      name: 'Test Produkt',
      description: 'Ein Testprodukt',
      price: 10,
      stock: 100,
      category: new mongoose.Types.ObjectId(),
    });
    productId = product._id;

    await Cart.create({
      userId,
      items: [{ productId, quantity: 2 }],
    });
  });

  it('should create a new order', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Bestellung erfolgreich erstellt.');
    expect(res.body.order.items.length).toBeGreaterThan(0);
  });

  it('should return all orders for an admin', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return 404 if no orders are found', async () => {
    await Order.deleteMany();

    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Keine Bestellungen gefunden.');
  });

  it('should fail to create an order with an empty cart', async () => {
    await Cart.deleteOne({ userId });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Ihr Warenkorb ist leer. Bestellung kann nicht erstellt werden.');
  });

  it('should delete a product from the cart', async () => {
    const cart = new Cart({
      userId,
      items: [{ productId, quantity: 2 }],
    });
    await cart.save();

    const res = await request(app)
      .delete(`/orders/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Produkt erfolgreich aus dem Warenkorb entfernt.');
    expect(res.body.cart.items.length).toBe(0);
  });

  it('should clear the cart', async () => {
    const cart = new Cart({
      userId,
      items: [{ productId, quantity: 2 }],
    });
    await cart.save();

    const res = await request(app)
      .delete('/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Warenkorb erfolgreich geleert.');
  });

  it('should update the quantity of a product in the cart', async () => {
    const cart = new Cart({
      userId,
      items: [{ productId, quantity: 2 }],
    });
    await cart.save();

    const res = await request(app)
      .put('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Produktmenge erfolgreich aktualisiert.');
    expect(res.body.cart.items[0].quantity).toBe(5);
  });
});

