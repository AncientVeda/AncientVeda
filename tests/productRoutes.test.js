const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Deine Express-App
const Category = require('../models/Category');
const User = require('../models/User');

let token; // Speichert den Token für die Tests
let categoryId; // Speichert die Kategorie-ID für die Tests

const bcrypt = require('bcrypt');

beforeAll(async () => {
  // Verbinde mit der Datenbank
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Bereinige die Datenbank
  await User.deleteMany({});
  await Category.deleteMany({});

  // Erstelle eine Kategorie
  const category = new Category({
    name: 'Test Kategorie',
    description: 'Beschreibung der Testkategorie',
  });
  const savedCategory = await category.save();
  categoryId = savedCategory._id;

  // Erstelle einen Admin-Benutzer mit gehashtem Passwort
  const hashedPassword = await bcrypt.hash('securepassword', 10);
  const adminUser = new User({
    name: 'Admin',
    email: 'admin@example.com',
    password_hash: hashedPassword, // Passwort-Hash speichern
    role: 'admin',
  });
  await adminUser.save();

  // Logge den Admin-Benutzer ein und hole den Token
  const res = await request(app).post('/users/login').send({
    email: 'admin@example.com',
    password: 'securepassword',
  });

  token = res.body.token; // Speichere den Token für die Tests
});

afterAll(async () => {
  // Bereinige die Datenbank und schließe die Verbindung
  await User.deleteMany({});
  await Category.deleteMany({});
  await mongoose.connection.close();
});

describe('Products API', () => {
  it('should create a new product', async () => {
    const newProduct = {
      name: 'Test Produkt',
      description: 'Dies ist ein Testprodukt',
      price: 29.99,
      stock: 100,
      category: categoryId.toString(), // Verwende die zuvor erstellte Kategorie-ID
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    };

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send(newProduct);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Produkt erfolgreich erstellt.');
    expect(res.body.product).toMatchObject({
      name: 'Test Produkt',
      description: 'Dies ist ein Testprodukt',
      price: 29.99,
      stock: 100,
      category: categoryId.toString(),
    });
  });

  it('should fail to create a product without a valid category', async () => {
    const invalidProduct = {
      name: 'Ungültiges Produkt',
      price: 19.99,
      stock: 50,
      category: 'invalidCategoryId', // Ungültige Kategorie-ID
      images: [],
    };

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidProduct);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Ungültige Eingabedaten');
  });
});

