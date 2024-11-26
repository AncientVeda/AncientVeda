const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Produktname
    description: String, // Beschreibung
    price: { type: Number, required: true }, // Preis
    stock: { type: Number, required: true }, // Lagerbestand
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Verweis auf die Kategorie
    images: [String], // Array von Bild-URLs
    created_at: { type: Date, default: Date.now }, // Erstellungsdatum
});

module.exports = mongoose.model('Product', productSchema, 'Products');

