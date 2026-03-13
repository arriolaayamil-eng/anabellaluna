/**
 * rewardsScheduler.js – Cron-like scheduler for Rewards V2.
 *
 * Jobs:
 *   - Weekly badge check  (every Monday 02:00)  – Pre-Listing badge active/lost
 *   - Quarterly recalc    (1st of Jan/Apr/Jul/Oct 03:00) – awards + rankings
 *   - Annual tier recalc  (Jan 2 04:00)          – seller tier snapshots
 *
 * Uses setInterval with minute-level granularity (checks once per minute).
 * Safe for single-instance deployments. For multi-instance, wrap with a
 * distributed lock (e.g. mongodb advisory lock) if needed.
 */
const engine = require('./rewardsEngine');

let intervalId = null;
let lastRunDay = null;

function log(msg) {
  console.log(`[RewardsScheduler] ${new Date().toISOString()} ${msg}`);
}

async function runWeeklyBadgeCheck() {
  log('Running weekly badge check...');
  try {
    const report = await engine.recalculateAll();
    log(`Weekly badge check complete. ${report.agents.length} agents processed.`);
  } catch (err) {
    console.error('[RewardsScheduler] Weekly badge check error:', err);
  }
}

async function runQuarterlyRecalc() {
  log('Running quarterly recalculation...');
  try {
    const now = new Date();
    const year = now.getFullYear();
    // Calculate previous quarter
    let q = engine.currentQuarter(now) - 1;
    let y = year;
    if (q <= 0) { q = 4; y = year - 1; }
    const report = await engine.recalculateAll({ year: y, quarter: q });
    log(`Quarterly recalc complete for Q${q} ${y}. ${report.quarterlyAwards.length} awards.`);
  } catch (err) {
    console.error('[RewardsScheduler] Quarterly recalc error:', err);
  }
}

async function runAnnualTierRecalc() {
  log('Running annual tier recalculation...');
  try {
    const prevYear = new Date().getFullYear() - 1;
    const report = await engine.recalculateAll({ year: prevYear, quarter: 4 });
    log(`Annual tier recalc complete for ${prevYear}. ${report.agents.length} agents.`);
  } catch (err) {
    console.error('[RewardsScheduler] Annual tier recalc error:', err);
  }
}

function checkAndRun() {
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

  // Prevent running the same job more than once per hour slot
  if (lastRunDay === dayKey) return;

  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const hour = now.getHours();
  const date = now.getDate();
  const month = now.getMonth(); // 0-indexed

  // Weekly badge check: Monday at 02:00
  if (dayOfWeek === 1 && hour === 2) {
    lastRunDay = dayKey;
    runWeeklyBadgeCheck();
    return;
  }

  // Quarterly recalc: 1st of Jan(0), Apr(3), Jul(6), Oct(9) at 03:00
  if (date === 1 && [0, 3, 6, 9].includes(month) && hour === 3) {
    lastRunDay = dayKey;
    runQuarterlyRecalc();
    return;
  }

  // Annual tier recalc: Jan 2 at 04:00
  if (month === 0 && date === 2 && hour === 4) {
    lastRunDay = dayKey;
    runAnnualTierRecalc();
    return;
  }
}

function initRewardsScheduler() {
  if (intervalId) return;
  log('Scheduler initialized. Checking every 60s.');
  intervalId = setInterval(checkAndRun, 60 * 1000);
  // Run once immediately on startup
  checkAndRun();
}

function stopRewardsScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    log('Scheduler stopped.');
  }
}

module.exports = { initRewardsScheduler, stopRewardsScheduler };
