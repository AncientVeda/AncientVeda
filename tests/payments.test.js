require('dotenv').config(); // Lädt Umgebungsvariablen
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Server/App importieren
const Payment = require('../models/Payment'); // Payment-Modell importieren

beforeAll(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Mit der Testdatenbank verbunden.');
    } catch (error) {
        console.error('Fehler beim Verbinden mit der Datenbank:', error.message);
    }
});

afterAll(async () => {
    try {
        // Alle Collections leeren
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany();
        }

        // Verbindung schließen
        await mongoose.connection.close();
        console.log('Datenbank-Verbindung geschlossen.');
    } catch (error) {
        console.error('Fehler beim Schließen der Datenbank:', error.message);
    }
});

describe('Payments API', () => {
    let userToken; // Speichert das JWT-Token eines Test-Users

    beforeAll(async () => {
        // Test-User registrieren und Token abrufen
        const userRes = await request(app).post('/users/register').send({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'securepassword',
        });

        const loginRes = await request(app).post('/users/login').send({
            email: 'testuser@example.com',
            password: 'securepassword',
        });

        userToken = loginRes.body.token;
    });

    it('should create a payment successfully', async () => {
        const paymentData = {
            amount: 5000, // Beispielbetrag in kleinster Einheit der Währung (z.B. Cent)
            currency: 'usd',
        };

        const res = await request(app)
            .post('/payments/create')
            .set('Authorization', `Bearer ${userToken}`) // Authentifizierung hinzufügen
            .send(paymentData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('status', 'success');
        expect(res.body).toHaveProperty('paymentId');
    });

    it('should fail when required fields are missing', async () => {
        const res = await request(app)
            .post('/payments/create')
            .set('Authorization', `Bearer ${userToken}`) // Authentifizierung hinzufügen
            .send({}); // Fehlende Felder

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Betrag und Währung sind erforderlich.');
    });

    it('should fetch all payments', async () => {
        const res = await request(app)
            .get('/payments')
            .set('Authorization', `Bearer ${userToken}`); // Authentifizierung hinzufügen

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fetch the payment status', async () => {
        // Erstellt eine Testzahlung
        const payment = new Payment({
            userId: new mongoose.Types.ObjectId(), // Dummy-UserId
            amount: 1000,
            currency: 'usd',
            status: 'pending',
            transactionId: 'txn_test_123',
        });
        await payment.save();

        const res = await request(app)
            .get(`/payments/${payment._id}/status`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'pending');
    });
});

