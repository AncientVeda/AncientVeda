const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product_id: { type: String, required: true }, // Referenz zum Produkt
    quantity: { type: Number, required: true }, // Verfügbarer Bestand
    location: { type: String, default: 'Main Warehouse' }, // Lagerort
    last_updated: { type: Date, default: Date.now }, // Letzte Aktualisierung
});

module.exports = mongoose.model('Inventory', inventorySchema, 'Inventory');

