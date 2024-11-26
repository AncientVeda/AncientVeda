const request = require('supertest');
const app = require('../server'); // Adjust path as per your project structure

describe('API Route Tests', () => {
    test('should fetch all items', async () => {
        const res = await request(app).get('/api/items');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should create a new item', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({
                name: 'New Item',
                description: 'Item description',
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
    });
});

