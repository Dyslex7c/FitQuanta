import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Trainer from '@/models/Trainer';
import Purchase from '@/models/Purchase';
import Notification from '@/models/Notification';
import { verifyAuth, handleApiError } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  trainerId:  z.string().min(1),
  purchaseId: z.string().min(1),
  rating:     z.number().int().min(1).max(5),
  comment:    z.string().max(1000).optional().default(''),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid review inputs' }, { status: 400 });
    }

    const { trainerId, purchaseId, rating, comment } = parsed.data;

    await connectDB();

    /* Make sure purchase is completed and belongs to client */
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase || purchase.clientId.toString() !== userId || purchase.status !== 'completed') {
      return NextResponse.json({ success: false, message: 'Purchase not found or not eligible for review' }, { status: 400 });
    }

    /* Check if already reviewed */
    const existingReview = await Review.findOne({ purchaseId });
    if (existingReview) {
      return NextResponse.json({ success: false, message: 'This purchase has already been reviewed' }, { status: 409 });
    }

    /* Create review */
    const review = await Review.create({
      trainerId,
      clientId: userId,
      purchaseId,
      rating,
      comment,
    });

    /* Recalculate trainer average ratings */
    const reviews = await Review.find({ trainerId });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews) * 10) / 10
      : 0;

    await Trainer.findByIdAndUpdate(trainerId, {
      totalReviews,
      averageRating,
    });

    /* Send notification to trainer */
    await Notification.create({
      userId:  purchase.trainerId,
      type:    'review',
      title:   'New Review!',
      message: `A client left a ${rating}-star review on your profile.`,
      link:    `/trainer/${trainerId}`,
    });

    return NextResponse.json({ success: true, data: review.toObject() }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
