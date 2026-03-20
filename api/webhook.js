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

  // Verify Creem webhook signature
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const signature = req.headers['creem-signature'];

  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
    if (digest !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const eventType = req.body?.type;
  const data = req.body?.data;

  // Get user email from the payload
  const userEmail = data?.customer?.email;
  if (!userEmail) {
    return res.status(400).json({ error: 'No user email' });
  }

  const status = data?.status;
  const isPro = status === 'active' || status === 'trialing';

  try {
    // Find user by email in Firestore
    const snapshot = await db.collection('users').where('email', '==', userEmail).get();

    if (snapshot.empty) {
      // Store pending pro status — user will claim it on next login
      await db.collection('pending_pro').doc(userEmail).set({
        email: userEmail,
        event: eventType,
        subscriptionId: data?.id,
        status,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true, note: 'Stored as pending' });
    }

    const userId = snapshot.docs[0].id;

    if (eventType === 'subscription.created' || eventType === 'subscription.updated' || eventType === 'checkout.completed') {
      await db.collection('users').doc(userId).set({
        email: userEmail,
        isPro,
        subscriptionId: data?.id,
        subscriptionStatus: status,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (eventType === 'subscription.deleted') {
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
