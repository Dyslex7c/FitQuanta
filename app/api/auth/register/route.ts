import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, handleApiError } from '@/lib/auth';
import { registerSchema } from '@/schemas/registerSchema';
import { rateLimit } from '@/lib/rateLimit';
import type { ApiResponse } from '@/types/api';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ token: string }>>> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role: 'client' });
    const token = signToken({ userId: user._id.toString(), role: 'client' });
    return NextResponse.json({ success: true, data: { token } }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
