import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import Chat from '@/models/Chat';
import Notification from '@/models/Notification';
import Trainer from '@/models/Trainer';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  razorpay_order_id:   z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature:  z.string(),
  purchaseId:          z.string(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId } = parsed.data;

    const isMock = razorpay_order_id.startsWith('mock_order_') || razorpay_signature === 'mock_signature';

    if (!isMock) {
      /* Verify Razorpay signature */
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
      }
    }

    await connectDB();
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase || purchase.clientId.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    }

    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.razorpaySignature = razorpay_signature;
    purchase.status            = 'completed';
    await purchase.save();

    /* Set active trainer on client user record */
    await User.findByIdAndUpdate(userId, { activeTrainerId: purchase.trainerId });

    /* Create chat conversation between client and trainer */
    const existingChat = await Chat.findOne({ clientId: userId, trainerId: purchase.trainerId });
    let chat = existingChat;
    if (!chat) {
      chat = await Chat.create({
        clientId:   userId,
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

    return NextResponse.json({
      success: true,
      data: { conversationId: chat._id.toString() },
    });
  } catch (error: unknown) {
    console.error('[PAYMENT VERIFY ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
