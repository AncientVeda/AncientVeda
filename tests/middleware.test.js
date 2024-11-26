const request = require('supertest');
const app = require('../server'); // Adjust path as per your project structure

describe('Middleware Tests', () => {
    test('should have CORS headers', async () => {
        const res = await request(app).get('/api/items');
        expect(res.headers['access-control-allow-origin']).toBe('*');
    });
});

