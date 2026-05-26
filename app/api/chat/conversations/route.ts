import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Trainer from '@/models/Trainer';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, role } = verifyAuth(req, ['client', 'trainer', 'admin']);
    await connectDB();

    let chats;
    if (role === 'client') {
      chats = await Chat.find({ clientId: userId, isActive: true }).sort({ lastMessageAt: -1 }).lean();
      const trainerIds = chats.map(c => c.trainerId);
      const trainers   = await Trainer.find({ _id: { $in: trainerIds } }).select('name profilePhotoUrl').lean();
      const tMap: Record<string, { name: string; profilePhotoUrl: string }> = {};
      trainers.forEach(t => { tMap[t._id.toString()] = { name: t.name, profilePhotoUrl: t.profilePhotoUrl }; });
      chats = chats.map(c => ({ ...c, trainerInfo: tMap[c.trainerId.toString()] ?? null }));
    } else {
      const trainer = await Trainer.findOne({ userId });
      if (!trainer) return NextResponse.json({ success: true, data: [] });
      chats = await Chat.find({ trainerId: trainer._id, isActive: true }).sort({ lastMessageAt: -1 }).lean();
      const clientIds = chats.map(c => c.clientId);
      const clients   = await User.find({ _id: { $in: clientIds } }).select('name').lean();
      const cMap: Record<string, string> = {};
      clients.forEach(c => { cMap[c._id.toString()] = c.name; });
      chats = chats.map(c => ({ ...c, clientName: cMap[c.clientId.toString()] ?? 'Client' }));
    }

    return NextResponse.json({ success: true, data: chats });
  } catch (error: unknown) {
    console.error('[CONVERSATIONS ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
