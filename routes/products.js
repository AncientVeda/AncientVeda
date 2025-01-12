const express = require('express');
const router = express.Router();
const multer = require('multer'); // Multer für Datei-Uploads
const Product = require('../models/Product');
const Category = require('../models/Category');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Zielverzeichnis für Bilder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Eindeutiger Dateiname
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt!'), false);
    }
  },
});
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
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});


//latest
router.get('/latest', async (req, res) => {
    try {
        console.log('Abruf der neuesten Produkte gestartet...');
        const latestProducts = await Product.find()
            .populate('category', 'name')
            .sort({ created_at: -1 })
            .limit(10);
        console.log('Neueste Produkte abgerufen:', latestProducts);
        res.status(200).json(latestProducts);
    } catch (err) {
        console.error('Fehler im /latest-Route:', err.message);
        res.status(500).json({ message: 'Fehler beim Abrufen der neuesten Produkte', error: err.message });
    }
});

router.get("/angebote", async (req, res) => {
  try {
    // ID der Kategorie "Angebote"
    const angeboteCategoryId = "676c40aeada098ed852ce966";

    // Produkte mit der passenden Kategorie-ID abrufen
    const products = await Product.find({ category: angeboteCategoryId });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Keine Produkte in der Kategorie 'Angebote' gefunden." });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Fehler beim Abrufen der Kategorie:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Kategorie.", error: error.message });
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
router.get('/:id', async (req, res) => {
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

