const express = require('express');
const router = express.Router();
const FechaImportante = require('../models/FechaImportante');
const fechasImportantesArgentina = require('../seeds/fechasImportantesArgentina');
const { authenticateToken } = require('../auth');

// Seed initial dates (run once or to reset)
router.post('/seed', authenticateToken, async (req, res) => {
  try {
    for (const fecha of fechasImportantesArgentina) {
      await FechaImportante.findOneAndUpdate(
        { codigo: fecha.codigo },
        fecha,
        { upsert: true, new: true }
      );
    }
    const count = await FechaImportante.countDocuments();
    res.json({ success: true, message: `${count} fechas importantes cargadas/actualizadas` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all important dates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const fechas = await FechaImportante.find().sort({ mes: 1, dia: 1 }).lean();
    res.json(fechas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active important dates
router.get('/activas', authenticateToken, async (req, res) => {
  try {
    const fechas = await FechaImportante.find({ activo: true }).sort({ mes: 1, dia: 1 }).lean();
    res.json(fechas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming dates (next 30 days)
router.get('/proximas', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const fechas = await FechaImportante.find({ activo: true }).lean();
    
    const proximas = fechas.filter(fecha => {
      if (!fecha.esFechaFija) return true;
      const fechaDate = new Date(today.getFullYear(), fecha.mes - 1, fecha.dia);
      if (fechaDate < today) {
        fechaDate.setFullYear(today.getFullYear() + 1);
      }
      const diffDays = Math.ceil((fechaDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    });
    
    res.json(proximas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single date by codigo
router.get('/:codigo', authenticateToken, async (req, res) => {
  try {
    const fecha = await FechaImportante.findOne({ codigo: req.params.codigo }).lean();
    if (!fecha) {
      return res.status(404).json({ error: 'Fecha no encontrada' });
    }
    res.json(fecha);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update date (toggle active, update templates, etc.)
router.put('/:codigo', authenticateToken, async (req, res) => {
  try {
    const { plantillaTitulo, plantillaMensaje, prioridad, activo, segmentacion } = req.body;
    const updateData = {};
    
    if (plantillaTitulo !== undefined) updateData.plantillaTitulo = plantillaTitulo;
    if (plantillaMensaje !== undefined) updateData.plantillaMensaje = plantillaMensaje;
    if (prioridad !== undefined) updateData.prioridad = prioridad;
    if (activo !== undefined) updateData.activo = activo;
    if (segmentacion !== undefined) updateData.segmentacion = segmentacion;
    
    const fecha = await FechaImportante.findOneAndUpdate(
      { codigo: req.params.codigo },
      { $set: updateData },
      { new: true }
    );
    
    if (!fecha) {
      return res.status(404).json({ error: 'Fecha no encontrada' });
    }
    
    res.json(fecha);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle active status
router.patch('/:codigo/toggle', authenticateToken, async (req, res) => {
  try {
    const fecha = await FechaImportante.findOne({ codigo: req.params.codigo });
    if (!fecha) {
      return res.status(404).json({ error: 'Fecha no encontrada' });
    }
    
    fecha.activo = !fecha.activo;
    await fecha.save();
    
    res.json(fecha);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate actual date for variable dates
function calcularFechaVariable(fecha, year) {
  switch (fecha.calculoEspecial) {
    case 'tercer_domingo_junio': {
      const firstDay = new Date(year, 5, 1);
      const firstSunday = new Date(year, 5, 1 + (7 - firstDay.getDay()) % 7);
      return new Date(year, 5, firstSunday.getDate() + 14);
    }
    case 'tercer_domingo_agosto': {
      const firstDay = new Date(year, 7, 1);
      const firstSunday = new Date(year, 7, 1 + (7 - firstDay.getDay()) % 7);
      return new Date(year, 7, firstSunday.getDate() + 14);
    }
    case 'tercer_domingo_octubre': {
      const firstDay = new Date(year, 9, 1);
      const firstSunday = new Date(year, 9, 1 + (7 - firstDay.getDay()) % 7);
      return new Date(year, 9, firstSunday.getDate() + 14);
    }
    case 'cuarto_viernes_noviembre': {
      const firstDay = new Date(year, 10, 1);
      const firstFriday = new Date(year, 10, 1 + (5 - firstDay.getDay() + 7) % 7);
      return new Date(year, 10, firstFriday.getDate() + 21);
    }
    case 'lunes_despues_black_friday': {
      const blackFriday = calcularFechaVariable({ calculoEspecial: 'cuarto_viernes_noviembre' }, year);
      return new Date(blackFriday.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
    default:
      return null;
  }
}

// Get calculated dates for current year
router.get('/calculadas/:year', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    const fechas = await FechaImportante.find({ activo: true }).lean();
    
    const fechasCalculadas = fechas.map(fecha => {
      let fechaReal;
      if (fecha.esFechaFija) {
        fechaReal = new Date(year, fecha.mes - 1, fecha.dia);
      } else if (fecha.calculoEspecial === 'cumpleanos_cliente' || fecha.calculoEspecial === 'aniversario_cliente') {
        fechaReal = null;
      } else {
        fechaReal = calcularFechaVariable(fecha, year);
      }
      
      return {
        ...fecha,
        fechaCalculada: fechaReal,
        fechaFormateada: fechaReal ? fechaReal.toLocaleDateString('es-AR') : 'Variable por cliente',
      };
    });
    
    res.json(fechasCalculadas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
