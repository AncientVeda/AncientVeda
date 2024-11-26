const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: Die ID des Produkts.
 *         quantity:
 *           type: integer
 *           description: Die Anzahl der Produkte.
 *     Cart:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: Die ID des Benutzers.
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         discountCode:
 *           type: string
 *           description: Rabattcode, falls angewendet.
 *         discountAmount:
 *           type: number
 *           description: Rabattbetrag.
 *         totalPrice:
 *           type: number
 *           description: Gesamtpreis des Warenkorbs nach Rabatt.
 */

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Endpunkte für den Warenkorb
 */

/**
 * @swagger
 * /cart/trigger-error:
 *   get:
 *     summary: Löst einen Testfehler aus.
 *     tags: [Cart]
 *     responses:
 *       500:
 *         description: Testfehler ausgelöst.
 */
router.get('/trigger-error', (req, res, next) => {
  throw new Error('Dies ist ein Testfehler für Sentry!');
});

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Fügt ein Produkt in den Warenkorb hinzu.
 *     tags: [Cart]
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
 *                 description: Die Anzahl der hinzuzufügenden Produkte.
 *     responses:
 *       201:
 *         description: Produkt erfolgreich zum Warenkorb hinzugefügt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Ungültige Eingabe.
 *       404:
 *         description: Produkt nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.post('/', authenticateToken, async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
        logger.warn('Invalid productId or quantity.', { userId: req.user.userId });
        return res.status(400).json({ message: 'Product ID and a positive quantity are required.' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            logger.warn('Product not found.', { productId });
            return res.status(404).json({ message: 'Product not found.' });
        }

        let cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) {
            cart = new Cart({ userId: req.user.userId, items: [] });
        }

        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
            logger.info('Updated quantity for existing product in cart.', { productId, quantity });
        } else {
            cart.items.push({ productId, quantity });
            logger.info('Added new product to cart.', { productId, quantity });
        }

        await cart.save();
        res.status(201).json({ message: 'Product successfully added to the cart.', cart });
    } catch (error) {
        logger.error('Error adding product to the cart.', { error: error.message });
        res.status(500).json({ message: 'Internal Server Error.' });
    }
});
/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Ruft den aktuellen Warenkorb des Benutzers ab.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe des Warenkorbs.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Kein Warenkorb gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId', 'name price');

        if (!cart || cart.items.length === 0) {
            logger.info('Empty cart retrieved.', { userId: req.user.userId });
            return res.status(200).json({ message: 'Your cart is empty.' });
        }

        const totalPrice = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);

        res.json({
            userId: cart.userId,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                quantity: item.quantity,
                total: item.productId.price * item.quantity,
            })),
            totalPrice,
        });
    } catch (error) {
        logger.error('Error retrieving cart.', { error: error.message });
        res.status(500).json({ message: 'Internal Server Error.' });
    }
});
/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Leert den gesamten Warenkorb.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warenkorb erfolgreich geleert.
 *       404:
 *         description: Kein Warenkorb gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.delete('/', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) {
            logger.warn('Cart not found.', { userId: req.user.userId });
            return res.status(404).json({ message: 'Cart not found.' });
        }

        cart.items = [];
        await cart.save();
        logger.info('Cart successfully cleared.', { userId: req.user.userId });
        res.status(200).json({ message: 'Cart successfully cleared.' });
    } catch (error) {
        logger.error('Error clearing cart.', { error: error.message });
        res.status(500).json({ message: 'Internal Server Error.' });
    }
});



router.delete('/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            return res.status(404).json({ message: 'Warenkorb nicht gefunden.' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Artikel nicht im Warenkorb gefunden.' });
        }

        cart.items.splice(itemIndex, 1); // Entferne das Item
        await cart.save();

        res.status(200).json({ message: 'Produkt erfolgreich entfernt.', cart });
    } catch (error) {
        res.status(500).json({ message: 'Interner Serverfehler.', error: error.message });
    }
});

module.exports = router;

