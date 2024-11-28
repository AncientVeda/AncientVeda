const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe API-Schlüssel aus der .env-Datei
const Payment = require('../models/Payment'); // Mongoose-Modell für Zahlungen

// Middleware für Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        // Webhook-Event von Stripe validieren
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET // Webhook-Secret aus der .env-Datei
        );

        // Unterschiedliche Webhook-Typen behandeln
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('Zahlung erfolgreich:', paymentIntent);

                // Speicherung der erfolgreichen Zahlung in der Datenbank
                const newPayment = new Payment({
                    stripePaymentId: paymentIntent.id,
                    amount: paymentIntent.amount_received,
                    currency: paymentIntent.currency,
                    status: paymentIntent.status,
                    created: new Date(paymentIntent.created * 1000), // Timestamp in Datum konvertieren
                });
                await newPayment.save();
                console.log('Zahlung in der Datenbank gespeichert:', newPayment);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.error('Zahlung fehlgeschlagen:', paymentIntent);

                // Optionale Speicherung oder Handling für fehlgeschlagene Zahlungen
                break;
            }

            case 'charge.refunded': {
                const refund = event.data.object;
                console.log('Erstattung erfolgt:', refund);

                // Logik für Erstattungen implementieren
                break;
            }

            default:
                console.log(`Unbehandelter Event-Typ: ${event.type}`);
        }

        // Erfolgsantwort an Stripe
        res.status(200).send('Webhook erfolgreich verarbeitet');
    } catch (err) {
        console.error(`Fehler beim Verarbeiten des Webhooks: ${err.message}`);
        res.status(400).send(`Webhook-Fehler: ${err.message}`);
    }
});

module.exports = router;

