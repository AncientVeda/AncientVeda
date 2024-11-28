require('dotenv').config(); // .env-Datei laden
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe-API-Schlüssel
const authenticateToken = require('../middleware/authenticateToken'); // Middleware für Token-Authentifizierung
const Payment = require('../models/Payment'); // Mongoose-Modell für Zahlungen
const logger = require('../utils/logger'); // Logging

// Route zum Erstellen einer Zahlung
router.post('/create', authenticateToken, async (req, res) => {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
        return res.status(400).json({ error: 'Betrag und Währung sind erforderlich.' });
    }

    try {
        // Erstellen eines PaymentIntents in Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: { userId: req.user.userId },
        });

        // Speicherung der Zahlung in der Datenbank
        const payment = new Payment({
            userId: req.user.userId,
            amount,
            currency,
            status: 'pending',
            transactionId: paymentIntent.id,
        });

        await payment.save();
        logger.info(`Zahlung erstellt: ${payment._id}`);

        res.status(201).json({
            status: 'success',
            clientSecret: paymentIntent.client_secret,
            paymentId: payment._id,
        });
    } catch (error) {
        logger.error(`Fehler beim Erstellen der Zahlung: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Erstellen der Zahlung', details: error.message });
    }
});

// Route zum Abrufen aller Zahlungen eines Nutzers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.userId }).sort({ created_at: -1 });
        res.status(200).json(payments);
    } catch (error) {
        logger.error(`Fehler beim Abrufen der Zahlungen: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Abrufen der Zahlungen', details: error.message });
    }
});

// Route zum Abrufen des Zahlungsstatus
router.get('/:paymentId/status', authenticateToken, async (req, res) => {
    const { paymentId } = req.params;

    try {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Zahlung nicht gefunden' });
        }

        res.status(200).json({ status: payment.status });
    } catch (error) {
        logger.error(`Fehler beim Abrufen des Zahlungsstatus: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Abrufen des Zahlungsstatus', details: error.message });
    }
});

// Route für Stripe-Webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

        // Unterschiedliche Event-Typen behandeln
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const payment = await Payment.findOne({ transactionId: paymentIntent.id });

                if (payment) {
                    payment.status = 'success';
                    await payment.save();
                    logger.info(`Zahlung erfolgreich: ${payment._id}`);
                }
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                const failedPayment = await Payment.findOne({ transactionId: failedIntent.id });

                if (failedPayment) {
                    failedPayment.status = 'failed';
                    await failedPayment.save();
                    logger.warn(`Zahlung fehlgeschlagen: ${failedPayment._id}`);
                }
                break;

            default:
                logger.info(`Unbehandeltes Event: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error(`Webhook-Fehler: ${error.message}`);
        res.status(400).json({ error: 'Webhook-Fehler', details: error.message });
    }
});

module.exports = router;

