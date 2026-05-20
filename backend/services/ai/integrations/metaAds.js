/**
 * Meta Ads API Integration.
 * Credenciales encriptadas en GlobalConfig key: 'meta_ads_credentials'
 * Mismo patrón que googleCalendar.js y mercadoLibre.js.
 */

const crypto = require('crypto');
const GlobalConfig      = require('../../../models/GlobalConfig');
const MarketingCampaign = require('../../../models/MarketingCampaign');
const CampaignMetrics   = require('../../../models/CampaignMetrics');

const META_API_VERSION = 'v20.0';
const META_API_BASE    = `https://graph.facebook.com/${META_API_VERSION}`;

// ── Credentials ───────────────────────────────────────────────────────────────

async function getCredentials() {
  const config = await GlobalConfig.getValue('meta_ads_credentials', null);
  if (!config || !config.accessTokenEncrypted) {
    throw new Error('Meta Ads not configured. Go to ERP → Integraciones → Meta Ads.');
  }
  const accessToken = _decrypt(config.accessTokenEncrypted);
  return { accessToken, adAccountId: config.adAccountId };
}

// ── API Base ──────────────────────────────────────────────────────────────────

async function _metaRequest(endpoint, method = 'GET', params = {}) {
  const { accessToken } = await getCredentials();

  const url = new URL(`${META_API_BASE}/${endpoint}`);
  const fetchOptions = { method };

  if (method === 'GET') {
    url.searchParams.set('access_token', accessToken);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
  } else {
    fetchOptions.headers = { 'Content-Type': 'application/json' };
    fetchOptions.body    = JSON.stringify({ ...params, access_token: accessToken });
  }

  const response = await fetch(url.toString(), fetchOptions);
  const data     = await response.json();

  if (data.error) {
    throw new Error(`Meta API Error (${data.error.code}): ${data.error.message}`);
  }

  return data;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

async function getCampaigns({ status = 'ALL', limit = 10 } = {}) {
  const { adAccountId } = await getCredentials();
  const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,effective_status';
  const reqParams = { fields, limit: Math.min(limit || 10, 50) };
  if (status !== 'ALL') reqParams.effective_status = [status];

  const data = await _metaRequest(`act_${adAccountId}/campaigns`, 'GET', reqParams);
  const campaigns = data.data || [];

  // Sync a MongoDB
  for (const c of campaigns) {
    await MarketingCampaign.findOneAndUpdate(
      { platform: 'meta', externalId: c.id },
      {
        $set: {
          name:       c.name,
          status:     c.effective_status?.toLowerCase() || c.status?.toLowerCase() || 'unknown',
          objective:  c.objective,
          budget:     c.daily_budget
            ? parseInt(c.daily_budget, 10) / 100
            : c.lifetime_budget ? parseInt(c.lifetime_budget, 10) / 100 : 0,
          budgetType:  c.daily_budget ? 'daily' : 'lifetime',
          lastSyncAt:  new Date(),
          syncStatus: 'ok',
        },
        $setOnInsert: { platform: 'meta', externalId: c.id, createdBy: 'meta-sync' },
      },
      { upsert: true, new: true }
    );
  }

  return campaigns;
}

async function getCampaignMetrics({ campaignId, dateRange = 'last_7d' } = {}) {
  const datePresets = {
    today:       'today',
    last_7d:     'last_7_days',
    last_30d:    'last_30_days',
    last_90d:    'last_90_days',
    this_month:  'this_month',
  };

  const fields = [
    'campaign_id', 'campaign_name', 'impressions', 'clicks', 'spend',
    'reach', 'frequency', 'actions', 'cost_per_action_type', 'ctr', 'cpc', 'cpm',
  ].join(',');

  const data = await _metaRequest(`${campaignId}/insights`, 'GET', {
    fields,
    date_preset: datePresets[dateRange] || 'last_7_days',
    level: 'campaign',
  });

  const raw         = (data.data && data.data[0]) || {};
  const impressions = parseInt(raw.impressions || 0, 10);
  const clicks      = parseInt(raw.clicks      || 0, 10);
  const spend       = parseFloat(raw.spend     || 0);
  const reach       = parseInt(raw.reach       || 0, 10);
  const freq        = parseFloat(raw.frequency || 0);

  const findAction = (type) => {
    const a = (raw.actions || []).find((x) => x.action_type === type);
    return a ? parseInt(a.value, 10) : 0;
  };

  const leads       = findAction('lead');
  const conversions = findAction('offsite_conversion.fb_pixel_purchase');

  const metrics = {
    impressions, clicks, spend, reach, frequency: freq, leads, conversions,
    ctr:  impressions > 0 ? +(clicks / impressions * 100).toFixed(4) : 0,
    cpc:  clicks      > 0 ? +(spend  / clicks).toFixed(2)            : 0,
    cpm:  impressions > 0 ? +(spend  / impressions * 1000).toFixed(2): 0,
    cpl:  leads       > 0 ? +(spend  / leads).toFixed(2)             : 0,
    cac:  conversions > 0 ? +(spend  / conversions).toFixed(2)       : 0,
    roas: 0,
    rawData: raw,
  };

  // Persist to MongoDB
  const campaign = await MarketingCampaign.findOne({ platform: 'meta', externalId: campaignId }).lean();
  if (campaign) {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    await CampaignMetrics.findOneAndUpdate(
      { campaignId: campaign._id, date: today, granularity: 'day' },
      {
        $set: {
          ...metrics,
          externalId: campaignId,
          platform:   'meta',
          agenteId:   campaign.agenteId || '',
        },
      },
      { upsert: true }
    );
  }

  return metrics;
}

async function updateCampaignBudget({ campaignId, newBudget, increasePercent, reason } = {}) {
  let budget = newBudget;

  if (!budget && increasePercent !== undefined) {
    const current = await getCampaignCurrentBudget(campaignId);
    budget = Math.round(current.budget * (1 + increasePercent / 100));
  }

  if (!budget || budget <= 0) throw new Error('Invalid budget value');

  await _metaRequest(campaignId, 'POST', {
    daily_budget: Math.round(budget * 100), // Meta usa centavos
  });

  await MarketingCampaign.findOneAndUpdate(
    { platform: 'meta', externalId: campaignId },
    { $set: { budget, lastSyncAt: new Date(), syncStatus: 'ok' } }
  );

  return { success: true, campaignId, newBudget: budget, reason };
}

async function pauseCampaign({ campaignId, reason } = {}) {
  await _metaRequest(campaignId, 'POST', { status: 'PAUSED' });
  await MarketingCampaign.findOneAndUpdate(
    { platform: 'meta', externalId: campaignId },
    { $set: { status: 'paused', lastSyncAt: new Date(), syncStatus: 'ok' } }
  );
  return { success: true, campaignId, action: 'paused', reason };
}

async function resumeCampaign({ campaignId } = {}) {
  await _metaRequest(campaignId, 'POST', { status: 'ACTIVE' });
  await MarketingCampaign.findOneAndUpdate(
    { platform: 'meta', externalId: campaignId },
    { $set: { status: 'active', lastSyncAt: new Date(), syncStatus: 'ok' } }
  );
  return { success: true, campaignId, action: 'resumed' };
}

async function getCampaignCurrentBudget(campaignId) {
  const data = await _metaRequest(campaignId, 'GET', { fields: 'daily_budget,lifetime_budget' });
  const daily    = data.daily_budget    ? parseInt(data.daily_budget,    10) / 100 : null;
  const lifetime = data.lifetime_budget ? parseInt(data.lifetime_budget, 10) / 100 : null;
  return {
    budget:     daily ?? lifetime ?? 0,
    type:       daily !== null ? 'daily' : 'lifetime',
    campaignId,
  };
}

async function getCampaignStatus(campaignId) {
  const data = await _metaRequest(campaignId, 'GET', { fields: 'status,effective_status' });
  return { status: data.effective_status || data.status, campaignId };
}

// ── Encryption ────────────────────────────────────────────────────────────────

function _decrypt(text) {
  const rawKey = process.env.META_ENCRYPTION_KEY || process.env.AI_ENCRYPTION_KEY;
  if (!rawKey) throw new Error('META_ENCRYPTION_KEY not configured');
  const key = Buffer.from(rawKey.padEnd(64, '0').substring(0, 64), 'hex');
  const [ivHex, tagHex, enc] = text.split(':');
  const iv  = Buffer.from(ivHex,  'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const d   = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return d.update(enc, 'hex', 'utf8') + d.final('utf8');
}

module.exports = {
  getCampaigns,
  getCampaignMetrics,
  updateCampaignBudget,
  pauseCampaign,
  resumeCampaign,
  getCampaignCurrentBudget,
  getCampaignStatus,
};
