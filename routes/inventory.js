const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const authenticateToken = require('../middleware/authenticateToken'); // Middleware importieren

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Gesamten Lagerbestand abrufen
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Erfolgreiche Rückgabe des Lagerbestands.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventory'
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen den Lagerbestand abrufen.
 *       500:
 *         description: Interner Serverfehler.
 */
router.get('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen den Lagerbestand abrufen.' });
    }

    try {
        const inventory = await Inventory.find();
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Neue Bestandsdaten hinzufügen
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Inventory'
 *     responses:
 *       201:
 *         description: Erfolgreich neue Bestandsdaten hinzugefügt.
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen neue Bestandsdaten hinzufügen.
 *       400:
 *         description: Ungültige Eingabe.
 */
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen neue Bestandsdaten hinzufügen.' });
    }

    const inventory = new Inventory({
        product_id: req.body.product_id,
        quantity: req.body.quantity,
        location: req.body.location || 'Main Warehouse',
        last_updated: new Date(),
    });

    try {
        const newInventory = await inventory.save();
        res.status(201).json(newInventory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Bestehende Bestandsdaten aktualisieren
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Die ID der zu aktualisierenden Bestandsdaten
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Inventory'
 *     responses:
 *       200:
 *         description: Erfolgreiche Aktualisierung der Bestandsdaten.
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen Bestandsdaten aktualisieren.
 *       404:
 *         description: Bestandsdaten nicht gefunden.
 *       400:
 *         description: Ungültige Eingabe.
 */
router.put('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen Bestandsdaten aktualisieren.' });
    }

    try {
        const updatedInventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedInventory) {
            return res.status(404).json({ message: 'Bestandsdaten nicht gefunden.' });
        }
        res.json(updatedInventory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Bestandsdaten löschen
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Die ID der zu löschenden Bestandsdaten
 *     responses:
 *       200:
 *         description: Erfolgreiche Löschung der Bestandsdaten.
 *       403:
 *         description: Zugriff verweigert. Nur Admins dürfen Bestandsdaten löschen.
 *       404:
 *         description: Bestandsdaten nicht gefunden.
 *       500:
 *         description: Interner Serverfehler.
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Admins dürfen Bestandsdaten löschen.' });
    }

    try {
        const deletedInventory = await Inventory.findByIdAndDelete(req.params.id);
        if (!deletedInventory) {
            return res.status(404).json({ message: 'Bestandsdaten nicht gefunden.' });
        }
        res.json({ message: 'Bestandsdaten gelöscht.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

