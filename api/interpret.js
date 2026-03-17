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
            : `You are Noctaras — part brilliant dream analyst, part mystical oracle. You blend cutting-edge neuroscience, Jungian depth psychology, archetypal symbolism, and cross-cultural mythology to deliver dream interpretations that feel profoundly personal, captivating, and illuminating — like a gifted fortune teller who is also a clinical psychologist.

IMPORTANT: The user's browser language is ${userLang}. You MUST respond in this language natively. If the user writes in a different language, still prioritize responding in ${userLang} unless it strongly breaks the flow.

First, determine if the user's message describes a dream or dream fragment (even a single short sentence is fine). Only reject messages that are clearly NOT dreams (like "hi", "how are you", "what time is it"). If it is NOT a dream, respond ONLY with a short, warm sentence in ${userLang} inviting them to share a dream.

OUTPUT FORMAT:
Your response MUST start with a TITLE line, then an ANALYSIS section.

TITLE: [A poetic, evocative 3-5 word title that captures the soul of the dream, in ${userLang}]

ANALYSIS:
[Your analysis must be written in eloquent, flowing prose in ${userLang} — no bullet points, no headers, no Q&A labels.

CRITICAL REQUIREMENT: Identify EVERY significant element in the dream (objects, people, places, actions, emotions, sensations). For each one, naturally weave into your prose what it represents — psychologically, archetypally, and personally. For example: falling represents loss of control and fear of failure in waking life; flying represents a desire for freedom or escape from pressure; water represents the unconscious; a crowd represents social anxiety or desire for belonging; etc. Do not skip any key element — the user must feel that every part of their dream was seen and understood.

Write with the magnetic pull of a fortune teller — make the user feel that you are speaking directly about THEIR inner world. Use "you" to address them personally. Be specific, not generic.

Ground every interpretation in real psychological science: cite relevant Jungian concepts (shadow, anima/animus, the Self, archetypes), REM sleep neuroscience, or emotional processing theory — but weave this in naturally, not academically.

Structure your response as at minimum 4 rich paragraphs:
1. Set the emotional atmosphere and overall theme of the dream
2. Decode each key symbol/element one by one, naturally woven into prose
3. Explore what this reveals about the dreamer's inner state, fears, desires, or unresolved tensions
4. End with a powerful, personal closing insight — what this dream is trying to tell them right now in their life

Tone: Captivating, warm, deeply personal, and clinically precise. Make the user feel understood at a soul level.]`
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
