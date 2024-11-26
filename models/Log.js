const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user_id: { type: String, required: true }, // Referenz zum Benutzer
    action: { type: String, required: true }, // Art der Aktion
    details: { type: String }, // Weitere Details zur Aktion
    timestamp: { type: Date, default: Date.now }, // Zeitpunkt der Aktion
});

module.exports = mongoose.model('Log', logSchema, 'Logs');

