const mongoose = require('mongoose');

const marketingSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name der Marketingaktion
    description: { type: String }, // Beschreibung
    start_date: { type: Date, required: true }, // Startdatum
    end_date: { type: Date, required: true }, // Enddatum
    target_audience: { type: String }, // Zielgruppe
    discount_percentage: { type: Number }, // Rabatt in Prozent
    created_at: { type: Date, default: Date.now }, // Erstellungsdatum
});

module.exports = mongoose.model('Marketing', marketingSchema, 'Marketing');

