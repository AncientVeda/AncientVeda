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

// GET /orders - Ruft alle Bestellungen ab
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

// POST /orders - Erstellt eine neue Bestellung
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        message: 'Ihr Warenkorb ist leer. Bestellung kann nicht erstellt werden.',
      });
    }

    let totalPrice = 0;
    for (const item of cart.items) {
      if (!item.productId || !item.productId.price) {
        return res.status(400).json({ message: 'Produktpreis fehlt für ein Artikel.' });
      }
      totalPrice += item.quantity * item.productId.price;
    }

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

// DELETE /orders/:productId - Entfernt ein Produkt aus dem Warenkorb
router.delete('/:productId', authenticateToken, async (req, res) => {
  const productId = req.params.productId;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Ungültige Produkt-ID.' });
  }

  try {
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

// PUT /orders - Aktualisiert die Menge eines Produkts im Warenkorb
router.put('/', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Ungültige Produkt-ID.' });
  }

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

// DELETE /orders - Leert den gesamten Warenkorb
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

