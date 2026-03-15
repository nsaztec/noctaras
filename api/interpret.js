import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
const FREE_LIMIT = 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dream, userId, email, skipLimit } = req.body;
  if (!dream) return res.status(400).json({ error: 'No dream provided' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  // Check usage limit if userId provided
  if (userId && !skipLimit) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() || {};

      // Pro users have unlimited access
      if (!userData.isPro) {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const usage = userData.usage || {};
        const monthlyCount = usage[monthKey] || 0;

        if (monthlyCount >= FREE_LIMIT) {
          return res.status(403).json({
            error: 'limit_reached',
            message: 'You have reached your free monthly limit.',
            count: monthlyCount,
            limit: FREE_LIMIT,
          });
        }

        // Increment usage
        await db.collection('users').doc(userId).set({
          usage: { ...usage, [monthKey]: monthlyCount + 1 },
          email: email || userData.email || '',
        }, { merge: true });
      }
    } catch (e) {
      console.error('Usage check error:', e);
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: `You are Noctaras, an expert dream analyst combining Jungian depth psychology, neuroscience of dreaming, archetypal symbolism, and cross-cultural mythology.

First, determine if the user's message describes a dream or dream fragment. If it does NOT contain dream content (e.g. greetings, questions, random messages), respond ONLY with this exact message in the user's language: "I'm here to interpret your dreams. Describe a dream you've had — any detail you remember — and I'll reveal what your subconscious is telling you."

If it IS a dream, analyze it with depth proportional to its complexity. A short dream gets a focused, concise interpretation. A detailed dream gets a fuller analysis. Never pad or repeat yourself.

Structure your response with these markers:

✦ CORE THEME
One precise sentence naming the central psychological tension this dream represents.

✦ SYMBOL ANALYSIS
For each key element (person, animal, object, place, action): explain its specific psychological and symbolic meaning. Be precise — if they saw a wolf, explain wolf symbolism specifically (Jungian shadow, instinct, pack dynamics), not generic symbolism.

✦ SUBCONSCIOUS MESSAGE
What this dream is processing — connect the symbols into a coherent psychological narrative tied to real inner states.

✦ REFLECT ON
1-2 specific questions for the dreamer based on this exact dream.

Detect the language the user wrote in and respond in that same language. Flowing intelligent prose, no bullet points, no markdown. Match response length to dream complexity — concise for simple dreams, thorough for complex ones.`
          },
          {
            role: 'user',
            content: `My dream: ${dream}`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'OpenAI error' });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || 'The stars kept their secrets tonight...';
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
