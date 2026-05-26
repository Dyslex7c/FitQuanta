import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/mongodb';
import TrainerPlan from '@/models/TrainerPlan';
import Purchase from '@/models/Purchase';
import Trainer from '@/models/Trainer';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ planId: z.string().min(1) });

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: 'planId required' }, { status: 400 });

    await connectDB();
    const plan = await TrainerPlan.findById(parsed.data.planId);
    if (!plan || !plan.isActive) {
      return NextResponse.json({ success: false, message: 'Plan not available' }, { status: 404 });
    }

    const trainer = await Trainer.findById(plan.trainerId);
    if (!trainer || trainer.status !== 'approved') {
      return NextResponse.json({ success: false, message: 'Trainer not available' }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (user && user.activeTrainerId && user.activeTrainerId.toString() !== trainer._id.toString()) {
      return NextResponse.json({
        success: false,
        message: 'You already have an active trainer subscription. Please leave your current trainer first.'
      }, { status: 400 });
    }

    const COMMISSION = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 15) / 100;
    const amountPaise = Math.round(plan.priceINR * 100);       /* Razorpay uses paise */
    const commission   = Math.round(plan.priceINR * COMMISSION * 100) / 100;
    const trainerEarns = plan.priceINR - commission;

    let orderId = '';
    const isMock = plan.priceINR === 0 || 
                   !process.env.RAZORPAY_KEY_ID || 
                   process.env.RAZORPAY_KEY_ID.includes('placeholder') || 
                   process.env.RAZORPAY_KEY_ID.includes('xxxxx');

    if (isMock) {
      orderId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    } else {
      try {
        const order = await razorpay.orders.create({
          amount:   amountPaise,
          currency: 'INR',
          receipt:  `receipt_${Date.now()}`,
          notes:    { planId: plan._id.toString(), clientId: userId, trainerId: trainer._id.toString() },
        });
        orderId = order.id;
      } catch (err) {
        console.warn('Razorpay order creation failed, falling back to mock payment for local development:', err);
        orderId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      }
    }

    const purchase = await Purchase.create({
      clientId:              userId,
      trainerId:             trainer._id,
      planId:                plan._id,
      planName:              plan.name,
      amountINR:             plan.priceINR,
      platformCommissionINR: commission,
      trainerEarningsINR:    trainerEarns,
      razorpayOrderId:       orderId,
      status:                'pending',
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId:   orderId,
        amount:    amountPaise,
        currency:  'INR',
        keyId:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        purchaseId: purchase._id.toString(),
        planName:  plan.name,
        trainerName: trainer.name,
      },
    });
  } catch (error: unknown) {
    console.error('[PAYMENT ORDER ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
