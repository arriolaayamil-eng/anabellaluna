/**
 * RewardConfig – Admin-configurable thresholds for the rewards system.
 *
 * Single document (singleton) holding every tunable parameter.
 * Created automatically with defaults on first read if missing.
 *
 * Sections:
 *   captureGoals  – monthly/quarterly/annual targets for exclusive captures
 *   revenueGoals  – annual billing target + quarterly award prizes
 *   sellerTiers   – annual billing thresholds per tier (Rookie/Executive/100% Club)
 *   preListing    – weekly minimum to earn/keep the Pre-Listing badge
 *   clientLoyalty  – thresholds for Junior/Semi-Senior/Senior by closed+loyal clients
 */
const mongoose = require('mongoose');

const rewardConfigSchema = new mongoose.Schema({
  // ---- A) Capture goals ----
  captureGoals: {
    monthlyTarget: { type: Number, default: 2 },
    quarterlyTarget: { type: Number, default: 6 },
    annualTarget: { type: Number, default: 24 },
    minExclusivityDays: { type: Number, default: 90 },
  },

  // ---- B) Revenue / billing goals ----
  revenueGoals: {
    annualTarget: { type: Number, default: 24000 },
    quarterlyTarget: { type: Number, default: 6000 },
    quarterlyPrizes: {
      first: { type: String, default: '2 cenas + 2 días de spa' },
      second: { type: String, default: '2 cenas + 2 días de spa' },
    },
  },

  // ---- C) Client loyalty thresholds ----
  clientLoyalty: {
    juniorMin: { type: Number, default: 5 },
    semiSeniorMin: { type: Number, default: 15 },
    seniorMin: { type: Number, default: 20 },
  },

  // ---- D) Pre-Listing badge ----
  preListing: {
    weeklyMinimum: { type: Number, default: 5 },
    badgeReward: { type: String, default: 'Diploma + Libro de capacitaciones inmobiliarias' },
  },

  // ---- E) Seller tiers by annual revenue ----
  sellerTiers: {
    rookie: { minRevenue: { type: Number, default: 24000 }, medal: { type: String, default: 'Bronce' } },
    executive: { minRevenue: { type: Number, default: 54000 }, medal: { type: String, default: 'Plata' } },
    club100: { minRevenue: { type: Number, default: 80000 }, medal: { type: String, default: 'Oro' }, prize: { type: String, default: 'Viaje a destino premium (isla/playa)' } },
  },

  updatedBy: { type: String, default: '' },
}, { timestamps: true });

/**
 * Singleton accessor – returns the single config doc, creating defaults if absent.
 */
rewardConfigSchema.statics.load = async function load() {
  let cfg = await this.findOne().lean();
  if (!cfg) {
    cfg = await this.create({});
    cfg = cfg.toObject();
  }
  return cfg;
};

module.exports = mongoose.model('RewardConfig', rewardConfigSchema);
