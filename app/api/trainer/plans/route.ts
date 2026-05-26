import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';
import TrainerPlan from '@/models/TrainerPlan';
import { verifyAuth } from '@/lib/auth';
import { trainerPlanSchema } from '@/schemas/trainerPlanSchema';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['trainer']);
    await connectDB();
    const trainer = await Trainer.findOne({ userId });
    if (!trainer) return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    const plans = await TrainerPlan.find({ trainerId: trainer._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: plans });
  } catch (error: unknown) {
    console.error('[TRAINER PLANS GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['trainer']);
    const body = await req.json();
    const parsed = trainerPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid plan data' }, { status: 400 });
    }
    await connectDB();
    const trainer = await Trainer.findOne({ userId });
    if (!trainer || trainer.status !== 'approved') {
      return NextResponse.json({ success: false, message: 'Trainer not approved' }, { status: 403 });
    }
    const plan = await TrainerPlan.create({ trainerId: trainer._id, ...parsed.data });
    return NextResponse.json({ success: true, data: plan.toObject() }, { status: 201 });
  } catch (error: unknown) {
    console.error('[TRAINER PLAN CREATE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
