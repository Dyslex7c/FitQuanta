import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';
import TrainerPlan from '@/models/TrainerPlan';
import { z } from 'zod';

const querySchema = z.object({
  search:       z.string().max(100).optional().default(''),
  specialization: z.string().optional().default(''),
  minExp:       z.coerce.number().min(0).optional().default(0),
  maxPrice:     z.coerce.number().min(0).optional().default(999999),
  country:      z.string().max(100).optional().default(''),
  availability: z.enum(['','available','busy','unavailable']).optional().default(''),
  sortBy:       z.enum(['rating','experience','price_low','price_high']).optional().default('rating'),
  page:         z.coerce.number().int().min(1).optional().default(1),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query' }, { status: 400 });
    }

    const { search, specialization, minExp, country, availability, sortBy, page } = parsed.data;
    const LIMIT = 12;
    const skip  = (page - 1) * LIMIT;

    /* Only show approved trainers */
    const filter: Record<string, unknown> = { status: 'approved' };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }
    if (specialization) filter.specializations = specialization;
    if (minExp > 0)     filter.yearsOfExperience = { $gte: minExp };
    if (country)        filter.country      = new RegExp(country, 'i');
    if (availability)   filter.availabilityStatus = availability;

    const sortMap: Record<string, any> = {
      rating:     { averageRating: -1 },
      experience: { yearsOfExperience: -1 },
      price_low:  { _id: 1 },
      price_high: { _id: -1 },
    };

    await connectDB();

    const [trainers, total] = await Promise.all([
      Trainer.find(filter).sort(sortMap[sortBy] ?? { averageRating: -1 }).skip(skip).limit(LIMIT).lean(),
      Trainer.countDocuments(filter),
    ]);

    /* Attach cheapest plan to each trainer */
    const trainerIds = trainers.map(t => t._id);
    const plans = await TrainerPlan.find({ trainerId: { $in: trainerIds }, isActive: true })
      .sort({ priceINR: 1 })
      .lean();

    const planMap: Record<string, typeof plans[0]> = {};
    plans.forEach(p => {
      const key = p.trainerId.toString();
      if (!planMap[key]) planMap[key] = p;
    });

    const result = trainers.map(t => ({
      ...t,
      cheapestPlan: planMap[t._id.toString()] ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: { trainers: result, total, page, totalPages: Math.ceil(total / LIMIT), hasMore: skip + trainers.length < total },
    });
  } catch (error: unknown) {
    console.error('[TRAINER SEARCH ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
