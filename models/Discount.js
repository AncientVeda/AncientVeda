// models/Discount.js
const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true },
    expirationDate: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = unbegrenzt
    usedCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('Discount', discountSchema);

