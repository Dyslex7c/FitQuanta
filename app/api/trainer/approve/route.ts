import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  trainerId: z.string().min(1),
  action:    z.enum(['approve','reject','suspend']),
  adminNote: z.string().max(500).optional().default(''),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { role } = verifyAuth(req, ['admin']);
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const trainers = await Trainer.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, data: trainers });
  } catch (error: unknown) {
    console.error('[PENDING TRAINERS GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { role } = verifyAuth(req, ['admin']);
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
    }

    const { trainerId, action, adminNote } = parsed.data;
    await connectDB();

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      approve: 'approved', reject: 'rejected', suspend: 'suspended',
    };
    trainer.status    = statusMap[action] as 'approved' | 'rejected' | 'suspended';
    trainer.adminNote = adminNote;
    await trainer.save();

    /* Notify the trainer */
    const notifMsg: Record<'approve' | 'reject' | 'suspend', string> = {
      approve: 'Congratulations! Your trainer profile has been approved. You can now create plans and accept clients.',
      reject:  `Your trainer application was not approved. Reason: ${adminNote || 'Does not meet requirements.'}`,
      suspend: `Your trainer account has been suspended. Reason: ${adminNote || 'Policy violation.'}`,
    };

    await Notification.create({
      userId:  trainer.userId,
      type:    'approval',
      title:   action === 'approve' ? 'Profile Approved!' : action === 'reject' ? 'Application Rejected' : 'Account Suspended',
      message: notifMsg[action],
      link:    '/trainer/dashboard',
    });

    return NextResponse.json({ success: true, data: { status: trainer.status } });
  } catch (error: unknown) {
    console.error('[TRAINER APPROVE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
