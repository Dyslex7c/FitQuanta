import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types/user';
import { env } from './env';

interface JWTPayload {
  userId: string;
  role: UserRole;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}

export function verifyAuth(
  req: NextRequest,
  allowedRoles: UserRole[]
): JWTPayload {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }
  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('UNAUTHORIZED');
  const payload = verifyToken(token);
  if (!allowedRoles.includes(payload.role)) {
    throw new Error('FORBIDDEN');
  }
  return payload;
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const clean = {} as T;
  for (const key in obj) {
    if (!key.startsWith('$') && !key.includes('.')) {
      clean[key] = obj[key];
    }
  }
  return clean;
}

export function sanitizeForPrompt(value: string): string {
  const dangerous = ['ignore', 'override', 'system:', 'assistant:', '[inst]', '</s>', '<|'];
  const trimmed = value.trim().slice(0, 150).replace(/<[^>]*>/g, '');
  const lower = trimmed.toLowerCase();
  for (const word of dangerous) {
    if (lower.includes(word)) return 'not provided';
  }
  return trimmed;
}

export function handleApiError(error: unknown): NextResponse<any> {
  console.error('[API ERROR]', error);
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    const errMsg = error.message || '';
    const errName = error.name || '';
    if (
      errName.includes('Mongo') ||
      errName.includes('Mongoose') ||
      errMsg.includes('Mongo') ||
      errMsg.includes('Mongoose') ||
      errMsg.includes('querySrv') ||
      errMsg.includes('ECONNREFUSED') ||
      errMsg.includes('ENOTFOUND') ||
      errMsg.includes('Could not connect')
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Database connection failed (${errName}: ${errMsg}). Please verify your internet connection, make sure your IP is whitelisted in MongoDB Atlas, and check your MONGODB_URI in .env.local.`
        },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
}

