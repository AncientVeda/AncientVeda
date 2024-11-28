const request = require('supertest');
const app = require('../app'); // Deine App-Datei
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory'); // Inventory-Schema

// Testdaten
let adminToken = '';
let testInventoryId = '';

beforeAll(async () => {
    // Mit der Live-Datenbank verbinden
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Mit der Live-Datenbank verbunden.');
    } catch (error) {
        console.error('Fehler beim Verbinden mit der Datenbank:', error.message);
    }

    // Einen Admin-Benutzer registrieren und authentifizieren
    const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'securepassword',
        role: 'admin',
    };

    // Admin registrieren
    await request(app).post('/users/register').send(adminData);

    // Admin anmelden
    const loginResponse = await request(app).post('/users/login').send({
        email: adminData.email,
        password: adminData.password,
    });

    adminToken = loginResponse.body.token;
});

afterAll(async () => {
    // Testdaten entfernen
    if (testInventoryId) {
        await Inventory.findByIdAndDelete(testInventoryId);
    }

    // Verbindung schließen
    await mongoose.connection.close();
    console.log('Datenbank-Verbindung geschlossen.');
});

describe('Inventory API', () => {
    it('should fetch all inventory data (GET /inventory)', async () => {
        const res = await request(app)
            .get('/inventory')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create new inventory data (POST /inventory)', async () => {
        const inventoryData = {
            product_id: new mongoose.Types.ObjectId(), // Dummy Produkt-ID
            quantity: 100,
            location: 'Warehouse A',
        };

        const res = await request(app)
            .post('/inventory')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(inventoryData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('product_id', inventoryData.product_id.toString());
        expect(res.body).toHaveProperty('quantity', inventoryData.quantity);
        expect(res.body).toHaveProperty('location', inventoryData.location);

        testInventoryId = res.body._id; // Speichert die ID für spätere Tests
    });

    it('should update inventory data (PUT /inventory/:id)', async () => {
        const updatedData = {
            quantity: 150,
            location: 'Updated Warehouse',
        };

        const res = await request(app)
            .put(`/inventory/${testInventoryId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updatedData);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('_id', testInventoryId);
        expect(res.body).toHaveProperty('quantity', updatedData.quantity);
        expect(res.body).toHaveProperty('location', updatedData.location);
    });

    it('should delete inventory data (DELETE /inventory/:id)', async () => {
        const res = await request(app)
            .delete(`/inventory/${testInventoryId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Bestandsdaten gelöscht.');

        // Verifizieren, dass die Daten entfernt wurden
        const deletedData = await Inventory.findById(testInventoryId);
        expect(deletedData).toBeNull();

        testInventoryId = ''; // Testdaten wurden gelöscht
    });
});

