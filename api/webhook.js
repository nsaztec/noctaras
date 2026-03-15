import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify LemonSqueezy webhook signature
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
    if (digest !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { meta, data } = req.body;
  const eventName = meta?.event_name;

  // Get user email from the order
  const userEmail = data?.attributes?.user_email;
  if (!userEmail) {
    return res.status(400).json({ error: 'No user email' });
  }

  try {
    // Find user by email in Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).get();

    if (snapshot.empty) {
      // Store pending pro status by email (user will claim it on next login)
      await db.collection('pending_pro').doc(userEmail).set({
        email: userEmail,
        event: eventName,
        variantId: data?.attributes?.variant_id,
        subscriptionId: data?.attributes?.id,
        status: data?.attributes?.status,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true, note: 'Stored as pending' });
    }

    const userId = snapshot.docs[0].id;

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const status = data?.attributes?.status;
      const isPro = status === 'active' || status === 'trialing';

      await db.collection('users').doc(userId).set({
        email: userEmail,
        isPro,
        subscriptionId: data?.attributes?.id,
        variantId: data?.attributes?.variant_id,
        subscriptionStatus: status,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      await db.collection('users').doc(userId).set({
        isPro: false,
        subscriptionStatus: 'cancelled',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}

