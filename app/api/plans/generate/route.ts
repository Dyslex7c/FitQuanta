import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { groq } from '@/lib/groq';
import { verifyAuth, sanitizeForPrompt, handleApiError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import type { ApiResponse } from '@/types/api';
import type { IPlan } from '@/types/plan';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<IPlan | { blocked: true; reason: string }>>> {
  try {
    const { userId } = verifyAuth(req, ['client']);
    if (!rateLimit(`plan-gen:${userId}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, message: 'Plan generation limit reached. Try again later.' }, { status: 429 });
    }
    await connectDB();
    const user = await User.findById(userId).select(
      'age gender bmi bmiCategory activityLevel fitnessLevel fitnessGoal dietPreference budget equipment country foodAllergies medicalConditions injuries'
    );
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const hasMedicalRisk =
      (user.medicalConditions?.filter((c: string) => c.trim()).length ?? 0) > 0 ||
      (user.injuries?.filter((i: string) => i.trim()).length ?? 0) > 0;

    if (hasMedicalRisk) {
      return NextResponse.json({
        success: true,
        data: {
          blocked: true,
          reason: 'Due to your reported medical conditions or injuries, we cannot safely generate an AI plan. Please consult a certified trainer on our platform.',
        },
      });
    }

    const s = sanitizeForPrompt;
    const prompt = `Generate a 7-day workout plan and 7-day diet plan for:
- Age: ${s(String(user.age))}
- Gender: ${s(user.gender)}
- BMI: ${s(String(user.bmi))} (${s(user.bmiCategory)})
- Fitness Level: ${s(user.fitnessLevel)}
- Activity Level: ${s(user.activityLevel)}
- Fitness Goal: ${s(user.fitnessGoal)}
- Equipment: ${s(user.equipment)}
- Country: ${s(user.country)}
- Diet Preference: ${s(user.dietPreference)}
- Budget: ${s(user.budget)}
- Food Allergies: ${user.foodAllergies.length ? user.foodAllergies.map(s).join(', ') : 'None'}

Return ONLY a valid JSON object with keys "workoutPlan" (array of 7 objects: {day, exercises: [{name, sets, reps, rest}]}) and "dietPlan" (array of 7 objects: {day, meals: [{name, foods: string[], protein, carbs, fats, calories}]}). No text outside the JSON.`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a certified fitness and nutrition AI for FitQuanta. Generate only structured, safe, evidence-based fitness and diet plans. Respond exclusively with valid JSON. Never include medical diagnoses, drug recommendations, or any content outside fitness and nutrition.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    let parsed: { workoutPlan: unknown; dietPlan: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('[PLAN PARSE ERROR] Raw output not valid JSON');
      return NextResponse.json({ success: false, message: 'Plan generation failed. Please try again.' }, { status: 500 });
    }

    const plan = await Plan.create({
      userId,
      type: 'ai_free',
      workoutPlan: parsed.workoutPlan,
      dietPlan: parsed.dietPlan,
    });

    return NextResponse.json({ success: true, data: plan.toObject() as unknown as IPlan });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
