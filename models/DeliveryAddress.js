const mongoose = require('mongoose');

const deliveryAddressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Verweis auf Orders
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' } // Verweis auf Payments
});

module.exports = mongoose.model('DeliveryAddress', deliveryAddressSchema, 'deliveryaddresses');

