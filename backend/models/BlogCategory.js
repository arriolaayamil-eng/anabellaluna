const mongoose = require('mongoose');

const BlogCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('BlogCategory', BlogCategorySchema);
