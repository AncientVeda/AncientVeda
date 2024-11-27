const mongoose = require('mongoose'); // Mongoose importieren

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Der Name der Kategorie ist erforderlich.'], 
    },
    description: {
        type: String,
        default: '',
    },
    parent_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Category', categorySchema, 'Categories');

