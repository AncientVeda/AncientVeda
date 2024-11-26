const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const authenticateToken = require('../middleware/authenticateToken');
const logger = require('../utils/logger');

// Middleware: Nur Admins
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        logger.warn(`Zugriffsversuch durch Nicht-Admin: ${req.user.userId}`);
        return res.status(403).json({ message: 'Zugriff verweigert: Nur für Admins!' });
    }
    next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name des Produkts.
 *         price:
 *           type: number
 *           description: Preis des Produkts.
 *         description:
 *           type: string
 *           description: Beschreibung des Produkts.
 *         category:
 *           type: string
 *           description: Die ID der zugehörigen Kategorie.
 *         stock:
 *           type: number
 *           description: Verfügbarkeit im Lager.
 *     Category:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name der Kategorie.
 *         description:
 *           type: string
 *           description: Beschreibung der Kategorie.
 *         parent_category_id:
 *           type: string
 *           description: Die ID der übergeordneten Kategorie.
 */

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-spezifische Endpunkte für Produkte, Kategorien und Statistiken
 */




/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Ruft Admin-Statistiken ab.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe von Statistiken.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: integer
 *                   description: Gesamtanzahl der Bestellungen.
 *                 totalRevenue:
 *                   type: number
 *                   description: Gesamteinnahmen aller Bestellungen.
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productName:
 *                         type: string
 *                         description: Name des Produkts.
 *                       totalSold:
 *                         type: integer
 *                         description: Anzahl der verkauften Einheiten.
 *                 totalUsers:
 *                   type: integer
 *                   description: Gesamtanzahl der Benutzer.
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// --- Statistiken ---
// Statistiken abrufen
router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.productId", totalSold: { $sum: "$items.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            { $project: { _id: 0, productName: "$productDetails.name", totalSold: 1 } }
        ]);
        const totalUsers = await User.countDocuments();

        logger.info("Statistiken erfolgreich abgerufen.");
        res.json({
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            topProducts,
            totalUsers
        });
    } catch (err) {
        logger.error(`Fehler beim Abrufen der Statistiken: ${err.message}`);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});



/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Fügt ein neues Produkt hinzu (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name des Produkts.
 *                 example: "Kaffeemaschine"
 *               price:
 *                 type: number
 *                 description: Preis des Produkts.
 *                 example: 99.99
 *               description:
 *                 type: string
 *                 description: Beschreibung des Produkts.
 *                 example: "Hochwertige Kaffeemaschine mit Filterfunktion."
 *               category:
 *                 type: string
 *                 description: Kategorie-ID des Produkts.
 *                 example: "64a8b070c5d4c2001a2c3a45"
 *               stock:
 *                 type: number
 *                 description: Verfügbarkeit im Lager.
 *                 example: 50
 *     responses:
 *       201:
 *         description: Produkt erfolgreich hinzugefügt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// --- Produkte ---
// Produkt hinzufügen
router.post('/products', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { name, price, description, category, stock } = req.body;
        const product = new Product({ name, price, description, category, stock });
        const savedProduct = await product.save();
        logger.info(`Produkt hinzugefügt: ${savedProduct._id}`);
        res.status(201).json(savedProduct);
    } catch (error) {
        logger.error(`Fehler beim Hinzufügen des Produkts: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Hinzufügen des Produkts', error: error.message });
    }
});


/**
 * @swagger
 * /admin/products/{productId}:
 *   put:
 *     summary: Bearbeitet ein bestehendes Produkt (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des zu bearbeitenden Produkts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Neuer Name des Produkts.
 *                 example: "Neue Kaffeemaschine"
 *               price:
 *                 type: number
 *                 description: Neuer Preis des Produkts.
 *                 example: 89.99
 *               description:
 *                 type: string
 *                 description: Neue Beschreibung des Produkts.
 *                 example: "Aktualisierte Beschreibung für das Produkt."
 *               category:
 *                 type: string
 *                 description: Neue Kategorie-ID des Produkts.
 *                 example: "64a8b070c5d4c2001a2c3a45"
 *               stock:
 *                 type: number
 *                 description: Neue Verfügbarkeit im Lager.
 *                 example: 30
 *     responses:
 *       200:
 *         description: Produkt erfolgreich bearbeitet.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produkt nicht gefunden.
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// Produkt bearbeiten
router.put('/products/:productId', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { productId } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Produkt nicht gefunden' });
        }
        logger.info(`Produkt bearbeitet: ${productId}`);
        res.json(updatedProduct);
    } catch (error) {
        logger.error(`Fehler beim Bearbeiten des Produkts: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Bearbeiten des Produkts', error: error.message });
    }
});


/**
 * @swagger
 * /admin/products/{productId}:
 *   delete:
 *     summary: Löscht ein Produkt (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des zu löschenden Produkts.
 *     responses:
 *       200:
 *         description: Produkt erfolgreich gelöscht.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Produkt erfolgreich gelöscht"
 *       404:
 *         description: Produkt nicht gefunden.
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// Produkt löschen
router.delete('/products/:productId', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { productId } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Produkt nicht gefunden' });
        }
        logger.info(`Produkt gelöscht: ${productId}`);
        res.json({ message: 'Produkt erfolgreich gelöscht' });
    } catch (error) {
        logger.error(`Fehler beim Löschen des Produkts: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Löschen des Produkts', error: error.message });
    }
});

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Ruft eine Liste aller Produkte ab (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe der Produkte.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// Produkte auflisten
router.get('/products', authenticateToken, adminOnly, async (req, res) => {
    try {
        const products = await Product.find();
        logger.info('Produkte erfolgreich abgerufen.');
        res.json(products);
    } catch (error) {
        logger.error(`Fehler beim Abrufen der Produkte: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Abrufen der Produkte', error: error.message });
    }
});
/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Fügt eine neue Kategorie hinzu (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name der Kategorie.
 *                 example: "Elektronik"
 *               description:
 *                 type: string
 *                 description: Beschreibung der Kategorie.
 *                 example: "Alle Arten von elektronischen Geräten."
 *               parent_category_id:
 *                 type: string
 *                 description: ID der übergeordneten Kategorie (optional).
 *                 example: "64a8b070c5d4c2001a2c3a45"
 *     responses:
 *       201:
 *         description: Kategorie erfolgreich hinzugefügt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// --- Kategorien ---
// Kategorie hinzufügen
router.post('/categories', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { name, description, parent_category_id } = req.body;
        const category = new Category({ name, description, parent_category_id });
        const savedCategory = await category.save();
        logger.info(`Kategorie hinzugefügt: ${savedCategory._id}`);
        res.status(201).json(savedCategory);
    } catch (error) {
        logger.error(`Fehler beim Hinzufügen der Kategorie: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Hinzufügen der Kategorie', error: error.message });
    }
});

/**
 * @swagger
 * /admin/categories/{categoryId}:
 *   put:
 *     summary: Bearbeitet eine bestehende Kategorie (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID der zu bearbeitenden Kategorie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Neuer Name der Kategorie.
 *                 example: "Aktualisierte Kategorie"
 *               description:
 *                 type: string
 *                 description: Neue Beschreibung der Kategorie.
 *                 example: "Aktualisierte Beschreibung."
 *               parent_category_id:
 *                 type: string
 *                 description: ID der neuen übergeordneten Kategorie (optional).
 *                 example: "64a8b070c5d4c2001a2c3a45"
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich bearbeitet.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Kategorie nicht gefunden.
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// Kategorie bearbeiten
router.put('/categories/:categoryId', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, req.body, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Kategorie nicht gefunden' });
        }
        logger.info(`Kategorie bearbeitet: ${categoryId}`);
        res.json(updatedCategory);
    } catch (error) {
        logger.error(`Fehler beim Bearbeiten der Kategorie: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Bearbeiten der Kategorie', error: error.message });
    }
});

/**
 * @swagger
 * /admin/categories/{categoryId}:
 *   delete:
 *     summary: Löscht eine bestehende Kategorie (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID der zu löschenden Kategorie.
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich gelöscht.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kategorie erfolgreich gelöscht"
 *       404:
 *         description: Kategorie nicht gefunden.
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// Kategorie löschen
router.delete('/categories/:categoryId', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Kategorie nicht gefunden' });
        }
        logger.info(`Kategorie gelöscht: ${categoryId}`);
        res.json({ message: 'Kategorie erfolgreich gelöscht' });
    } catch (error) {
        logger.error(`Fehler beim Löschen der Kategorie: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Löschen der Kategorie', error: error.message });
    }
});

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Ruft eine Liste aller Kategorien ab (nur für Admins).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe der Kategorien.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       403:
 *         description: Zugriff verweigert (nur für Admins).
 *       500:
 *         description: Interner Serverfehler.
 */

// Kategorien auflisten
router.get('/categories', authenticateToken, adminOnly, async (req, res) => {
    try {
        const categories = await Category.find();
        logger.info('Kategorien erfolgreich abgerufen.');
        res.json(categories);
    } catch (error) {
        logger.error(`Fehler beim Abrufen der Kategorien: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Abrufen der Kategorien', error: error.message });
    }
});

module.exports = router;

