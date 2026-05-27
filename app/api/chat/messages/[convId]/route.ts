import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import Notification from '@/models/Notification';
import Trainer from '@/models/Trainer';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const msgSchema = z.object({
  content:    z.string().max(5000).trim(),
  type:       z.enum(['text','image','file','phone_request','phone_response']).default('text'),
  fileUrl:    z.string().optional().default(''),
  fileName:   z.string().max(200).optional().default(''),
  senderRole: z.enum(['client','trainer']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ convId: string }> }
): Promise<NextResponse> {
  try {
    const { convId } = await params;
    const { userId, role } = verifyAuth(req, ['client', 'trainer']);
    await connectDB();
    const messages = await Message.find({ conversationId: convId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    /* Mark unread messages as seen */
    await Message.updateMany(
      { conversationId: convId, senderId: { $ne: userId }, seen: false },
      { $set: { seen: true } }
    );

    /* Reset the correct unread counter based on who is reading */
    if (role === 'client') {
      await Chat.findByIdAndUpdate(convId, { $set: { clientUnread: 0 } });
    } else {
      await Chat.findByIdAndUpdate(convId, { $set: { trainerUnread: 0 } });
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error: unknown) {
    console.error('[MESSAGES GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ convId: string }> }
): Promise<NextResponse> {
  try {
    const { convId } = await params;
    const { userId, role } = verifyAuth(req, ['client', 'trainer']);
    const body = await req.json();
    const parsed = msgSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, message: 'Invalid message' }, { status: 400 });

    const { senderRole, ...messageFields } = parsed.data;

    await connectDB();
    const msg = await Message.create({
      conversationId: convId,
      senderId:       userId,
      senderRole:     role as 'client' | 'trainer',
      ...messageFields,
    });

    /* Update conversation metadata — use separate $set and $inc operators */
    const unreadField = role === 'client' ? 'trainerUnread' : 'clientUnread';
    await Chat.findByIdAndUpdate(convId, {
      $set: {
        lastMessage:   parsed.data.content || `[${parsed.data.type}]`,
        lastMessageAt: new Date(),
      },
      $inc: { [unreadField]: 1 },
    });

    /* Create a notification for the recipient */
    try {
      const chat = await Chat.findById(convId).lean();
      if (chat) {
        let recipientUserId: string | null = null;
        let senderName = 'Someone';

        if (role === 'client') {
          // Client sent message → notify trainer's userId
          const trainer = await Trainer.findById(chat.trainerId).select('userId name').lean();
          if (trainer) {
            recipientUserId = trainer.userId.toString();
            const sender = await User.findById(userId).select('name').lean();
            senderName = sender?.name || 'A client';
          }
        } else {
          // Trainer sent message → notify client
          recipientUserId = chat.clientId.toString();
          const trainer = await Trainer.findOne({ userId }).select('name').lean();
          senderName = trainer?.name || 'Your trainer';
        }

        if (recipientUserId) {
          // Only create notification if one doesn't already exist unread for this conversation
          const existingUnread = await Notification.findOne({
            userId: recipientUserId,
            type: 'chat',
            link: `/chat/${convId}`,
            read: false,
          });

          if (existingUnread) {
            // Update existing unread notification with latest message
            await Notification.findByIdAndUpdate(existingUnread._id, {
              $set: {
                title: `New message from ${senderName}`,
                message: parsed.data.content?.slice(0, 100) || `Sent a ${parsed.data.type}`,
              },
            });
          } else {
            await Notification.create({
              userId: recipientUserId,
              type: 'chat',
              title: `New message from ${senderName}`,
              message: parsed.data.content?.slice(0, 100) || `Sent a ${parsed.data.type}`,
              link: `/chat/${convId}`,
              read: false,
            });
          }
        }
      }
    } catch (notifErr) {
      // Don't fail the message send if notification creation fails
      console.error('[NOTIFICATION CREATE ERROR]', notifErr);
    }

    return NextResponse.json({ success: true, data: msg.toObject() }, { status: 201 });
  } catch (error: unknown) {
    console.error('[MESSAGES POST ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
