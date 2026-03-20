import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

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

const ACTIVATING = ['checkout.completed', 'subscription.created', 'subscription.updated', 'subscription.active', 'subscription.trialing', 'subscription.paid'];
const CANCELLING = ['subscription.deleted', 'subscription.cancelled', 'subscription.expired'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Creem webhook signature
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const signature = req.headers['creem-signature'];
  if (secret && signature) {
    const digest = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (digest !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const eventType = req.body?.type;
  const data = req.body?.data;

  // Creem may nest data under data.object — try both
  const obj = data?.object ?? data ?? {};

  // Try all known email locations in Creem payloads
  const userEmail =
    obj?.customer?.email ||
    obj?.customer_email ||
    data?.customer?.email ||
    data?.customer_email ||
    req.body?.customer?.email ||
    req.body?.customer_email;

  if (!userEmail) {
    // Return full payload so we can see the structure
    return res.status(400).json({ error: 'No user email', payload: req.body });
  }

  const status = obj?.status ?? data?.status;
  const isPro = ACTIVATING.includes(eventType);

  try {
    const snapshot = await db.collection('users').where('email', '==', userEmail).get();

    if (snapshot.empty) {
      await db.collection('pending_pro').doc(userEmail).set({
        email: userEmail,
        event: eventType,
        subscriptionId: obj?.id ?? data?.id,
        status: isPro ? 'active' : status,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true, note: 'Stored as pending' });
    }

    const userId = snapshot.docs[0].id;

    if (ACTIVATING.includes(eventType)) {
      await db.collection('users').doc(userId).set({
        email: userEmail,
        isPro: true,
        subscriptionId: obj?.id ?? data?.id,
        subscriptionStatus: status || 'active',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (CANCELLING.includes(eventType)) {
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
