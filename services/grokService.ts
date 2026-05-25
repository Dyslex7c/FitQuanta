// ── services/grokService.ts ─────────────────────────────────────────────────
// Chatbot AI service — uses Groq SDK (already installed in the project).
// Reuses the existing GROQ_API_KEY — no new API keys needed.
// Does NOT import or touch any existing lib/, models/, or redux code.
// ────────────────────────────────────────────────────────────────────────────

import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// llama-3.3-70b-versatile is fast, free-tier friendly, and highly capable
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are FitBot, an AI fitness assistant for FitQuanta — a futuristic fitness platform.

Your role:
• Help users with general fitness guidance, workout consistency, and beginner exercise questions
• Suggest home workout ideas and bodyweight routines
• Give hydration and sleep reminders
• Advise on missed workout adjustments (e.g. lighter session next day)
• Give simple calorie and protein ballpark suggestions for general fitness goals
• Provide motivation, habit-building strategies, and mental wellness tips for fitness
• Answer questions about meal timing adjustments (e.g. what to eat before/after workouts)

Hard rules you MUST always follow:
1. NEVER provide medical advice, diagnose conditions, or suggest treatments.
2. NEVER recommend extreme diets, starvation, or dangerous workout intensities.
3. If a user mentions injuries, severe pain, medical conditions, diseases, chest pain, shortness of breath, or any serious symptom — immediately and politely decline to advise and strongly recommend they consult a certified trainer or doctor.
4. Keep responses concise, friendly, and motivating. Use bullet points for clarity.
5. If unsure, say so — never fabricate facts or medical claims.
6. You have NO access to the user's actual stored workout plans, logs, or personal data. Do not pretend otherwise.

Tone: Energetic, supportive, science-literate but approachable. Think "knowledgeable gym buddy", not "doctor".`;

export async function sendMessageToGroq(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    max_tokens:  700,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('Empty response from Groq API');
  }
  return content.trim();
}
