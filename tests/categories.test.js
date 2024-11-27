const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Category = require('../models/Category');

describe('Categories Routes', () => {
    let testCategory;
    let authToken;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Erstelle ein Admin-Token
        authToken = jwt.sign(
            { userId: new mongoose.Types.ObjectId(), role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Erstelle eine Test-Kategorie
        testCategory = await Category.create({
            name: 'Test Category',
            description: 'Test Description',
        });
    });

    afterAll(async () => {
        // Lösche nur die Kategorien, keine gesamte Datenbank
        await mongoose.connection.db.collection('categories').deleteMany({});
        await mongoose.disconnect();
    });

    it('POST /categories - sollte eine Kategorie erstellen', async () => {
        const newCategory = { name: 'Neue Kategorie', description: 'Neue Beschreibung' };

        const response = await request(app)
            .post('/categories')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newCategory);

        expect(response.status).toBe(201);
        expect(response.body.name).toBe(newCategory.name);
        expect(response.body.description).toBe(newCategory.description);
    });

    it('POST /categories - sollte 400 zurückgeben bei ungültigen Daten', async () => {
        const invalidCategory = {}; // Keine Felder angegeben

        const response = await request(app)
            .post('/categories')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidCategory);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Ungültige Eingabedaten'); // Deutsche Nachricht
    });

    it('GET /categories - sollte alle Kategorien abrufen', async () => {
        const response = await request(app).get('/categories');

        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('PUT /categories/:id - sollte eine Kategorie aktualisieren', async () => {
        const updatedData = { name: 'Aktualisierte Kategorie', description: 'Aktualisierte Beschreibung' };

        const response = await request(app)
            .put(`/categories/${testCategory._id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body.name).toBe(updatedData.name);
        expect(response.body.description).toBe(updatedData.description);
    });

    it('PUT /categories/:id - sollte 404 zurückgeben, wenn die Kategorie nicht existiert', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .put(`/categories/${nonExistentId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Nicht vorhanden', description: 'Diese Kategorie gibt es nicht' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Kategorie nicht gefunden.'); // Deutsche Nachricht
    });

    it('DELETE /categories/:id - sollte eine Kategorie löschen', async () => {
        const response = await request(app)
            .delete(`/categories/${testCategory._id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Kategorie erfolgreich gelöscht.'); // Deutsche Nachricht
    });

    it('DELETE /categories/:id - sollte 404 zurückgeben, wenn die Kategorie nicht existiert', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`/categories/${nonExistentId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Kategorie nicht gefunden.'); // Deutsche Nachricht
    });
});

