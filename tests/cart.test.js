const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');

describe('Cart Routes', () => {
    let token;
    let productId;
    let categoryId;

    beforeAll(async () => {
        // Verbindung zur Datenbank herstellen
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    beforeEach(async () => {
        // Kategorie erstellen
        const category = await Category.create({
            name: 'Test Category',
            description: 'A category for testing',
        });
        categoryId = category._id;

        // Test-Produkt erstellen
        const product = await Product.create({
            name: 'Test Product',
            price: 10.99,
            stock: 50,
            category: categoryId,
        });
        productId = product._id;

        // Benutzer registrieren und einloggen
        await request(app).post('/users/register').send({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
        });

        const loginResponse = await request(app).post('/users/login').send({
            email: 'testuser@example.com',
            password: 'password123',
        });

        token = loginResponse.body.token;
    });

    afterEach(async () => {
        // Daten nach jedem Test bereinigen
        await Cart.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
    });

    afterAll(async () => {
        // Verbindung zur Datenbank schließen
        await mongoose.connection.close();
    });

    it('POST /cart - sollte ein Produkt in den Warenkorb hinzufügen', async () => {
        const response = await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: productId,
                quantity: 2,
            });

        expect(response.status).toBe(201);
        expect(response.body.cart.items).toHaveLength(1);
        expect(response.body.cart.items[0].productId).toBe(productId.toString());
        expect(response.body.cart.items[0].quantity).toBe(2);
    });

    it('POST /cart - sollte 404 zurückgeben, wenn das Produkt nicht existiert', async () => {
        const invalidProductId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: invalidProductId,
                quantity: 1,
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Product not found.');
    });

    it('POST /cart - sollte 400 zurückgeben bei ungültigen Eingaben', async () => {
        const response = await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: '',
                quantity: -1,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Product ID and a positive quantity are required.');
    });

    it('GET /cart - sollte den Warenkorb des Benutzers abrufen', async () => {
        // Produkt hinzufügen, damit der Warenkorb nicht leer ist
        await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: productId,
                quantity: 2,
            });

        const response = await request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].productId).toBe(productId.toString());
        expect(response.body.items[0].quantity).toBe(2);
    });

    it('GET /cart - sollte eine leere Nachricht zurückgeben, wenn der Warenkorb leer ist', async () => {
        const response = await request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Your cart is empty.');
    });

    it('DELETE /cart - sollte den Warenkorb leeren', async () => {
        // Produkt hinzufügen
        await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: productId,
                quantity: 2,
            });

        const response = await request(app)
            .delete('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Cart successfully cleared.');
    });

    it('DELETE /cart/:itemId - sollte ein einzelnes Produkt aus dem Warenkorb entfernen', async () => {
        // Produkt hinzufügen
        const addResponse = await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({
                productId: productId,
                quantity: 2,
            });

        const itemId = addResponse.body.cart.items[0]._id;

        const response = await request(app)
            .delete(`/cart/${itemId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Produkt erfolgreich entfernt.');
    });

    it('DELETE /cart/:itemId - sollte 404 zurückgeben, wenn das Item nicht im Warenkorb gefunden wird', async () => {
        const invalidItemId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`/cart/${invalidItemId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Artikel nicht im Warenkorb gefunden.');
    });
});

