const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server'); // Die Server-Datei
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const User = require('../../models/User');

// Mock-Daten für Tests
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User',
  email: 'testuser@example.com',
  password_hash: 'hashedpassword',
  role: 'customer',
};

const mockProduct = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Produkt',
  description: 'Beschreibung',
  price: 10.99,
  stock: 100,
  category_id: 'C001',
};

describe('Cart Routes', () => {
  beforeAll(async () => {
    // Verbindung zur Test-Datenbank
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Mock-Daten in die Datenbank einfügen
    await User.create(mockUser);
    await Product.create(mockProduct);
  });

  afterEach(async () => {
    // Mock-Daten nach jedem Test löschen
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    // Verbindung zur Test-Datenbank schließen
    await mongoose.connection.close();
  });

  test('POST /cart - fügt ein Produkt in den Warenkorb hinzu', async () => {
    // Mock-Session
    const sessionData = {
      userId: mockUser._id,
    };

    // Erstelle eine Anfrage mit Session-Daten
    const response = await request(app)
      .post('/cart')
      .set('Authorization', `Bearer mockToken`) // Mock-Token, falls benötigt
      .send({
        productId: mockProduct._id,
        quantity: 2,
      });

    expect(response.status).toBe(201);
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.items.length).toBe(1);
    expect(response.body.cart.items[0].productId).toBe(mockProduct._id.toString());
    expect(response.body.cart.items[0].quantity).toBe(2);
  });

  test('POST /cart - sollte einen Fehler werfen, wenn keine Session vorhanden ist', async () => {
    const response = await request(app)
      .post('/cart')
      .send({
        productId: mockProduct._id,
        quantity: 2,
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Kein Token vorhanden.');
  });

  test('POST /cart - sollte einen Fehler werfen, wenn das Produkt nicht existiert', async () => {
    const response = await request(app)
      .post('/cart')
      .set('Authorization', `Bearer mockToken`)
      .send({
        productId: new mongoose.Types.ObjectId(),
        quantity: 2,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Produkt nicht gefunden.');
  });

  test('POST /cart - sollte einen Fehler werfen, wenn ungültige Eingaben gemacht werden', async () => {
    const response = await request(app)
      .post('/cart')
      .set('Authorization', `Bearer mockToken`)
      .send({
        productId: mockProduct._id,
        quantity: -1,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Produkt-ID und positive Menge sind erforderlich.');
  });
});

