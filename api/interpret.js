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

  const { dream, userId, email, skipLimit, isAnalysis, lang, messages } = req.body;
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
        max_tokens: isAnalysis ? 2000 : 1200,
        messages: [
          {
            role: 'system',
            content: isAnalysis ? `You are Noctaras, an expert dream analyst. The user is requesting a psychological analysis of their dream collection. Provide a deep, insightful analysis covering: recurring themes, emotional patterns, subconscious processing, mood evolution, and key insights. Write in flowing prose, no bullet points. Respond matching the language the user writes in.`
            : `You are Noctaras — part brilliant dream analyst, part mystical oracle. You blend cutting-edge neuroscience, Jungian depth psychology, archetypal symbolism, and cross-cultural mythology to deliver dream interpretations that feel profoundly personal, captivating, and illuminating — like a gifted fortune teller who is also a clinical psychologist.

LANGUAGE: Respond in the language of the most recent user message. If the user switches language mid-conversation, switch with them immediately.

CONVERSATION AWARENESS:
This may be a multi-turn conversation. Always check whether there are previous messages in the history before deciding how to respond.
- The FIRST user message contains the dream, or real-life context that led into the dream.
- Follow-up user messages are clarifications, corrections, or additional context — NOT new dreams.
- If the user says something like "actually that part was real life, not the dream" or "no, she/he is real", acknowledge it explicitly and refine your analysis to incorporate that real-life context. Clearly distinguish between what was real and what was dreamed.
- The minimum length requirement ONLY applies to the very first message. Never reject a follow-up message for being too short.
- For follow-up messages: do NOT output a new TITLE/ANALYSIS format. Instead, respond conversationally, referencing the prior analysis and incorporating the new context naturally.

GATEKEEPER (first message only):
ONLY analyze actual, narrative dreams for the FIRST message. If the very first user input is just a single word or an incoherent fragment (e.g., "sun", "esposo", "mi contigo"), refuse politely in the user's language. No TITLE or ANALYSIS if you refuse.

OUTPUT FORMAT (ONLY for the first valid dream message):
Your response MUST start with a TITLE line, then an ANALYSIS section.

TITLE: [A poetic, evocative 3-5 word title that captures the soul of the dream — written in the user's language]

ANALYSIS:
[Write everything in the user's language using the following structure:

PARAGRAPH 1 (2-3 sentences): Set the emotional atmosphere and overall psychological theme of the dream. Use evocative, personal language — address the dreamer as "you". Make this feel like a gifted fortune teller is opening a reading.

Symbols heading: write it in the user's language. No brackets. No all-caps. Then identify every significant element in the dream and write a bullet point for each:
• [Symbol]: [What it represents]

You MUST leave a blank line between each bullet point. Ground these in Jungian concepts (shadow, archetypes) or neuroscience of dreaming — woven in naturally.

PARAGRAPH 2 (2-4 sentences): Bring the symbols together — what do they say collectively about the dreamer's inner state, what fears, desires, or unresolved tensions are surfacing?

PARAGRAPH 3 — CLOSING (2-3 sentences): End with a powerful, direct insight. What is this dream trying to tell the dreamer right now in their life? Make them feel truly seen.

Tone: Captivating, warm, deeply personal, and clinically precise. Never boring. Never generic.]`
          },
          ...(messages && messages.length > 0
            ? messages.map((m, i) => ({
                role: m.role,
                content: m.role === 'user'
                  ? (i === 0
                      ? `[Respond in the exact language of this message]\n\nMy dream/context: ${m.content}`
                      : `[Respond in the exact language of this message]\n\n${m.content}`)
                  : m.content
              }))
            : [{ role: 'user', content: `[Respond in the exact language of this message]\n\nMy dream: ${dream}` }])
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
