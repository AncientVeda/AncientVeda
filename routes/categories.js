const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

// Hole alle Kategorien
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

// Erstelle eine neue Kategorie
router.post(
  '/',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Kategoriename ist erforderlich'),
    body('description').optional().isString().withMessage('Beschreibung muss ein Text sein'),
    body('parent_category_id')
      .optional()
      .isMongoId()
      .withMessage('Ungültige ID für übergeordnete Kategorie'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Ungültige Eingabedaten', errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Nur Admins dürfen Kategorien hinzufügen.' });
    }

    try {
      const parentCategoryId = req.body.parent_category_id || null;

      // Übergeordnete Kategorie validieren (falls angegeben)
      if (parentCategoryId) {
        const parentCategory = await Category.findById(parentCategoryId);
        if (!parentCategory) {
          return res.status(400).json({ message: 'Übergeordnete Kategorie nicht gefunden.' });
        }
      }

      const category = new Category({
        name: req.body.name,
        description: req.body.description,
        parent_category_id: parentCategoryId,
      });

      const newCategory = await category.save();
      res.status(201).json(newCategory);
    } catch (err) {
      next(err);
    }
  }
);

// Aktualisiere eine Kategorie
router.put('/:id', authenticateToken, [
  body('name').optional().isString().withMessage('Name muss ein Text sein'),
  body('description').optional().isString().withMessage('Beschreibung muss ein Text sein'),
  body('parent_category_id')
    .optional()
    .isMongoId()
    .withMessage('Ungültige ID für übergeordnete Kategorie'),
], async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Nur Admins dürfen Kategorien bearbeiten.' });
  }

  try {
    const parentCategoryId = req.body.parent_category_id || null;

    // Übergeordnete Kategorie validieren (falls angegeben)
    if (parentCategoryId) {
      const parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Übergeordnete Kategorie nicht gefunden.' });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Kategorie nicht gefunden.' });
    }

    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: 'Ungültige Eingabedaten', error: err.message });
  }
});

// Lösche eine Kategorie
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Nur Admins dürfen Kategorien löschen.' });
  }

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

// Fehlerbehandlungs-Middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
});

module.exports = router;

