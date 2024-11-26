const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    parent_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Category', categorySchema, 'Categories');

