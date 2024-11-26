const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Product Model importieren
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: Die automatisch generierte ID des Produkts.
 *         name:
 *           type: string
 *           description: Der Name des Produkts.
 *         price:
 *           type: number
 *           description: Der Preis des Produkts.
 *         stock:
 *           type: integer
 *           description: Der Lagerbestand des Produkts.
 *         category:
 *           type: string
 *           description: Die Kategorie-ID des Produkts.
 *         description:
 *           type: string
 *           description: Eine optionale Beschreibung des Produkts.
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Eine Liste von Bild-URLs für das Produkt.
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Fügt ein neues Produkt hinzu.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Produkt erfolgreich hinzugefügt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ungültige Eingabe.
 *         content:
 *           application/json:
 *             example:
 *               errors:
 *                 - msg: "Produktname ist erforderlich"
 *                   param: "name"
 *                   location: "body"
 *       403:
 *         description: Keine Berechtigung.
 *         content:
 *           application/json:
 *             example:
 *               message: "Nur Admins dürfen Produkte hinzufügen."
 */
router.post(
  '/',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Produktname ist erforderlich'),
    body('price').isFloat({ gt: 0 }).withMessage('Preis muss größer als 0 sein'),
    body('stock').isInt({ min: 0 }).withMessage('Lagerbestand muss mindestens 0 sein'),
    body('category').isMongoId().withMessage('Ungültige Kategorie-ID'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Nur Admins dürfen Produkte hinzufügen.' }); // 403
    }

    try {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Kategorie existiert nicht.' }); // 400
      }

      const product = new Product(req.body);
      const newProduct = await product.save();
      res.status(201).json({
        message: 'Produkt erfolgreich erstellt.',
        product: newProduct,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Ruft alle Produkte ab.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der Produkte.
 *         content:
 *           application/json:
 *             example:
 *               - _id: "12345"
 *                 name: "Produktname"
 *                 price: 19.99
 *                 stock: 50
 *                 category: "KategorieID"
 *                 description: "Produktbeschreibung"
 *                 images: ["image1.jpg", "image2.jpg"]
 *       500:
 *         description: Interner Serverfehler.
 *         content:
 *           application/json:
 *             example:
 *               message: "Interner Serverfehler"
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Durchsucht Produkte mit Filtern.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Suchbegriff für den Produktnamen oder die Beschreibung.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Kategorie-ID.
 *       - in: query
 *         name: price_min
 *         schema:
 *           type: number
 *         description: Mindestpreis.
 *       - in: query
 *         name: price_max
 *         schema:
 *           type: number
 *         description: Maximalpreis.
 *       - in: query
 *         name: stock
 *         schema:
 *           type: integer
 *         description: Mindestbestand.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Seite der Ergebnisse (für Pagination).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Anzahl der Ergebnisse pro Seite.
 *     responses:
 *       200:
 *         description: Gefilterte und paginierte Liste der Produkte.
 *         content:
 *           application/json:
 *             example:
 *               products:
 *                 - _id: "12345"
 *                   name: "Produktname"
 *                   price: 19.99
 *                   stock: 50
 *                   category: "KategorieID"
 *                   description: "Produktbeschreibung"
 *                   images: ["image1.jpg", "image2.jpg"]
 *               totalResults: 100
 *               currentPage: 1
 *               totalPages: 10
 *       500:
 *         description: Interner Serverfehler.
 *         content:
 *           application/json:
 *             example:
 *               message: "Interner Serverfehler"
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, category, price_min, price_max, stock, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (query) {
      filters.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }
    if (category) {
      filters.category = category;
    }
    if (price_min) {
      filters.price = { ...filters.price, $gte: parseFloat(price_min) };
    }
    if (price_max) {
      filters.price = { ...filters.price, $lte: parseFloat(price_max) };
    }
    if (stock) {
      filters.stock = { $gte: parseInt(stock, 10) };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const products = await Product.find(filters)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ price: 1 });

    const totalResults = await Product.countDocuments(filters);

    res.json({
      products,
      totalResults,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalResults / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

module.exports = router;

