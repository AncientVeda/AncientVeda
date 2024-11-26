const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    order_id: { type: String, required: true }, // Referenz zur Bestellung
    product_id: { type: String, required: true }, // Referenz zum Produkt
    quantity: { type: Number, required: true }, // Anzahl der Artikel
    price_per_unit: { type: Number, required: true }, // Preis pro Einheit
});

module.exports = mongoose.model('OrderItem', orderItemSchema, 'OrderItems');

