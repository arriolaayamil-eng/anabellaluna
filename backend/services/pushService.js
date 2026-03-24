const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@anabellaluna.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Send push notification to a specific user
 * @param {string} userId
 * @param {{ title: string, body: string, url?: string, icon?: string }} payload
 * @returns {Promise<{ sent: number, failed: number }>}
 */
async function sendNotification(userId, payload) {
  const subs = await PushSubscription.find({ userId });
  let sent = 0;
  let failed = 0;

  const notificationPayload = JSON.stringify({
    title: payload.title || 'Anabella Luna',
    body: payload.body || '',
    url: payload.url || '/',
    icon: payload.icon || '/icons/icon-192.png',
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        notificationPayload
      );
      sent++;
    } catch (err) {
      failed++;
      // Remove invalid subscriptions (410 Gone or 404)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await PushSubscription.deleteOne({ _id: sub._id });
      }
    }
  }

  return { sent, failed };
}

/**
 * Send push notification to all users with a given role
 * @param {string} role - 'admin' | 'agent' | 'user'
 * @param {{ title: string, body: string, url?: string, icon?: string }} payload
 */
async function sendToRole(role, payload) {
  const subs = await PushSubscription.find({ role });
  const notificationPayload = JSON.stringify({
    title: payload.title || 'Anabella Luna',
    body: payload.body || '',
    url: payload.url || '/',
    icon: payload.icon || '/icons/icon-192.png',
  });

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          notificationPayload
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  return { sent, failed };
}

module.exports = { sendNotification, sendToRole };
