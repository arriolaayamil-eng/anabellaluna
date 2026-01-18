const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true, index: true },
  excerpt: { type: String, default: '' },
  contentHtml: { type: String, default: '' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory' },
  authorAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente' },
  coverUrl: { type: String, default: '' },
  galleryUrls: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', BlogPostSchema);
