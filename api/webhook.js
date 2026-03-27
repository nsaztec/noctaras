import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // Creem payload: { id, eventType, created_at, object: { ... } }
  const eventType = req.body?.eventType;
  const obj = req.body?.object ?? {};
  const userEmail = obj?.customer?.email;

  if (!userEmail) {
    return res.status(400).json({ error: 'No user email' });
  }

  const status = obj?.status;
  const isPro = ACTIVATING.includes(eventType);

  try {
    const snapshot = await db.collection('users').where('email', '==', userEmail).get();

    if (snapshot.empty) {
      await db.collection('pending_pro').doc(userEmail).set({
        email: userEmail,
        event: eventType,
        subscriptionId: obj?.id,
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
        subscriptionId: obj?.id,
        subscriptionStatus: status || 'active',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (eventType === 'checkout.completed') {
        await resend.emails.send({
          from: 'Noctaras <noreply@noctaras.com>',
          to: userEmail,
          bcc: 'noctaras.com+7701671ee5@invite.trustpilot.com',
          subject: 'Welcome to Noctaras Pro!',
          html: `<p>Hi,</p>
<p>Thank you for subscribing to <strong>Noctaras Pro</strong>! Your account has been upgraded.</p>
<p>You now have access to unlimited dream interpretations, advanced AI analysis, and all premium features.</p>
<p>Start journaling at <a href="https://www.noctaras.com/app.html">noctaras.com</a>.</p>
<p>Sweet dreams,<br>The Noctaras Team</p>`,
        }).catch(err => console.error('Trustpilot email error:', err));
      }
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
