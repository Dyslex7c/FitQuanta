import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Trainer from '@/models/Trainer';
import Notification from '@/models/Notification';
import { trainerRegisterSchema } from '@/schemas/trainerRegisterSchema';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { rateLimit } from '@/lib/rateLimit';
import type { ApiResponse } from '@/types/api';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`trainer-register:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = trainerRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
    }

    const { email, password, name, turnstileToken, ...trainerFields } = parsed.data;

    /* Verify Turnstile CAPTCHA token */
    const turnstile = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json({ success: false, message: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role: 'trainer', onboardingComplete: true });

    await Trainer.create({ userId: user._id, name, ...trainerFields, status: 'pending' });

    /* Notify admins — fetch all admin users and create notifications */
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      await Notification.insertMany(admins.map(a => ({
        userId:  a._id,
        type:    'approval',
        title:   'New Trainer Application',
        message: `${name} has applied to become a trainer. Review and approve their profile.`,
        link:    '/admin/trainers',
      })));
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Application submitted. You will be notified once approved by admin.' },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[TRAINER REGISTER ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
