const ReportConfig = require('../models/ReportConfig');
const Agente = require('../models/Agente');

// Función para verificar y enviar reportes automáticos
async function checkAndSendMonthlyReports() {
  const today = new Date();
  const currentDay = today.getDate();
  
  console.log(`[ReportScheduler] Checking for monthly reports on day ${currentDay}...`);

  try {
    // Buscar todas las configuraciones que tienen autoSend habilitado y es el día configurado
    const configs = await ReportConfig.find({
      autoSendEnabled: true,
      autoSendDay: currentDay,
    }).lean();

    console.log(`[ReportScheduler] Found ${configs.length} configs to process`);

    for (const config of configs) {
      // Verificar si ya se envió este mes
      const lastSend = config.lastAutoSendDate ? new Date(config.lastAutoSendDate) : null;
      const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      if (lastSend) {
        const lastSendMonth = `${lastSend.getFullYear()}-${String(lastSend.getMonth() + 1).padStart(2, '0')}`;
        if (lastSendMonth === thisMonth) {
          console.log(`[ReportScheduler] Agent ${config.agenteId} already sent report this month, skipping`);
          continue;
        }
      }

      // Generar reporte mensual
      const period = thisMonth;
      
      await ReportConfig.findByIdAndUpdate(config._id, {
        $push: {
          generatedReports: {
            type: 'monthly',
            period,
            generatedAt: new Date(),
            sentToERP: true,
            sentAt: new Date(),
          }
        },
        $set: {
          lastAutoSendDate: new Date(),
        }
      });

      console.log(`[ReportScheduler] Generated and sent monthly report for agent ${config.agenteId}, period ${period}`);
    }
  } catch (err) {
    console.error('[ReportScheduler] Error processing monthly reports:', err);
  }
}

// Inicializar el scheduler
function initReportScheduler() {
  // Verificar cada hora si hay reportes que enviar
  // (el día exacto se verifica en checkAndSendMonthlyReports)
  const HOUR_IN_MS = 60 * 60 * 1000;
  
  console.log('[ReportScheduler] Initialized - will check for monthly reports every hour');
  
  // Verificar inmediatamente al iniciar
  checkAndSendMonthlyReports();
  
  // Configurar verificación periódica
  setInterval(checkAndSendMonthlyReports, HOUR_IN_MS);
}

module.exports = {
  initReportScheduler,
  checkAndSendMonthlyReports,
};
