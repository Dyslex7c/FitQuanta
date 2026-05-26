import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';
import TrainerPlan from '@/models/TrainerPlan';
import { verifyAuth } from '@/lib/auth';
import { trainerPlanSchema } from '@/schemas/trainerPlanSchema';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ planId: string }> }): Promise<NextResponse> {
  try {
    const { planId } = await params;
    const { userId } = verifyAuth(req, ['trainer']);
    const body = await req.json();
    const parsed = trainerPlanSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    await connectDB();
    const trainer = await Trainer.findOne({ userId });
    if (!trainer) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const plan = await TrainerPlan.findOneAndUpdate(
      { _id: planId, trainerId: trainer._id },
      parsed.data,
      { new: true }
    );
    if (!plan) return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: plan.toObject() });
  } catch (error: unknown) {
    console.error('[TRAINER PLAN UPDATE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ planId: string }> }): Promise<NextResponse> {
  try {
    const { planId } = await params;
    const { userId } = verifyAuth(req, ['trainer']);
    await connectDB();
    const trainer = await Trainer.findOne({ userId });
    if (!trainer) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    await TrainerPlan.findOneAndDelete({ _id: planId, trainerId: trainer._id });
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    console.error('[TRAINER PLAN DELETE ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
