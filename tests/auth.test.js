const request = require('supertest');
const app = require('../server'); // Adjust path as per your project structure

describe('Authentication Tests', () => {
    test('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'Test@123',
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    test('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'Test@123',
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});

