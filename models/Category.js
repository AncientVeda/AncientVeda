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
    image: {
        type: String, // URL oder Pfad zum Bild
        default: '', // Optional, falls kein Bild gesetzt ist
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

