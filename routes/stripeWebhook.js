const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe SDK
const Payment = require('../models/Payment'); // Dein Payment-Modell

// Webhook-Route
router.post(
  '/',
  express.raw({ type: 'application/json' }), // rawBody Middleware, notwendig für Stripe
  async (req, res) => {
    const sig = req.headers['stripe-signature']; // Signatur aus Header
    console.log('Stripe Endpoint Secret:', process.env.STRIPE_ENDPOINT_SECRET); // Debug

    try {
      // Validierung des Events mit dem Endpoint-Secret
      const event = stripe.webhooks.constructEvent(
        req.body, // rawBody der Anfrage
        sig, // Signatur aus Header
        process.env.STRIPE_ENDPOINT_SECRET // Signing Secret aus der .env
      );

      console.log('Constructed event:', event); // Debug des validierten Events

      // Prüfe den Event-Typ (z. B. payment_intent.succeeded)
if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;

  console.log('Processing payment_intent.succeeded for:', paymentIntent.id);

  // Suche nach einem bestehenden Payment-Eintrag
  const existingPayment = await Payment.findOne({ transactionId: paymentIntent.id });

  if (existingPayment) {
    console.log('Found existing payment:', existingPayment);
    // Aktualisiere den Status auf 'succeeded'
    existingPayment.status = 'succeeded';
    await existingPayment.save(); // Änderungen speichern
    console.log('Payment updated to succeeded:', existingPayment);
  } else {
    console.log('No existing payment found. Creating new one...');
    // Erstelle einen neuen Eintrag, wenn keiner existiert
    await Payment.create({
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      userId: paymentIntent.metadata.userId,
      status: 'succeeded',
    });
    console.log('New payment created with status succeeded.');
  }
}

      res.status(200).send('Webhook erfolgreich verarbeitet');
    } catch (err) {
      // Fehlerhandling, falls die Signaturprüfung fehlschlägt oder ein anderer Fehler auftritt
      console.error(`Fehler beim Verarbeiten des Webhooks: ${err.message}`);
      console.error(err.stack);
      res.status(400).send(`Webhook-Fehler: ${err.message}`);
    }
  }
);

module.exports = router;

