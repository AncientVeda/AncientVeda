const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authenticateToken = require('../middleware/authenticateToken');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           description: Die ID der zugehörigen Bestellung.
 *         amount:
 *           type: number
 *           description: Der zu zahlende Betrag.
 *         paymentMethod:
 *           type: string
 *           description: Die Zahlungsmethode (z. B. Kreditkarte, PayPal).
 *         status:
 *           type: string
 *           enum:
 *             - success
 *             - failed
 *           description: Der Status der Zahlung.
 *         userId:
 *           type: string
 *           description: Die ID des Benutzers, der die Zahlung durchgeführt hat.
 */

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Endpunkte zur Zahlungsabwicklung
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Verarbeitet eine Zahlung für eine Bestellung.
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
 *               orderId:
 *                 type: string
 *                 description: Die ID der Bestellung.
 *               amount:
 *                 type: number
 *                 description: Der Zahlungsbetrag.
 *               paymentMethod:
 *                 type: string
 *                 description: Die verwendete Zahlungsmethode.
 *     responses:
 *       201:
 *         description: Zahlung erfolgreich verarbeitet.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Erfolgsmeldung.
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Ungültiger Zahlungsbetrag oder Bestellung nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.post('/', authenticateToken, async (req, res) => {
    const { orderId, amount, paymentMethod } = req.body;

    try {
        // Bestellung prüfen
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Bestellung nicht gefunden.' });
        }

        // Betrag validieren
        if (order.total_price !== amount) {
            return res.status(400).json({ message: 'Ungültiger Zahlungsbetrag.' });
        }

        // Zahlung erstellen
        const payment = new Payment({
            orderId,
            amount,
            paymentMethod,
            status: 'success',
            userId: req.user.userId,
        });

        const savedPayment = await payment.save();

        // Bestellstatus aktualisieren
        order.status = 'paid';
        await order.save();

        // Warenkorb des Benutzers leeren
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (cart) {
            cart.items = []; // Alle Artikel entfernen
            await cart.save(); // Änderungen speichern
        }

        // Erfolgreiche Antwort
        res.status(201).json({
            message: 'Zahlung erfolgreich verarbeitet und Warenkorb geleert.',
            payment: savedPayment,
        });
    } catch (err) {
        console.error('Fehler beim Verarbeiten der Zahlung:', err.message);
        res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
    }
});

module.exports = router;

