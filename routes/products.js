const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

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
 *       400:
 *         description: Ungültige Eingabe.
 *       403:
 *         description: Keine Berechtigung.
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
      return res.status(400).json({ message: 'Ungültige Eingabedaten', errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Nur Admins dürfen Produkte hinzufügen.' });
    }

    try {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Kategorie existiert nicht.' });
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
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Ruft ein einzelnes Produkt anhand seiner ID ab.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Produkts.
 *     responses:
 *       200:
 *         description: Details des Produkts.
 *       404:
 *         description: Produkt nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Produkt nicht gefunden' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Aktualisiert ein Produkt.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des zu aktualisierenden Produkts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Produkt erfolgreich aktualisiert.
 *       400:
 *         description: Ungültige Eingabe.
 *       403:
 *         description: Keine Berechtigung.
 *       404:
 *         description: Produkt nicht gefunden.
 */
router.put(
  '/:id',
  authenticateToken,
  [
    body('name').optional().notEmpty().withMessage('Produktname darf nicht leer sein'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Preis muss größer als 0 sein'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Lagerbestand muss mindestens 0 sein'),
    body('category').optional().isMongoId().withMessage('Ungültige Kategorie-ID'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Ungültige Eingabedaten', errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Nur Admins dürfen Produkte bearbeiten.' });
    }

    try {
      if (req.body.category) {
        const categoryExists = await Category.findById(req.body.category);
        if (!categoryExists) {
          return res.status(400).json({ message: 'Kategorie existiert nicht.' });
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Produkt nicht gefunden' });
      }
      res.json({
        message: 'Produkt erfolgreich aktualisiert.',
        product: updatedProduct,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Löscht ein Produkt anhand seiner ID.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Produkts.
 *     responses:
 *       200:
 *         description: Produkt erfolgreich gelöscht.
 *       404:
 *         description: Produkt nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produkt nicht gefunden' });
    }
    res.json({ message: 'Produkt erfolgreich gelöscht' });
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
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
 *         description: Suchbegriff.
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
 *         description: Seite.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Ergebnisse pro Seite.
 *     responses:
 *       200:
 *         description: Gefilterte Produkte.
 *       500:
 *         description: Interner Serverfehler.
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
    if (price_min) filters.price = { ...filters.price, $gte: parseFloat(price_min) };
    if (price_max) filters.price = { ...filters.price, $lte: parseFloat(price_max) };
    if (stock) filters.stock = { $gte: parseInt(stock, 10) };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const products = await Product.find(filters)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('category', 'name')
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

