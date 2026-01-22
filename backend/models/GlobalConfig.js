const mongoose = require('mongoose');

const GlobalConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Static method to get a config value
GlobalConfigSchema.statics.getValue = async function(key, defaultValue = null) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : defaultValue;
};

// Static method to set a config value
GlobalConfigSchema.statics.setValue = async function(key, value, description = '', updatedBy = null) {
  const update = { value, updatedAt: new Date() };
  if (description) update.description = description;
  if (updatedBy) update.updatedBy = updatedBy;
  
  return this.findOneAndUpdate(
    { key },
    { $set: update, $setOnInsert: { key, createdAt: new Date() } },
    { upsert: true, new: true }
  );
};

// Static method to get Google OAuth credentials
GlobalConfigSchema.statics.getGoogleOAuthCredentials = async function() {
  const config = await this.getValue('google_oauth_credentials', {});
  return {
    clientId: config.clientId || process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: config.clientSecret || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
    successRedirect: process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT || '',
  };
};

module.exports = mongoose.model('GlobalConfig', GlobalConfigSchema);
