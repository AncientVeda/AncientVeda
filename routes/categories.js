const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
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
 *           format: ObjectId
 *           description: Die ID der übergeordneten Kategorie (falls vorhanden).
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Endpunkte zur Verwaltung von Produktkategorien
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Ruft alle Kategorien ab.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe aller Kategorien.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Erstellt eine neue Kategorie (nur für Admins).
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
 *                 description: Name der Kategorie.
 *               description:
 *                 type: string
 *                 description: Beschreibung der Kategorie (optional).
 *               parent_category_id:
 *                 type: string
 *                 description: ID der übergeordneten Kategorie (optional).
 *     responses:
 *       201:
 *         description: Kategorie erfolgreich erstellt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Ungültige Eingabedaten.
 *       403:
 *         description: Zugriff verweigert (nur Admins erlaubt).
 *       500:
 *         description: Interner Serverfehler.
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
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Nur Admins dürfen Kategorien hinzufügen.' });
    }

    try {
      const category = new Category({
        name: req.body.name,
        description: req.body.description,
        parent_category_id: req.body.parent_category_id || null,
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
 *     summary: Bearbeitet eine bestehende Kategorie (nur für Admins).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Die ID der zu bearbeitenden Kategorie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Der neue Name der Kategorie (optional).
 *               description:
 *                 type: string
 *                 description: Die neue Beschreibung der Kategorie (optional).
 *               parent_category_id:
 *                 type: string
 *                 description: Die ID der neuen übergeordneten Kategorie (optional).
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich bearbeitet.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       403:
 *         description: Zugriff verweigert (nur Admins erlaubt).
 *       404:
 *         description: Kategorie nicht gefunden.
 *       400:
 *         description: Ungültige Eingabedaten.
 *       500:
 *         description: Interner Serverfehler.
 */
router.put('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen Kategorien bearbeiten.' });
    }
      
    try {
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Kategorie nicht gefunden.' });
        }
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Löscht eine Kategorie (nur für Admins).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: Die ID der zu löschenden Kategorie.
 *     responses:
 *       200:
 *         description: Kategorie erfolgreich gelöscht.
 *       403:
 *         description: Zugriff verweigert (nur Admins erlaubt).
 *       404:
 *         description: Kategorie nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
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
        res.json({ message: 'Kategorie gelöscht.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

