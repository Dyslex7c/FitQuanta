import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import Trainer from '@/models/Trainer';
import { verifyAuth, handleApiError } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, role } = verifyAuth(req, ['client', 'trainer', 'admin']);
    await connectDB();

    let query: Record<string, unknown> = {};

    if (role === 'client') {
      query = { clientId: userId, status: 'completed' };
    } else if (role === 'trainer') {
      const trainer = await Trainer.findOne({ userId });
      if (!trainer) {
        return NextResponse.json({ success: true, data: [] });
      }
      query = { trainerId: trainer._id, status: 'completed' };
    } else if (role === 'admin') {
      query = { status: 'completed' };
    }

    const purchases = await Purchase.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: purchases });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
