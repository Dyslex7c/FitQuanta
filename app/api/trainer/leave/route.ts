import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Trainer from '@/models/Trainer';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (!user.activeTrainerId) {
      return NextResponse.json({ success: false, message: 'You do not have an active trainer subscription.' }, { status: 400 });
    }

    const trainerId = user.activeTrainerId;

    // Remove activeTrainerId from client
    user.activeTrainerId = null;
    await user.save();

    // Find trainer to decrement active clients (optional) or notify
    const trainer = await Trainer.findById(trainerId);
    if (trainer) {
      // Notify trainer
      await Notification.create({
        userId: trainer.userId,
        type: 'system',
        title: 'Subscription Cancelled',
        message: `Your client ${user.name} has cancelled their active subscription.`,
        link: '/trainer/dashboard',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left trainer. You are now free to choose another coach!',
    });
  } catch (error: unknown) {
    console.error('[TRAINER LEAVE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
