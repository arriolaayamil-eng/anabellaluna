const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Use an explicit placeholder so the developer is prompted to set a real URI in .env
const DEFAULT_PLACEHOLDER = 'mongodb://<username>:<password>@host:27017/<database>?retryWrites=true&w=majority';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_PLACEHOLDER;

// Helper to mask credentials when logging the URI
function maskMongoUri(uri) {
  try {
    // basic mask: replace credentials between // and @ if present
    return uri.replace(/:\/\/([^@]+)@/, '://<credentials>@');
  } catch (e) {
    return uri;
  }
}

if (MONGODB_URI === DEFAULT_PLACEHOLDER) {
  console.warn('\nWARNING: MONGODB_URI is not set. Using placeholder value.');
  console.warn('Please create a `.env` file in `backend/` with a real MONGODB_URI.');
}

const MAX_RETRIES = parseInt(process.env.DB_CONNECT_RETRIES || '5', 10);
const BASE_DELAY_MS = parseInt(process.env.DB_CONNECT_BACKOFF_MS || '1000', 10);

let attempt = 0;

function connectWithRetry() {
  attempt += 1;
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('Connected to MongoDB:', maskMongoUri(MONGODB_URI));
    })
    .catch((err) => {
      const msg = err && err.message ? err.message : String(err);
      console.error(`MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`, msg);
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying MongoDB connection in ${delay}ms...`);
        setTimeout(connectWithRetry, delay);
        return;
      }
      // reached max retries
      if ((process.env.NODE_ENV || 'development') === 'production') {
        console.error('Max MongoDB connection retries reached in production; exiting.');
        process.exit(1);
      }
      console.warn('Max MongoDB connection retries reached; continuing without DB (development mode).');
    });
}

// Attach connection event handlers for clearer logging
mongoose.connection.on('error', (e) => {
  console.error('Mongoose connection error event:', e && e.message ? e.message : e);
});
mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from MongoDB.');
});

// Start initial connection attempts
connectWithRetry();

module.exports = mongoose;
