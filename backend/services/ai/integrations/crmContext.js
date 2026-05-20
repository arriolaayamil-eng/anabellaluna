/**
 * CRM Context — Provee un resumen del CRM para enriquecer el análisis AI.
 */

const Cliente    = require('../../../models/Cliente');
const Propiedad  = require('../../../models/Propiedad');
const Operacion  = require('../../../models/Operacion');
const Cita       = require('../../../models/Cita');

const PERIOD_DAYS = {
  today:      0,
  last_7d:    7,
  last_30d:   30,
  this_month: null,
};

async function getSummary({ period = 'last_30d' } = {}) {
  let startDate;

  if (period === 'this_month') {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'today') {
    startDate = new Date(new Date().setHours(0, 0, 0, 0));
  } else {
    const days = PERIOD_DAYS[period] || 30;
    startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  const [
    totalClientes,
    newClientes,
    totalPropiedades,
    publishedPropiedades,
    totalOperaciones,
    upcomingCitas,
  ] = await Promise.all([
    Cliente.countDocuments({}),
    Cliente.countDocuments({ createdAt: { $gte: startDate } }),
    Propiedad.countDocuments({}),
    Propiedad.countDocuments({ published: true }),
    Operacion.countDocuments({ createdAt: { $gte: startDate } }),
    Cita.countDocuments({ fecha: { $gte: new Date() } }),
  ]);

  return {
    period,
    clientes: {
      total:    totalClientes,
      newInPeriod: newClientes,
    },
    propiedades: {
      total:     totalPropiedades,
      published: publishedPropiedades,
    },
    operaciones: {
      inPeriod: totalOperaciones,
    },
    citas: {
      upcoming: upcomingCitas,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getSummary };
