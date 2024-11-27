const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app'); // Express-App importieren
const jwt = require('jsonwebtoken');

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Gültigen Token generieren
  token = jwt.sign(
    { userId: 'testUserId', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Products API', () => {
  test('should create a new product', async () => {
    const newProduct = {
      name: 'Testprodukt',
      price: 19.99,
      stock: 10,
      category: '6740caa34a01f01ab7dcf55d', // Gültige Kategorie-ID
    };

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send(newProduct);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Produkt erfolgreich erstellt.');
    expect(res.body.product).toMatchObject(newProduct);
  });
});

