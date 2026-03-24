const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { sendNotification, sendToRole } = require('../services/pushService');

// GET /api/push/vapid-public-key — public, no auth needed
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, role, subscription, device } = req.body;

    if (!userId || !role || !subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ error: 'Missing required fields: userId, role, subscription' });
    }

    // Upsert by endpoint to avoid duplicates
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId,
        role,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        device: device || '',
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Error saving subscription' });
  }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

    await PushSubscription.deleteOne({ endpoint });
    res.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Error removing subscription' });
  }
});

// POST /api/push/send — admin-only, send to specific user
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, url, icon } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: 'Missing userId or title' });
    }

    const result = await sendNotification(userId, { title, body, url, icon });
    res.json(result);
  } catch (err) {
    console.error('Push send error:', err);
    res.status(500).json({ error: 'Error sending notification' });
  }
});

// POST /api/push/send-role — admin-only, send to all users of a role
router.post('/send-role', async (req, res) => {
  try {
    const { role, title, body, url, icon } = req.body;
    if (!role || !title) {
      return res.status(400).json({ error: 'Missing role or title' });
    }

    const result = await sendToRole(role, { title, body, url, icon });
    res.json(result);
  } catch (err) {
    console.error('Push send-role error:', err);
    res.status(500).json({ error: 'Error sending notifications' });
  }
});

module.exports = router;
