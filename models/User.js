const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name des Benutzers
    email: { type: String, required: true, unique: true }, // Eindeutige E-Mail
    password_hash: { type: String, required: true }, // Verschlüsseltes Passwort
    address: String, // Adresse des Benutzers
    phone: String, // Telefonnummer
    role: { type: String, default: 'customer' }, // Rolle (z. B. Kunde, Admin)
    created_at: { type: Date, default: Date.now }, // Registrierungsdatum
});

module.exports = mongoose.model('User', userSchema, 'Users');

