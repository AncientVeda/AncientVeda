const express = require('express');
const router = express.Router();
const Marketing = require('../models/Marketing');
const authenticateToken = require('../middleware/authenticateToken'); // Middleware importieren

/**
 * @swagger
 * /marketing:
 *   get:
 *     summary: Alle Marketingaktionen abrufen
 *     tags: [Marketing]
 *     responses:
 *       200:
 *         description: Eine Liste aller Marketingaktionen.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Marketing'
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', async (req, res) => {
    try {
        const marketing = await Marketing.find();
        res.json(marketing);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /marketing:
 *   post:
 *     summary: Neue Marketingaktion hinzufügen
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Marketing'
 *     responses:
 *       201:
 *         description: Die neue Marketingaktion wurde erfolgreich hinzugefügt.
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen Marketingaktionen hinzufügen.
 *       400:
 *         description: Ungültige Eingabe.
 */
router.post('/', authenticateToken, async (req, res) => {
    // Prüfen, ob der Benutzer Admin ist
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen Marketingaktionen hinzufügen.' });
    }

    const marketing = new Marketing({
        name: req.body.name,
        description: req.body.description,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        target_audience: req.body.target_audience,
        discount_percentage: req.body.discount_percentage,
    });

    try {
        const newMarketing = await marketing.save();
        res.status(201).json(newMarketing);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /marketing/{id}:
 *   put:
 *     summary: Bestehende Marketingaktion bearbeiten
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Die ID der zu bearbeitenden Marketingaktion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Marketing'
 *     responses:
 *       200:
 *         description: Die Marketingaktion wurde erfolgreich bearbeitet.
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen Marketingaktionen bearbeiten.
 *       404:
 *         description: Marketingaktion nicht gefunden.
 *       400:
 *         description: Ungültige Eingabe.
 */
router.put('/:id', authenticateToken, async (req, res) => {
    // Prüfen, ob der Benutzer Admin ist
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen Marketingaktionen bearbeiten.' });
    }

    try {
        const updatedMarketing = await Marketing.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedMarketing) {
            return res.status(404).json({ message: 'Marketingaktion nicht gefunden.' });
        }
        res.json(updatedMarketing);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /marketing/{id}:
 *   delete:
 *     summary: Marketingaktion löschen
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Die ID der zu löschenden Marketingaktion
 *     responses:
 *       200:
 *         description: Die Marketingaktion wurde erfolgreich gelöscht.
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen Marketingaktionen löschen.
 *       404:
 *         description: Marketingaktion nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    // Prüfen, ob der Benutzer Admin ist
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen Marketingaktionen löschen.' });
    }

    try {
        const deletedMarketing = await Marketing.findByIdAndDelete(req.params.id);
        if (!deletedMarketing) {
            return res.status(404).json({ message: 'Marketingaktion nicht gefunden.' });
        }
        res.json({ message: 'Marketingaktion gelöscht.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

