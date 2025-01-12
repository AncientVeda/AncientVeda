const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' // Verweis auf die User-Kollektion hinzufügen
    },
    items: [
        {
            productId: { 
                type: mongoose.Schema.Types.ObjectId, 
                required: true, 
                ref: 'Product' // Verweis auf die Product-Kollektion
            },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    total_price: { type: Number, required: true }, // `total_price` ist erforderlich
    status: { type: String, default: 'pending' },
    created_at: { type: Date, default: Date.now }
});
console.log('Order model loaded');


module.exports = mongoose.model('Order', orderSchema, 'Orders');

