const request = require('supertest');
const app = require('../app'); // Deine Express-App
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe SDK
const Payment = require('../models/Payment'); // Mongoose-Modell
const mongoose = require('mongoose');

// Mock für Stripe Webhook-Secret
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Stripe Webhook Endpoint', () => {
  it('should handle payment_intent.succeeded event', async () => {
    // Beispiel Payload für ein erfolgreiches PaymentIntent
    const paymentIntent = {
      id: 'pi_test123',
      amount_received: 2000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
    };

    // Signieren des Payloads mit Stripe-SDK
    const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: paymentIntent } });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: stripeWebhookSecret,
    });

    const res = await request(app)
      .post('/webhook') // Webhook-Route
      .set('Stripe-Signature', signature)
      .send(payload);

    expect(res.status).toBe(200);

    // Überprüfen, ob die Zahlung in der Datenbank gespeichert wurde
    const payment = await Payment.findOne({ stripePaymentId: 'pi_test123' });
    expect(payment).toBeTruthy();
    expect(payment.amount).toBe(2000);
    expect(payment.status).toBe('succeeded');
  });

  it('should handle invalid signature', async () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: {} } });

    const res = await request(app)
      .post('/webhook')
      .set('Stripe-Signature', 'invalid_signature')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Webhook-Fehler');
  });

  it('should handle unknown event types', async () => {
    const payload = JSON.stringify({ type: 'unknown_event_type', data: { object: {} } });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: stripeWebhookSecret,
    });

    const res = await request(app)
      .post('/webhook')
      .set('Stripe-Signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.text).toBe('Webhook erfolgreich verarbeitet');
  });
});

