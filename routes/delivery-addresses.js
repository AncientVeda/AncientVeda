const express = require('express');
const router = express.Router();
const DeliveryAddress = require('../models/DeliveryAddress');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authenticateToken = require('../middleware/authenticateToken');

// POST /delivery-addresses: Speichert eine neue Lieferadresse und erstellt die Order
router.post('/', authenticateToken, async (req, res) => {
    const { fullName, street, postalCode, city, country } = req.body;
    const userId = req.user.userId;

    // Validierung
    if (!street || !postalCode || !city || !country) {
        return res.status(400).json({ message: 'Alle Felder außer vollständiger Name sind erforderlich.' });
    }

    try {
        // Neue Lieferadresse speichern
        const deliveryAddress = new DeliveryAddress({
            userId,
            fullName: fullName || req.user.fullName || 'Kein Name angegeben', // Fallback für fehlende Namen
            street,
            postalCode,
            city,
            country,
        });

        await deliveryAddress.save();
        console.log('Lieferadresse gespeichert:', deliveryAddress);

        // Warenkorb abrufen
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || !cart.items || cart.items.length === 0 || !cart.items.some((item) => item.productId)) {
            return res.status(400).json({ message: 'Warenkorb ist leer oder enthält ungültige Artikel.' });
        }

        // Gesamtpreis berechnen
        let totalPrice = 0;
        cart.items.forEach((item) => {
            if (!item.productId || !item.productId.price) {
                throw new Error(`Fehlender Preis für Produkt: ${item.productId?.name || 'Unbekannt'}`);
            }
            totalPrice += item.quantity * item.productId.price;
        });

        // Order erstellen
        const order = new Order({
            userId,
            items: cart.items.map((item) => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price,
            })),
            total_price: totalPrice,
            status: 'pending', // Status auf Pending setzen
        });

        await order.save();
        console.log('Bestellung erstellt:', order);

        // Optional: Warenkorb löschen
        // await Cart.deleteOne({ userId });

        res.status(201).json({
            message: 'Lieferadresse und Bestellung erfolgreich erstellt.',
            deliveryAddress,
            order,
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Lieferadresse und Erstellen der Bestellung:', error.message);
        res.status(500).json({ message: 'Interner Serverfehler.', error: error.message });
    }
});

module.exports = router;

