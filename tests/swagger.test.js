const request = require('supertest');
const app = require('../server'); // Adjust path as per your project structure

describe('Swagger API Documentation Tests', () => {
    test('should load Swagger docs', async () => {
        const res = await request(app).get('/api-docs');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('Swagger UI');
    });
});

