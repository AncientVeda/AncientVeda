const request = require('supertest');
const app = require('../app'); // Import der App
const mongoose = require('mongoose');
const Marketing = require('../models/Marketing');

beforeAll(async () => {
    // Verbindung zur Datenbank herstellen
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Test-Admin-Benutzer erstellen
    await request(app).post('/users/register').send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'securepassword',
        role: 'admin',
    });
});

afterAll(async () => {
    // Daten löschen und Verbindung schließen
    await Marketing.deleteMany({});
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.deleteMany();
    }
    await mongoose.connection.close();
});

describe('Marketing API', () => {
    let adminToken;

    beforeAll(async () => {
        // Admin-Benutzer einloggen
        const res = await request(app).post('/users/login').send({
            email: 'admin@example.com',
            password: 'securepassword',
        });
        adminToken = res.body.token;
    });

    it('should fetch all marketing data', async () => {
        const res = await request(app)
            .get('/marketing')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create a new marketing action', async () => {
        const marketingData = {
            name: 'Black Friday Sale',
            description: 'Massive discounts on all products!',
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Eine Woche
            target_audience: 'All customers',
            discount_percentage: 20,
        };

        const res = await request(app)
            .post('/marketing')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(marketingData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('name', 'Black Friday Sale');
    });

    it('should update a marketing action', async () => {
        const marketing = await Marketing.create({
            name: 'Old Campaign',
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const res = await request(app)
            .put(`/marketing/${marketing._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Updated Campaign' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Updated Campaign');
    });

    it('should delete a marketing action', async () => {
        const marketing = await Marketing.create({
            name: 'To be deleted',
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const res = await request(app)
            .delete(`/marketing/${marketing._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Marketingaktion gelöscht.');
    });
});

