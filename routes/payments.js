require('dotenv').config(); // .env-Datei laden
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe-API-Schlüssel
const authenticateToken = require('../middleware/authenticateToken'); // Middleware für Token-Authentifizierung
const Payment = require('../models/Payment'); // Mongoose-Modell für Zahlungen
const logger = require('../utils/logger'); // Logging

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Endpunkte für Zahlungsabwicklung
 */

/**
 * @swagger
 * /payments/create:
 *   post:
 *     summary: Erstelle eine neue Zahlung
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Betrag der Zahlung (in Cent)
 *                 example: 5000
 *               currency:
 *                 type: string
 *                 description: Währung der Zahlung (z. B. USD)
 *                 example: USD
 *     responses:
 *       201:
 *         description: Zahlung erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabedaten
 *       500:
 *         description: Fehler beim Erstellen der Zahlung
 */
router.post('/create', authenticateToken, async (req, res) => {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
        return res.status(400).json({ error: 'Betrag und Währung sind erforderlich.' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: { userId: req.user.userId },
        });

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

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Hole alle Zahlungen eines Nutzers
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreich alle Zahlungen abgerufen
 *       500:
 *         description: Fehler beim Abrufen der Zahlungen
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.userId }).sort({ created_at: -1 });
        res.status(200).json(payments);
    } catch (error) {
        logger.error(`Fehler beim Abrufen der Zahlungen: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Abrufen der Zahlungen', details: error.message });
    }
});

/**
 * @swagger
 * /payments/{paymentId}/status:
 *   get:
 *     summary: Hole den Status einer bestimmten Zahlung
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Zahlung
 *     responses:
 *       200:
 *         description: Zahlungsstatus erfolgreich abgerufen
 *       404:
 *         description: Zahlung nicht gefunden
 *       500:
 *         description: Fehler beim Abrufen des Zahlungsstatus
 */
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

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Webhook zur Verarbeitung von Stripe-Ereignissen
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook erfolgreich verarbeitet
 *       400:
 *         description: Fehler bei der Webhook-Verarbeitung
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

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

