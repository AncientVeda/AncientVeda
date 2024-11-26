const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authenticateToken = require('../middleware/authenticateToken');
const Product = require('../models/Product');
const mongoose = require('mongoose');





/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: Die ID des Produkts.
 *         quantity:
 *           type: integer
 *           description: Die Anzahl der Produkte.
 *         price:
 *           type: number
 *           description: Der Preis pro Stück.
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Die automatisch generierte ID der Bestellung.
 *         userId:
 *           type: string
 *           description: Die ID des Benutzers, der die Bestellung aufgegeben hat.
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalPrice:
 *           type: number
 *           description: Der Gesamtpreis der Bestellung.
 *         status:
 *           type: string
 *           description: Der aktuelle Status der Bestellung (z. B. "pending").
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Datum und Uhrzeit der Erstellung der Bestellung.
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Endpunkte zur Verwaltung von Bestellungen
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Ruft alle Bestellungen ab.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe aller Bestellungen.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       404:
 *         description: Keine Bestellungen gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find();
    } else {
      orders = await Order.find({ userId: req.user.userId });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Keine Bestellungen gefunden.' });
    }

    res.json(orders);
  } catch (err) {
    console.error('Fehler beim Abrufen der Bestellungen:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Erstellt eine neue Bestellung.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Bestellung erfolgreich erstellt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Fehlerhafte Eingabe oder leerer Warenkorb.
 *       500:
 *         description: Interner Serverfehler.
 */
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;

    // Überprüfen, ob der Benutzer eine gültige ID hat
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    // Warenkorb des Benutzers abrufen
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    // Überprüfen, ob der Warenkorb existiert und Artikel enthält
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        message: 'Ihr Warenkorb ist leer. Bestellung kann nicht erstellt werden.',
      });
    }

    // Berechnung des Gesamtpreises
    let totalPrice = 0;
    for (const item of cart.items) {
      if (!item.productId || !item.productId.price) {
        return res.status(400).json({ message: 'Produktpreis fehlt für Item.' });
      }
      totalPrice += item.quantity * item.productId.price;
    }

    // Bestellung erstellen
    const order = new Order({
      userId,
      items: cart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      })),
      total_price: totalPrice,
      status: 'pending',
    });

    await order.save();

    // Warenkorb leeren
    await Cart.deleteOne({ userId });

    res.status(201).json({
      message: 'Bestellung erfolgreich erstellt.',
      order,
    });
  } catch (err) {
    console.error('Fehler beim Erstellen der Bestellung:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});
/**
 * @swagger
 * /orders/{productId}:
 *   delete:
 *     summary: Entfernt ein Produkt aus dem Warenkorb.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Produkts, das entfernt werden soll.
 *     responses:
 *       200:
 *         description: Produkt erfolgreich entfernt.
 *       404:
 *         description: Produkt nicht im Warenkorb gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Warenkorb nicht gefunden.' });
    }

    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    if (initialItemCount === cart.items.length) {
      return res.status(404).json({ message: 'Produkt nicht im Warenkorb gefunden.' });
    }

    await cart.save();

    res.json({ message: 'Produkt erfolgreich aus dem Warenkorb entfernt.', cart });
  } catch (err) {
    console.error('Fehler beim Löschen des Produkts aus dem Warenkorb:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

/**
 * @swagger
 * /orders:
 *   put:
 *     summary: Aktualisiert die Menge eines Produkts im Warenkorb.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Die ID des Produkts.
 *               quantity:
 *                 type: integer
 *                 description: Die neue Menge.
 *     responses:
 *       200:
 *         description: Menge erfolgreich aktualisiert.
 *       404:
 *         description: Produkt oder Warenkorb nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.put('/', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;

  if (quantity <= 0) {
    return res.status(400).json({ message: 'Menge muss größer als 0 sein.' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Warenkorb nicht gefunden.' });
    }

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: 'Produkt nicht im Warenkorb gefunden.' });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ message: 'Produktmenge erfolgreich aktualisiert.', cart });
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Menge:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

/**
 * @swagger
 * /orders:
 *   delete:
 *     summary: Leert den gesamten Warenkorb.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warenkorb erfolgreich geleert.
 *       404:
 *         description: Warenkorb nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Warenkorb nicht gefunden.' });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: 'Warenkorb erfolgreich geleert.' });
  } catch (err) {
    console.error('Fehler beim Leeren des Warenkorbs:', err.message);
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

module.exports = router;

