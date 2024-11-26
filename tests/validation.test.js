const request = require('supertest');
const app = require('../server'); // Adjust path as per your project structure

describe('Validation Middleware Tests', () => {
    test('should fail validation for missing fields', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({}); // Missing fields
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
});

