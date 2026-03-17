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

  const { dream, userId, email, skipLimit, isAnalysis, lang } = req.body;
  const userLang = lang || 'en-US';
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
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: isAnalysis ? `You are Noctaras, an expert dream analyst. The user is requesting a psychological analysis of their dream collection. Provide a deep, insightful analysis covering: recurring themes, emotional patterns, subconscious processing, mood evolution, and key insights. Write in flowing prose, no bullet points. Respond in the user's browser language: ${userLang}.` 
            : `You are Noctaras, an expert dream analyst combining Jungian depth psychology, neuroscience of dreaming, archetypal symbolism, and cross-cultural mythology.

IMPORTANT: The user's browser language is ${userLang}. You MUST respond in this language natively. If the user writes in a different language, still prioritize responding in ${userLang} unless it strongly breaks the flow.

First, determine if the user's message describes a dream or dream fragment (e.g. 1 short sentence is perfectly fine). Only reject messages that are clearly NOT dreams (like "hi", "how are you"). If it is NOT a dream, respond ONLY with a short, polite sentence in ${userLang} asking them to describe a dream.

IMPORTANT - OUTPUT FORMAT:
Your response MUST be divided into exactly two sections: TITLE and ANALYSIS.

TITLE: [Generate a poetic, intriguing 3-5 word title for the dream in ${userLang}]
ANALYSIS:
[Write a deep, profound psychological analysis of the dream in ${userLang}.
DO NOT use hardcoded English headers (like "CORE THEME", etc.).
CRITICAL: For every major symbol in the dream, you MUST use a Q&A format in ${userLang} as natural text.
Example (if the language is Turkish and the symbol is Deniz):
Rüyadaki Deniz'in anlamı ne?
Deniz, bilinçdışının uçsuz bucaksız derinliklerini temsil eder. Bu dalgaların boyutu...

Conclude with what this dream is trying to tell the dreamer. Use a compassionate but highly clinical and psychological tone. Avoid generic interpretations. Seek deep Jungian archetypes.]`
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
