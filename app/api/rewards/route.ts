import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserReward from '@/models/UserReward';
import { verifyAuth } from '@/lib/auth';
import { REWARD_TIERS } from '@/lib/achievementEngine';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    await connectDB();

    let reward = await UserReward.findOne({ userId }).lean() as {
      totalBadgesEarned: number;
      currentTierIndex: number;
      discountCodes: Array<{ code: string; discountPercent: number; used: boolean; expiresAt: Date }>;
    } | null;

    if (!reward) {
      reward = { totalBadgesEarned: 0, currentTierIndex: -1, discountCodes: [] };
    }

    const { totalBadgesEarned, currentTierIndex } = reward;

    const currentTier = currentTierIndex >= 0 ? REWARD_TIERS[currentTierIndex] ?? null : null;
    const nextTierIndex = currentTierIndex + 1;
    const nextTier = nextTierIndex < REWARD_TIERS.length ? REWARD_TIERS[nextTierIndex] ?? null : null;
    const badgesUntilNext = nextTier ? nextTier.badgesRequired - totalBadgesEarned : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalBadgesEarned,
        currentTier,
        nextTier,
        badgesUntilNextTier: Math.max(badgesUntilNext, 0),
        discountCodes: reward.discountCodes.filter(c => !c.used && new Date(c.expiresAt) > new Date()),
        allTiers: REWARD_TIERS,
      },
    });
  } catch (error: unknown) {
    console.error('[REWARDS GET ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
