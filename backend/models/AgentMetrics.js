const mongoose = require('mongoose');

const agentMetricsSchema = new mongoose.Schema({
  agenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agente',
    required: true,
    index: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
  
  // Login metrics
  loginCount: {
    type: Number,
    default: 0,
  },
  loginDays: [{
    type: Date,
  }],
  
  // Data completeness
  totalClients: {
    type: Number,
    default: 0,
  },
  clientsWithCompleteData: {
    type: Number,
    default: 0,
  },
  totalProperties: {
    type: Number,
    default: 0,
  },
  propertiesWithCompleteData: {
    type: Number,
    default: 0,
  },
  dataCompletenessPercent: {
    type: Number,
    default: 0,
  },
  
  // Response time
  totalEnquiries: {
    type: Number,
    default: 0,
  },
  enquiriesRespondedIn24h: {
    type: Number,
    default: 0,
  },
  avgResponseTimeHours: {
    type: Number,
    default: 0,
  },
  
  // Conversion metrics
  totalLeads: {
    type: Number,
    default: 0,
  },
  leadsConverted: {
    type: Number,
    default: 0,
  },
  conversionRate: {
    type: Number,
    default: 0,
  },
  
  // Satisfaction metrics
  totalRatings: {
    type: Number,
    default: 0,
  },
  avgRating: {
    type: Number,
    default: 0,
  },
  
  // Calculated seniority
  seniority: {
    type: String,
    enum: ['junior', 'semi-senior', 'senior'],
    default: 'junior',
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

agentMetricsSchema.index({ agenteId: 1, period: 1, periodStart: 1 }, { unique: true });
agentMetricsSchema.index({ periodStart: -1 });

module.exports = mongoose.model('AgentMetrics', agentMetricsSchema);
