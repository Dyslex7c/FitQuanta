import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/notifications
 * Fetches notifications for the authenticated user, sorted by newest first.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client', 'trainer', 'admin']);
    await connectDB();

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    console.error('[NOTIFICATIONS GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Marks notifications as read. Body: { ids?: string[] }
 * If ids is provided, marks those specific notifications as read.
 * If ids is empty or not provided, marks ALL notifications as read.
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client', 'trainer', 'admin']);
    const body = await req.json().catch(() => ({}));
    await connectDB();

    const filter: Record<string, unknown> = { userId, read: false };
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      filter._id = { $in: body.ids };
    }

    await Notification.updateMany(filter, { $set: { read: true } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[NOTIFICATIONS PATCH ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
