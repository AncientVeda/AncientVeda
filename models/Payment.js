const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Verweis auf Bestellung
    amount: { type: Number, required: true }, // Zahlungsbetrag
    paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'bank_transfer'], required: true }, // Zahlungsart
    status: { type: String, enum: ['success', 'failed'], default: 'success' }, // Zahlungsstatus
    createdAt: { type: Date, default: Date.now } // Zahlungsdatum
});

module.exports = mongoose.model('Payment', paymentSchema, 'Payments');

