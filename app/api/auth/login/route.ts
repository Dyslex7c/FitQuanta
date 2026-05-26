import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, handleApiError } from '@/lib/auth';
import { loginSchema } from '@/schemas/loginSchema';
import { rateLimit } from '@/lib/rateLimit';
import type { ApiResponse } from '@/types/api';
import type { IUserProfile } from '@/types/user';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ token: string; user: IUserProfile }>>> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
    }
    const { email, password, role, turnstileToken } = parsed.data;
    /* Verify Turnstile CAPTCHA token */
    const turnstile = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json({ success: false, message: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
    }
    await connectDB();
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    /* Enforce visual access mode validation */
    if (role) {
      if (role === 'trainer' && user.role !== 'trainer') {
        return NextResponse.json({ success: false, message: 'This account is not registered as a trainer.' }, { status: 403 });
      }
      if (role === 'client' && user.role === 'trainer') {
        return NextResponse.json({ success: false, message: 'This account is not registered as a standard user.' }, { status: 403 });
      }
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });
    const userObj = user.toObject();
    delete (userObj as any).password;
    return NextResponse.json({ success: true, data: { token, user: userObj as unknown as IUserProfile } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
