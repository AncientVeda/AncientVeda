const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Admin' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  category: { type: String }, // Optional: Kategorie des Artikels
  coverImage: { type: String }, // Optional: URL zum Titelbild
});

module.exports = mongoose.model('Blog', blogSchema);

