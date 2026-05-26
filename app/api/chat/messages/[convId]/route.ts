import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
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
    const { userId } = verifyAuth(req, ['client', 'trainer']);
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
    await Chat.findByIdAndUpdate(convId, {
      $set: { clientUnread: 0, trainerUnread: 0 },
    });

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
      senderRole:     role as 'client' | 'trainer', // Securely verified role from JWT token
      ...messageFields,
    });

    await Chat.findByIdAndUpdate(convId, {
      lastMessage:   parsed.data.content || `[${parsed.data.type}]`,
      lastMessageAt: new Date(),
      ...(role === 'client' ? { $inc: { trainerUnread: 1 } } : { $inc: { clientUnread: 1 } }),
    });

    return NextResponse.json({ success: true, data: msg.toObject() }, { status: 201 });
  } catch (error: unknown) {
    console.error('[MESSAGES POST ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
