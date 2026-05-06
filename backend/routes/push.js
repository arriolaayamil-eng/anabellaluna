const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { sendNotification, sendToRole } = require('../services/pushService');
const { authenticateToken } = require('../auth');

/**
 * Detects platform from User-Agent string.
 * @param {string} ua
 * @returns {'ios'|'android'|'desktop'|'unknown'}
 */
function detectPlatform(ua = '') {
  const lower = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(lower)) return 'ios';
  if (/android/.test(lower)) return 'android';
  if (/windows|macintosh|linux/.test(lower)) return 'desktop';
  return 'unknown';
}

// GET /api/push/vapid-public-key — public, no auth needed
router.get('/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  if (!key) {
    console.warn('[Push] VAPID_PUBLIC_KEY not configured');
  }
  res.json({ publicKey: key });
});

// POST /api/push/subscribe — save subscription (authenticated)
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, role, subscription, device } = req.body;

    if (!userId || !role || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Missing required fields: userId, role, subscription.endpoint, subscription.keys' });
    }

    const ua = device || req.headers['user-agent'] || '';
    const platform = detectPlatform(ua);

    // Upsert by endpoint to avoid duplicates
    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId,
          role,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          device: ua,
          userAgent: ua,
          platform,
          enabled: true,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[Push] Subscription saved — userId:${userId} role:${role} platform:${platform} id:${doc._id}`);
    res.json({ success: true, platform });
  } catch (err) {
    console.error('[Push] Subscribe error:', err);
    res.status(500).json({ error: 'Error saving subscription' });
  }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

    await PushSubscription.deleteOne({ endpoint });
    console.log('[Push] Subscription removed:', endpoint.slice(0, 60) + '...');
    res.json({ success: true });
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
    res.status(500).json({ error: 'Error removing subscription' });
  }
});

// POST /api/push/test — send test push to own user (authenticated)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.agenteId || req.user?.sub || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = await sendNotification(userId, {
      title: '🔔 Notificación de prueba',
      body: 'Si ves esto, las notificaciones push están funcionando correctamente.',
      url: '/',
      type: 'test',
    });

    console.log(`[Push] Test notification sent to userId:${userId} — sent:${result.sent} failed:${result.failed}`);
    res.json({ ...result, userId });
  } catch (err) {
    console.error('[Push] Test error:', err);
    res.status(500).json({ error: 'Error sending test notification' });
  }
});

// POST /api/push/send — send to specific user (authenticated, admin or self)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { userId, title, body, url, icon, type, entityId } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: 'Missing userId or title' });
    }

    const result = await sendNotification(userId, { title, body, url, icon, type, entityId });
    console.log(`[Push] Send to userId:${userId} — sent:${result.sent} failed:${result.failed}`);
    res.json(result);
  } catch (err) {
    console.error('[Push] Send error:', err);
    res.status(500).json({ error: 'Error sending notification' });
  }
});

// POST /api/push/send-role — send to all users of a role (authenticated)
router.post('/send-role', authenticateToken, async (req, res) => {
  try {
    const { role, title, body, url, icon, type, entityId } = req.body;
    if (!role || !title) {
      return res.status(400).json({ error: 'Missing role or title' });
    }

    const result = await sendToRole(role, { title, body, url, icon, type, entityId });
    console.log(`[Push] Send-role to role:${role} — sent:${result.sent} failed:${result.failed}`);
    res.json(result);
  } catch (err) {
    console.error('[Push] Send-role error:', err);
    res.status(500).json({ error: 'Error sending notifications' });
  }
});

// GET /api/push/subscriptions — list own subscriptions (authenticated)
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.agenteId || req.user?.sub || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const subs = await PushSubscription.find({ userId })
      .select('platform enabled device createdAt lastSeenAt')
      .lean();
    res.json(subs);
  } catch (err) {
    console.error('[Push] List subscriptions error:', err);
    res.status(500).json({ error: 'Error listing subscriptions' });
  }
});

module.exports = router;
