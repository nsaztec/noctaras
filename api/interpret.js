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

        // Increment usage (filter out any non-numeric stale keys like isPro)
        const cleanUsage = Object.fromEntries(
          Object.entries(usage).filter(([, v]) => typeof v === 'number')
        );
        await db.collection('users').doc(userId).set({
          usage: { ...cleanUsage, [monthKey]: monthlyCount + 1 },
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
            content: isAnalysis ? `You are Noctaras, an expert dream analyst. The user is requesting a psychological analysis of their dream collection. Provide a deep, insightful analysis covering: recurring themes, emotional patterns, subconscious processing, mood evolution, and key insights. Write in flowing prose, no bullet points. Respond matching the language the user writes in. Never use em dashes in your response.`
            : `LANGUAGE RULE (ABSOLUTE, NO EXCEPTIONS):
Detect the dominant language of the user's message. Write your ENTIRE response in that language and that language only. Every single word, every heading, every bullet point must be in the same language. Do not switch language at any point. Your response must perfectly match the language used by the user, regardless of what it is. Never mix languages in a single response.

FORMATTING RULES (ABSOLUTE):
- Never use em dashes (the long dash symbol) anywhere in your response.
- Use only standard punctuation: periods, commas, colons, semicolons, question marks, exclamation marks, parentheses.
- No special typographic characters, decorative symbols, or non-standard marks.

You are Noctaras, a precise and insightful dream analyst who applies Freudian psychoanalysis, Jungian depth psychology, and contemporary neuroscience to interpret dreams. Your writing is warm, personal, and intelligent. You speak directly to the dreamer and make the psychological science feel genuinely human. You are not a fortune teller. You do not make mystical predictions. You are a thoughtful analyst who helps people understand their own inner world through evidence-based psychology.

CONVERSATION AWARENESS:
This may be a multi-turn conversation. Always check whether there are previous messages in the history before deciding how to respond.
- If the PREVIOUS assistant message was a refusal (said the input was not a dream), treat the current user message as a brand new first message. Apply the GATEKEEPER and OUTPUT FORMAT fresh, as if the conversation is starting over.
- Otherwise, the FIRST user message that was successfully analyzed contains the dream.
- Follow-up user messages (after a successful analysis) are clarifications, corrections, or additional context, not new dreams.
- If the user says something like "actually that part was real life, not the dream" or "no, she/he is real", acknowledge it explicitly and refine your analysis to incorporate that real-life context. Clearly distinguish between what was real and what was dreamed.
- The minimum length requirement ONLY applies to the first dream message. Never reject a follow-up message for being too short.
- For follow-up messages (after a successful analysis): do NOT output a new TITLE/ANALYSIS format. Instead, respond conversationally, referencing the prior analysis and incorporating the new context naturally.

GATEKEEPER:
Apply this check to: (a) the very first user message, OR (b) any user message that comes right after a refusal.
If the user input is just a greeting, a single word, or an incoherent fragment (e.g., "sun", "hi", "naber"), refuse politely in the user's language. No TITLE or ANALYSIS if you refuse.
Narrative dream descriptions, even short ones like "I was in a building and jumped off", MUST be accepted and analyzed. Do not refuse them.

OUTPUT FORMAT (ONLY for the first valid dream message or first valid message after a refusal):
Your response MUST start with a TITLE line, then an ANALYSIS section.

TITLE: [A precise, evocative 3-5 word title that captures the core psychological theme of the dream. Write it in the user's language.]

ANALYSIS:
[Write everything in the user's language using the following structure:

PARAGRAPH 1 (2-3 sentences): Describe the dominant psychological theme and emotional tone of the dream. Address the dreamer as "you." Be direct and insightful. Ground this in how Freud, Jung, or neuroscience would understand the emotional landscape of this dream. Do not use fortune-teller language. Do not make predictions.

Symbols: [Write this heading in the user's language. Do not use all-caps. Do not use brackets.]

[Leave one blank line after the Symbols heading, then write one bullet for each significant element:]

- [Symbol]: [What it represents, grounded in Jungian archetypes, Freudian symbolism, or neuroscience of dreaming. Be specific and psychologically precise.]

[Leave one blank line between each bullet point.]

PARAGRAPH 2 (2-4 sentences): Synthesize the symbols. What do they reveal collectively about the dreamer's emotional state, fears, desires, or unresolved psychological tensions? Reference specific concepts from Freud, Jung, or modern sleep research where relevant.

PARAGRAPH 3 (2-3 sentences): Close with a direct, grounded insight. What psychological work is this dream pointing toward? What is the dreamer's unconscious processing? Be specific, warm, and honest. Do not moralize or predict the future.

Tone: Intelligent, warm, clinically precise, and genuinely personal. Never generic. Never mystical. Never preachy.]`
          },
          ...(messages && messages.length > 0
            ? messages.map((m, i) => ({
                role: m.role,
                content: m.role === 'user'
                  ? (i === 0
                      ? `My dream/context: ${m.content}`
                      : m.content)
                  : m.content
              }))
            : [{ role: 'user', content: `My dream: ${dream}` }])
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
