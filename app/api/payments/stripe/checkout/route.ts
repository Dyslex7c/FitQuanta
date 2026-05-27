import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import TrainerPlan from '@/models/TrainerPlan';
import Purchase from '@/models/Purchase';
import Trainer from '@/models/Trainer';
import User from '@/models/User';
import { verifyAuth, handleApiError } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ planId: z.string().min(1) });

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'planId required' }, { status: 400 });
    }

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
    const commission = Math.round(plan.priceINR * COMMISSION * 100) / 100;
    const trainerEarns = plan.priceINR - commission;

    const isMock = !process.env.STRIPE_SECRET_KEY || 
                   process.env.STRIPE_SECRET_KEY.includes('placeholder') || 
                   process.env.STRIPE_SECRET_KEY.includes('xxxxx');

    // 1. Create a pending purchase first
    const mockOrderId = `pending_stripe_order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const purchase = await Purchase.create({
      clientId:              userId,
      trainerId:             trainer._id,
      planId:                plan._id,
      planName:              plan.name,
      amountINR:             plan.priceINR,
      platformCommissionINR: commission,
      trainerEarningsINR:    trainerEarns,
      razorpayOrderId:       mockOrderId, // Temporarily save mock ID until session created
      status:                'pending',
    });

    let checkoutUrl = '';

    if (isMock) {
      // Simulate Stripe checkout redirect url for local testing
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const mockSessionId = `mock_stripe_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      purchase.razorpayOrderId = mockSessionId;
      await purchase.save();

      checkoutUrl = `${appUrl}/payments/stripe-checkout?session_id=${mockSessionId}&purchase_id=${purchase._id.toString()}&plan_name=${encodeURIComponent(plan.name)}&amount=${plan.priceINR}&trainer_name=${encodeURIComponent(trainer.name)}`;
    } else {
      // Create Stripe Session
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.12' as any,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `${plan.name} - FitQuanta Coaching`,
                description: `Coaching package with Coach ${trainer.name} for ${plan.durationWeeks} weeks.`,
              },
              unit_amount: Math.round(plan.priceINR * 100), // in paise / cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/stripe/verify?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase._id.toString()}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/trainer/${trainer._id.toString()}`,
        metadata: {
          purchaseId: purchase._id.toString(),
          clientId: userId,
        },
      });

      purchase.razorpayOrderId = session.id;
      await purchase.save();

      checkoutUrl = session.url || '';
    }

    return NextResponse.json({
      success: true,
      data: {
        url: checkoutUrl,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
