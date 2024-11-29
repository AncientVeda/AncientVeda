require('dotenv').config();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const request = require('supertest');
const Payment = require('../models/Payment');
const app = require('../app');

jest.setTimeout(30000); // Timeout auf 30 Sekunden erhöhen

beforeAll(async () => {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // Verbindungsaufbau-Timeout
    socketTimeoutMS: 20000, // Abfrage-Timeout
  });
  console.log('Database connection established:', mongoose.connection.readyState); // 1 = Verbunden
});

beforeEach(async () => {
  console.log('Clearing Payments collection...');
  await Payment.deleteMany({});
  console.log('Inserting test data...');
  await Payment.create({
    userId: mongoose.Types.ObjectId('1234567890abcdef12345678'),
    amount: 2000,
    currency: 'usd',
    status: 'pending',
    transactionId: 'pi_test123',
  });
});

afterEach(async () => {
  console.log('Clearing Payments collection after test...');
  await Payment.deleteMany({});
});

afterAll(async () => {
  console.log('Closing database connection...');
  await mongoose.connection.close();
});

it('sollte ein payment_intent.succeeded Ereignis verarbeiten und Payment speichern', async () => {
  const dynamicTransactionId = `pi_test_${Date.now()}`; // Dynamische transactionId

  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}`, // Dynamischer Event-Name
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: dynamicTransactionId, // Verwende die dynamische ID hier
        amount_received: 2000,
        currency: 'usd',
        status: 'succeeded',
        metadata: { userId: '1234567890abcdef12345678' },
      },
    },
  });

  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_ENDPOINT_SECRET,
  });

  const response = await request(app)
    .post('/webhook')
    .send(payload)
    .set('Stripe-Signature', header)
    .set('Content-Type', 'application/json');

  expect(response.status).toBe(200);

  const payment = await Payment.findOne({ transactionId: dynamicTransactionId }); // Suche mit der dynamischen ID

  expect(payment).toBeTruthy();
  expect(payment.status).toBe('succeeded');
  expect(payment.amount).toBe(2000);
  expect(payment.currency).toBe('usd');
});

