import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import Chat from '@/models/Chat';
import Notification from '@/models/Notification';
import Trainer from '@/models/Trainer';
import User from '@/models/User';
import { handleApiError } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const purchaseId = searchParams.get('purchase_id');

    if (!sessionId || !purchaseId) {
      return NextResponse.json({ success: false, message: 'session_id and purchase_id are required' }, { status: 400 });
    }

    const isMock = sessionId.startsWith('mock_stripe_session_') &&
                   (!process.env.STRIPE_SECRET_KEY || 
                    process.env.STRIPE_SECRET_KEY.includes('placeholder'));

    if (!isMock) {
      // Verify with Stripe API
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.12' as any,
      });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
      }
    }

    // Complete purchase in database
    await connectDB();
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ success: false, message: 'Purchase record not found' }, { status: 404 });
    }

    if (purchase.status !== 'completed') {
      purchase.status = 'completed';
      purchase.razorpayPaymentId = isMock ? `mock_stripe_pay_${Date.now()}` : sessionId;
      purchase.razorpaySignature = 'stripe_verified';
      await purchase.save();

      /* Set active trainer on client user record */
      await User.findByIdAndUpdate(purchase.clientId, { activeTrainerId: purchase.trainerId });

      /* Create chat conversation between client and trainer */
      const existingChat = await Chat.findOne({ clientId: purchase.clientId, trainerId: purchase.trainerId });
      let chat = existingChat;
      if (!chat) {
        chat = await Chat.create({
          clientId:   purchase.clientId,
          trainerId:  purchase.trainerId,
          planId:     purchase.planId,
          purchaseId: purchase._id,
        });
      }

      /* Update trainer client count */
      await Trainer.findByIdAndUpdate(purchase.trainerId, { $inc: { clientsTrained: 1 } });

      /* Notify trainer */
      await Notification.create({
        userId:  purchase.trainerId,
        type:    'purchase',
        title:   'New Client!',
        message: `A client has purchased your plan "${purchase.planName}". Check your chat.`,
        link:    `/chat/${chat._id}`,
      });

      // Redirect client user directly to the new chat page
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${appUrl}/chat/${chat._id.toString()}`);
    }

    // If already completed, redirect anyway to avoid breaking reload flow
    const existingChat = await Chat.findOne({ clientId: purchase.clientId, trainerId: purchase.trainerId });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/chat/${existingChat?._id?.toString() || ''}`);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
