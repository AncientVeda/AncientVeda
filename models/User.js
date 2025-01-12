const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    address: { type: String, trim: true }, // Adresse
    city: { type: String, trim: true }, // Stadt
    zipCode: { type: String, trim: true, match: /^[0-9]{5}$/ }, // Deutsche Postleitzahl
    phone: { 
        type: String, 
        trim: true, 
        match: /^(\+?\d{1,4})?\s?\d{7,14}$/, // Internationale Telefonnummern
    },
    birthDate: { type: Date }, // Geburtsdatum hinzugefügt
    created_at: { type: Date, default: Date.now }, // Erstellungsdatum
    role: { type: String, default: 'customer' }, // Immer 'customer', falls benötigt
});

module.exports = mongoose.model('User', userSchema, 'Users');

