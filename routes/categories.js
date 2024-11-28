const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Endpunkte für Kategorienverwaltung
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Hole alle Kategorien
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Liste aller Kategorien
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   parent_category_id:
 *                     type: string
 *       500:
 *         description: Interner Serverfehler
 */
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Interner Serverfehler', error: err.message });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Erstelle eine neue Kategorie
 *     tags: [Categories]
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
 *                 description: Name der Kategorie
 *                 example: Kräuter
 *               description:
 *                 type: string
 *                 description: Beschreibung der Kategorie
 *                 example: Verschiedene Kräuter und Pflanzen
 *               parent_category_id:
 *                 type: string
 *                 description: ID der übergeordneten Kategorie
 *     responses:
 *       201:
 *         description: Kategorie erfolgreich erstellt
 *       400:
 *         description: Ungültige Eingabedaten
 *       403:
 *         description: Nicht autorisiert
 */
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

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Aktualisiere eine bestehende Kategorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der zu aktualisierenden Kategorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parent_category_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich aktualisiert
 *       400:
 *         description: Ungültige Eingabedaten
 *       403:
 *         description: Nicht autorisiert
 *       404:
 *         description: Kategorie nicht gefunden
 */
router.put(
  '/:id',
  authenticateToken,
  [
    body('name').optional().isString().withMessage('Name muss ein Text sein'),
    body('description').optional().isString().withMessage('Beschreibung muss ein Text sein'),
    body('parent_category_id')
      .optional()
      .isMongoId()
      .withMessage('Ungültige ID für übergeordnete Kategorie'),
  ],
  async (req, res) => {
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
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Lösche eine Kategorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der zu löschenden Kategorie
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich gelöscht
 *       403:
 *         description: Nicht autorisiert
 *       404:
 *         description: Kategorie nicht gefunden
 *       500:
 *         description: Interner Serverfehler
 */
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

module.exports = router;

