import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, handleApiError } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { BMICategory } from '@/types/user';

interface BMIResult {
  bmi: number;
  bmiCategory: BMICategory;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<BMIResult>>> {
  try {
    const { userId } = verifyAuth(req, ['client', 'admin', 'trainer']);
    await connectDB();
    const user = await User.findById(userId).select('height weight');
    if (!user?.height || !user?.weight) {
      return NextResponse.json({ success: false, message: 'Profile incomplete' }, { status: 400 });
    }
    const heightM = user.height / 100;
    const bmi = parseFloat((user.weight / (heightM * heightM)).toFixed(1));
    const bmiCategory: BMICategory =
      bmi < 18.5 ? 'Underweight' :
      bmi < 25 ? 'Normal' :
      bmi < 30 ? 'Overweight' : 'Obese';
    await User.findByIdAndUpdate(userId, { bmi, bmiCategory });
    return NextResponse.json({ success: true, data: { bmi, bmiCategory } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
