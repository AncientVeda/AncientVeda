const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product'); // Dein Product-Modell
const authenticateToken = require('../middleware/authenticateToken');
const mongoose = require('mongoose');
const Address = require('../models/DeliveryAddress'); // Importiere das Address-Modell

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
 *     summary: Ruft alle Bestellungen ab
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eine Liste von Bestellungen.
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
 *     summary: Erstellt eine neue Bestellung
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
 *         description: Leerer Warenkorb oder fehlende Preise.
 *       500:
 *         description: Interner Serverfehler.
 */

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, street, postalCode, city, country } = req.body;

    // Validierung der Lieferadresse
    if (!fullName || !street || !postalCode || !city || !country) {
      return res.status(400).json({ message: 'Lieferdetails sind erforderlich.' });
    }

    // Warenkorb abrufen
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: 'Ihr Warenkorb ist leer. Bestellung kann nicht erstellt werden.' });
    }

    // Gesamtpreis berechnen
    let totalPrice = 0;
    for (const item of cart.items) {
      if (!item.productId || !item.productId.price) {
        return res.status(400).json({ message: 'Produktpreis fehlt für ein Artikel.' });
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

    // Lieferadresse speichern und mit der Bestellung verknüpfen
    const address = new Address({
      orderId: order._id,
      fullName,
      street,
      postalCode,
      city,
      country,
    });

    await address.save();

    // Warenkorb löschen
    await Cart.deleteOne({ userId });

    res.status(201).json({
      message: 'Bestellung und Lieferadresse erfolgreich erstellt.',
      order,
      address,
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
 *     summary: Entfernt ein Produkt aus dem Warenkorb
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Produkts.
 *     responses:
 *       200:
 *         description: Produkt entfernt.
 *       400:
 *         description: Ungültige Produkt-ID.
 *       404:
 *         description: Produkt oder Warenkorb nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
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


/**
 * @swagger
 * /orders:
 *   delete:
 *     summary: Leert den gesamten Warenkorb
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warenkorb geleert.
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

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).populate('items.productId', 'name'); // Produktnamen abrufen
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Keine Bestellungen gefunden.' });
    }

    // Bestellungen mit lesbaren Daten zurückgeben
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items.map((item) => ({
        name: item.productId.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }));
    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Fehler beim Abrufen der Bestellungen:', error);
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Bestellung nicht gefunden.' });
        }

        order.status = status || order.status;
        await order.save();

        res.status(200).json({ message: 'Bestellung aktualisiert.', order });
    } catch (err) {
        console.error('Fehler beim Aktualisieren der Bestellung:', err.message);
        res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
    }
});

// Route: Top 3 meistbestellte Produkte
router.get('/top-products', async (req, res) => {
  try {
    // Aggregation: Zähle, wie oft jedes Produkt bestellt wurde
    const topProducts = await Order.aggregate([
      { $unwind: "$items" }, // Entpacke das Items-Array
      { 
        $group: { 
          _id: "$items.productId", // Gruppiere nach productId
          totalOrders: { $sum: "$items.quantity" } // Summiere die Mengen
        } 
      },
      { $sort: { totalOrders: -1 } }, // Sortiere nach Bestellhäufigkeit (absteigend)
      { $limit: 3 } // Begrenze auf die Top 3 Produkte
    ]);

    // Hole die Produktdetails basierend auf den Top-IDs
    const productIds = topProducts.map((item) => item._id);
    const products = await Product.find({ _id: { $in: productIds } });

    res.json(products); // Rückgabe der Produktdetails
  } catch (err) {
    console.error('Fehler beim Abrufen der Top-Produkte:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Top-Produkte' });
  }
});


module.exports = router;

