// ── app/api/chatbot/route.ts ────────────────────────────────────────────────
// Completely isolated chatbot API route.
// Does NOT use connectDB, User models, verifyAuth, or any existing API helpers.
// ────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToGroq, type ChatMessage } from '@/services/grokService';

// Simple per-IP rate limit: max 30 messages per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 30;
const WINDOW_MS    = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now  = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many messages. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request format.' },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = body.messages;

    // Validate each message shape
    const valid = messages.every(
      (m) =>
        m &&
        typeof m === 'object' &&
        ['user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    );
    if (!valid || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid messages array.' },
        { status: 400 }
      );
    }

    // Enforce max history window (last 20 messages) to keep tokens in check
    const trimmedMessages = messages.slice(-20);

    // Reuse the existing GROQ_API_KEY — no separate key needed
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[ChatBot] GROQ_API_KEY is not set in environment variables.');
      return NextResponse.json(
        { success: false, message: 'Chatbot is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const reply = await sendMessageToGroq(trimmedMessages, apiKey);

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error: unknown) {
    console.error('[ChatBot API Error]', error);
    const message =
      error instanceof Error && error.message.includes('429')
        ? 'AI service is currently busy. Please try again in a moment.'
        : 'Something went wrong. Please try again.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
