import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Notification from '@/models/Notification';
import Chat from '@/models/Chat';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const requestSchema = z.object({
  conversationId: z.string().min(1),
  clientUserId:   z.string().min(1),
});

const responseSchema = z.object({
  conversationId: z.string().min(1),
  approved:       z.boolean(),
  phoneNumber:    z.string().max(20).optional(),
  trainerUserId:  z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, role } = verifyAuth(req, ['trainer', 'client']);
    const body = await req.json();

    await connectDB();

    if (role === 'trainer') {
      const parsed = requestSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });

      const systemMsg = await Message.create({
        conversationId: parsed.data.conversationId,
        senderId:       userId,
        senderRole:     'trainer',
        content:        'Trainer has requested your mobile number for better communication.',
        type:           'phone_request',
      });

      await Notification.create({
        userId:  parsed.data.clientUserId,
        type:    'phone_request',
        title:   'Phone Number Request',
        message: 'Your trainer has requested your mobile number.',
        link:    `/chat/${parsed.data.conversationId}`,
      });

      return NextResponse.json({ success: true, data: systemMsg.toObject() }, { status: 201 });
    }

    /* Client sends consent response */
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });

    const content = parsed.data.approved
      ? `Client has shared their number: ${parsed.data.phoneNumber}`
      : 'Client is currently not comfortable sharing their mobile number.';

    const responseMsg = await Message.create({
      conversationId: parsed.data.conversationId,
      senderId:       userId,
      senderRole:     'client',
      content,
      type:           'phone_response',
    });

    await Chat.findByIdAndUpdate(parsed.data.conversationId, {
      lastMessage:   content,
      lastMessageAt: new Date(),
      $inc:          { trainerUnread: 1 },
    });

    return NextResponse.json({ success: true, data: responseMsg.toObject() }, { status: 201 });
  } catch (error: unknown) {
    console.error('[PHONE REQUEST ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
