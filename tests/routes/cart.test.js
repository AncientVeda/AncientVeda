const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../server');
const Cart = require('../../models/Cart');

jest.mock('../../middleware/authenticateToken', () => {
  return jest.fn((req, res, next) => {
    req.user = { userId: '6740a88bb9192f95fc8fa8ba' }; // Mock User ID as String
    next();
  });
});

jest.mock('../../models/Cart', () => {
  return {
    findOne: jest.fn(),
  };
});

describe('Cart Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add an item to the cart', async () => {
    const validToken = 'validtoken';

    const newCartItem = {
      productId: '67407d1b2fae47bcda5c04d1',
      quantity: 2,
    };

    const mockCart = {
      _id: '674241aeff34849812a1a15b', // Use String representation
      userId: '6740a88bb9192f95fc8fa8ba',
      items: [
        {
          productId: '67407d1b2fae47bcda5c04d1',
          quantity: 6, // Updated quantity
        },
      ],
    };

    Cart.findOne.mockResolvedValue({
      ...mockCart,
      save: jest.fn().mockResolvedValue(mockCart), // Mock save-Funktion
    });

    const res = await request(app)
      .post('/cart')
      .send(newCartItem)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'Produkt erfolgreich hinzugefügt.', // Nachricht korrigiert
      cart: mockCart,
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const invalidCartItem = {}; // Fehlende Felder

    const res = await request(app)
      .post('/cart')
      .send(invalidCartItem)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: 'Produkt-ID und positive Menge sind erforderlich.',
    });
  });
});

// Teardown-Prozess für die Verbindung
afterAll(async () => {
  await mongoose.connection.close();
  await new Promise((resolve) => setTimeout(resolve, 500));
});


