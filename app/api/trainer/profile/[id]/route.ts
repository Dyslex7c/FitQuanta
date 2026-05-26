import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';
import TrainerPlan from '@/models/TrainerPlan';
import Review from '@/models/Review';
import User from '@/models/User';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await connectDB();

    const trainer = await Trainer.findById(id).lean();
    if (!trainer || trainer.status !== 'approved') {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    const [plans, reviews] = await Promise.all([
      TrainerPlan.find({ trainerId: id, isActive: true }).lean(),
      Review.find({ trainerId: id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    /* Attach client names to reviews */
    const clientIds = reviews.map(r => r.clientId);
    const clients = await User.find({ _id: { $in: clientIds } }).select('name').lean();
    const clientMap: Record<string, string> = {};
    clients.forEach(c => { clientMap[c._id.toString()] = c.name; });

    const reviewsWithNames = reviews.map(r => ({
      ...r,
      clientName: clientMap[r.clientId.toString()] ?? 'Anonymous',
    }));

    return NextResponse.json({
      success: true,
      data: { trainer, plans, reviews: reviewsWithNames },
    });
  } catch (error: unknown) {
    console.error('[TRAINER PROFILE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
