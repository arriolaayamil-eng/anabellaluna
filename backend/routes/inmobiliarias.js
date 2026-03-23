const express = require('express');
const router = express.Router();
const Inmobiliaria = require('../models/Inmobiliaria');

// GET all inmobiliarias
router.get('/', async (req, res) => {
  try {
    const items = await Inmobiliaria.find().sort({ nombre: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create inmobiliaria (used when user types a new one)
router.post('/', async (req, res) => {
  try {
    const { nombre, direccion, telefono, email } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre es requerido' });

    // Upsert: if already exists by name, return existing; otherwise create
    const existing = await Inmobiliaria.findOne({ nombre: nombre.trim() });
    if (existing) return res.json(existing);

    const doc = await Inmobiliaria.create({
      nombre: nombre.trim(),
      direccion: direccion || '',
      telefono: telefono || '',
      email: email || '',
      metadata: { source: 'admin_manual', createdAt: new Date().toISOString() }
    });
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key - return existing
      const existing = await Inmobiliaria.findOne({ nombre: req.body.nombre?.trim() });
      return res.json(existing);
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
