const express = require('express');
const router = express.Router();
const multer = require('multer'); // Multer für Datei-Uploads
const mongoose = require('mongoose');
const Category = require('../models/Category');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/categories'); // Zielverzeichnis für Kategorien-Bilder
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

// Route: Hole alle Kategorien
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent_category_id', 'name');

    // Basis-URL korrekt anpassen
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
    const updatedCategories = categories.map((category) => ({
      ...category._doc,
      image: category.image ? `${BASE_URL}/uploads/categories/${category.image}` : null,
    }));

    res.json(updatedCategories);
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

// Route: Erstelle eine neue Kategorie mit Bild
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  [
    body('name').notEmpty().withMessage('Kategoriename ist erforderlich'),
    body('description').optional().isString(),
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
      const imageUrl = req.file ? req.file.filename : null;

      const category = new Category({
        name: req.body.name,
        description: req.body.description || '',
        image: imageUrl,
        parent_category_id: req.body.parent_category_id || null,
      });

      const newCategory = await category.save();
      res.status(201).json(newCategory);
    } catch (err) {
      res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
    }
  }
);

// Route: Aktualisiere eine Kategorie mit Bild
router.put(
  '/:id',
  authenticateToken,
  upload.single('image'),
  [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('parent_category_id')
      .optional()
      .custom((value) => mongoose.isValidObjectId(value) || value === null)
      .withMessage('Ungültige ID für übergeordnete Kategorie'),
  ],
  async (req, res) => {
    try {
      const updatedData = {
        name: req.body.name,
        description: req.body.description,
        parent_category_id: req.body.parent_category_id || null,
      };

      if (req.file) {
        updatedData.image = req.file.filename;
      }

      const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updatedData, {
        new: true,
      });

      if (!updatedCategory) {
        return res.status(404).json({ message: 'Kategorie nicht gefunden.' });
      }

      res.json(updatedCategory);
    } catch (err) {
      res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
    }
  }
);

// Route: Lösche eine Kategorie
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Kategorie nicht gefunden.' });
    }
    res.json({ message: 'Kategorie erfolgreich gelöscht.' });
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});
// Upload-Route
router.post(
    '/upload',
    authenticateToken,
    upload.single('image'), // Middleware für Einzeldatei-Uploads
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Kein Bild hochgeladen.' });
            }
            const imageUrl = `/uploads/categories/${req.file.filename}`;
            res.status(201).json({ message: 'Bild erfolgreich hochgeladen.', imageUrl });
        } catch (err) {
            console.error(`Fehler beim Hochladen des Bildes: ${err.message}`);
            res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
        }
    }
);


module.exports = router;

