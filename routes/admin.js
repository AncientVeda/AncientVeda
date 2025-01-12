const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const DeliveryAddress = require('../models/DeliveryAddress'); // Dein DeliveryAddress-Schema
const Discount = require('../models/Discount');
const authenticateToken = require('../middleware/authenticateToken');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });



// Middleware: Nur Admins
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        logger.warn(`Zugriffsversuch durch Nicht-Admin: ${req.user.userId}`);
        return res.status(403).json({ message: 'Zugriff verweigert: Nur für Admins!' });
    }
    next();
};

// Admin Dashboard: Zusammenführung der Informationen
router.get('/dashboard', authenticateToken, adminOnly, async (req, res) => {
  try {
    // Nur relevante Payments (Used Status)
    const payments = await Payment.find({ status: 'succeeded' });

    // IDs von zugehörigen Orders und Usern extrahieren
    const orderIds = payments.map((payment) => payment._id);
    const userIds = payments.map((payment) => payment.userId);

    // Alle relevanten Orders laden
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('userId', 'name email') // Benutzerinfo hinzufügen
      .populate('items.productId', 'name price'); // Produktdetails hinzufügen

    // Alle relevanten Lieferadressen laden
    const deliveryAddresses = await DeliveryAddress.find({ orderId: { $in: orderIds } })
      .populate('userId', 'name email'); // Benutzerinfo hinzufügen

    // Zusammenführen der Daten
    const dashboardData = payments.map((payment) => {
      const relatedOrder = orders.find((order) => order._id.equals(payment._id));
      const relatedAddress = deliveryAddresses.find((address) => address.orderId.equals(payment._id));

      return {
        payment,
        order: relatedOrder || null,
        deliveryAddress: relatedAddress || null,
        user: relatedOrder ? relatedOrder.userId : null,
      };
    });

    res.json(dashboardData);
  } catch (err) {
    console.error('Fehler beim Abrufen des Dashboards:', err);
    res.status(500).json({ message: 'Fehler beim Abrufen des Dashboards', error: err.message });
  }
});

module.exports = router;


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
// POST: Neues Produkt hinzufügen
router.post(
  '/products',
  authenticateToken,
  upload.single('image'), // Multer-Middleware für den Upload eines einzelnen Bildes
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
 
      // Neues Produkt erstellen
         const productData = {
        name: req.body.name,
        price: req.body.price,
        stock: req.body.stock,
        category: req.body.category,
        description: req.body.description || '',
        images: req.file ? [`/uploads/${req.file.filename}`] : [], // Bild-URL speichern
      };
  
      const product = new Product(productData);
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
        console.log('Produkte aus der Datenbank:', products); // Log zur Überprüfung
        res.json(products);
    } catch (error) {
        console.error(`Fehler beim Abrufen der Produkte: ${error.message}`);
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

router.post(
  '/categories',
  authenticateToken,
  adminOnly,
  upload.single('image'), // Middleware für Datei-Upload
  [
    body('name').notEmpty().withMessage('Der Name der Kategorie ist erforderlich'),
    body('description').optional().isString().withMessage('Beschreibung muss ein String sein'),
    body('parent_category_id')
      .optional()
      .custom((value) => mongoose.isValidObjectId(value) || value === null)
      .withMessage('Ungültige ID für übergeordnete Kategorie'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Ungültige Eingabedaten', errors: errors.array() });
    }

    try {
      const { name, description, parent_category_id } = req.body;

      // Bildpfad aus Multer
      const image = req.file ? `/uploads/categories/${req.file.filename}` : '';

      const category = new Category({
        name,
        description,
        parent_category_id,
        image,
      });

      const savedCategory = await category.save();
      logger.info(`Kategorie hinzugefügt: ${savedCategory._id}`);
      res.status(201).json(savedCategory);
    } catch (error) {
      logger.error(`Fehler beim Hinzufügen der Kategorie: ${error.message}`);
      res.status(500).json({ message: 'Fehler beim Hinzufügen der Kategorie', error: error.message });
    }
  }
);


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
// Kategorien auflisten
router.get('/categories', authenticateToken, adminOnly, async (req, res) => {
    try {
        const categories = await Category.find();

        // Vollständige URL für Bilder hinzufügen
        const updatedCategories = categories.map((category) => ({
            ...category._doc,
            image: category.image ? `${process.env.BASE_URL || 'http://localhost:5001'}/${category.image}` : null,
        }));

        logger.info('Kategorien erfolgreich abgerufen.');
        res.json(updatedCategories);
    } catch (error) {
        logger.error(`Fehler beim Abrufen der Kategorien: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Abrufen der Kategorien', error: error.message });
    }
});

// Route: Alle Bestellungen abrufen
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email') // Benutzername und E-Mail laden
      .populate('items.productId', 'name price'); // Produktdetails laden
    res.json(orders);
  } catch (err) {
    console.error('Fehler beim Abrufen der Bestellungen:', err);
    res.status(500).json({ message: 'Fehler beim Abrufen der Bestellungen', error: err.message });
  }
});

// Route: Zahlungen abrufen
router.get('/payments', authenticateToken, async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'name email') // Benutzername und E-Mail laden
            .sort({ created_at: -1 }); // Nach Erstellungsdatum sortieren
        res.json(payments);
    } catch (err) {
        console.error('Fehler beim Abrufen der Zahlungen:', err.message);
        res.status(500).json({ message: 'Fehler beim Abrufen der Zahlungen', error: err.message });
    }
});


// Alle Benutzer abrufen
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, 'name email address city zipCode phone birthDate role created_at');
        res.json(users);
    } catch (error) {
        console.error(`Fehler beim Abrufen der Benutzer: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer', error: error.message });
    }
});


// Alle Lieferadressen abrufen
router.get('/delivery-addresses', authenticateToken, adminOnly, async (req, res) => {
    try {
        const addresses = await DeliveryAddress.find()
            .populate('userId', 'name email') // Benutzername und E-Mail
            .populate('orderId', '_id total_price status'); // Bestellnummer, Preis und Status
        
        console.log('Lieferadressen:', JSON.stringify(addresses, null, 2)); // Debugging
        
        res.json(addresses);
    } catch (error) {
        console.error(`Fehler beim Abrufen der Lieferadressen: ${error.message}`);
        res.status(500).json({ message: 'Fehler beim Abrufen der Lieferadressen', error: error.message });
    }
});

// Route: Neue Rabattaktion erstellen
// Discounts abrufen
router.get('/discounts', authenticateToken, adminOnly, async (req, res) => {
  try {
    const discounts = await Discount.find();
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Abrufen der Rabatte', error: err.message });
  }
});

// Rabatt hinzufügen
router.post('/discounts', authenticateToken, adminOnly, async (req, res) => {
  const { code, discountType, value, expirationDate, usageLimit } = req.body;

  try {
    const newDiscount = new Discount({
      code,
      discountType,
      value,
      expirationDate,
      usageLimit,
    });
    await newDiscount.save();
    res.status(201).json({ message: 'Rabatt erfolgreich hinzugefügt', discount: newDiscount });
  } catch (err) {
    res.status(400).json({ message: 'Fehler beim Hinzufügen des Rabatts', error: err.message });
  }
});
module.exports = router;

