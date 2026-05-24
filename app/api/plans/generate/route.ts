import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { groq } from '@/lib/groq';
import { verifyAuth, sanitizeForPrompt } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify JWT — client role only
    const { userId } = verifyAuth(req, ['client']);

    // 2. Rate limit — 5 generations per hour per user
    if (!rateLimit(`plan-gen:${userId}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, message: 'Plan generation limit reached. Try again in an hour.' },
        { status: 429 }
      );
    }

    // 3. Connect DB, fetch user, and check if a plan already exists
    await connectDB();
    const user = await User.findById(userId).select(
      'age gender bmi bmiCategory activityLevel fitnessLevel fitnessGoal ' +
      'dietPreference budget equipment country foodAllergies medicalConditions injuries onboardingComplete'
    );

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const existingPlan = await Plan.findOne({ userId, type: 'ai_free' });
    const isRegenerate = !!existingPlan;

    // 4. Onboarding check
    if (!user.onboardingComplete) {
      return NextResponse.json(
        { success: false, message: 'Please complete your profile setup first.' },
        { status: 400 }
      );
    }

    // 5. MEDICAL GATE — server-side, non-bypassable
    const hasMedicalConditions = Array.isArray(user.medicalConditions) &&
      user.medicalConditions.some((c: string) => c.trim().length > 0);
    const hasInjuries = Array.isArray(user.injuries) &&
      user.injuries.some((i: string) => i.trim().length > 0);

    if (hasMedicalConditions || hasInjuries) {
      return NextResponse.json({
        success: true,
        data: {
          blocked: true,
          reason: 'Due to your reported medical conditions or injuries, we cannot safely generate an AI plan. Please consult a certified trainer on our platform for a personalised and safe fitness programme.'
        }
      });
    }

    // 6. Check if Groq API Key is configured (detect placeholder or missing key)
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_placeholder_value_must_be_replaced' || apiKey.startsWith('gsk_placeholder')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Groq API Key is not configured. Please add a valid GROQ_API_KEY in your .env.local file and restart the server to generate plans using Llama 3.'
        },
        { status: 400 }
      );
    }

    // 7. Sanitize user inputs
    const s = sanitizeForPrompt;
    const allergies = Array.isArray(user.foodAllergies) && user.foodAllergies.length > 0
      ? user.foodAllergies.map((a: string) => s(a)).join(', ')
      : 'None';

    // 8. Build Groq prompt
    let userPrompt = `
You are generating a fitness plan for the following user profile:
[USER PROFILE START]
Age: ${s(String(user.age ?? 'unknown'))}
Gender: ${s(user.gender ?? 'unknown')}
BMI: ${s(String(user.bmi ?? 'unknown'))} (${s(user.bmiCategory ?? 'unknown')})
Fitness Level: ${s(user.fitnessLevel ?? 'beginner')}
Activity Level: ${s(user.activityLevel ?? 'sedentary')}
Fitness Goal: ${s(user.fitnessGoal ?? 'maintenance')}
Available Equipment: ${s(user.equipment ?? 'none')}
Country: ${s(user.country ?? 'India')}
Diet Preference: ${s(user.dietPreference ?? 'veg')}
Budget: ${s(user.budget ?? 'medium')}
Food Allergies: ${allergies}
[USER PROFILE END]

Return ONLY a single valid JSON object. No markdown. No code blocks. No explanation text. No trailing commas. The JSON must have exactly two keys:

"workoutPlan": an array of exactly 7 objects, each with:
  - "day": string (e.g. "Day 1 - Monday")
  - "focus": string (e.g. "Chest & Triceps")
  - "exercises": array of objects each with "name" (string), "sets" (number), "reps" (string), "rest" (string), "notes" (string)

"dietPlan": an array of exactly 7 objects, each with:
  - "day": string (e.g. "Day 1 - Monday")
  - "totalCalories": number
  - "meals": array of objects each with "name" (string), "foods" (array of strings), "protein" (number in grams), "carbs" (number in grams), "fats" (number in grams), "calories" (number)

Make the diet plan use foods commonly available in ${s(user.country ?? 'India')} and appropriate for ${s(user.dietPreference ?? 'veg')} diet. Respect the budget level: ${s(user.budget ?? 'medium')}.
`.trim();

    if (isRegenerate) {
      userPrompt += `\n\n[REGENERATION INSTRUCTION]\nThis is a plan regeneration request. The user already has a plan. To keep their routine fresh, interesting, and effective, please introduce variety: change the focus of the days, use different but equally effective exercises for the workouts (e.g. swap bench press for chest dips/inclines), and provide different options of meals and snacks for the diet plan while respecting the target calories and preferences. Do NOT return the same plan as before.`;
    }

    let parsedPlan: { workoutPlan: any; dietPlan: any };

    try {
      // 9. Call Groq
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a certified fitness and nutrition AI assistant for FitQuanta. You ONLY respond with valid raw JSON — no markdown, no code fences, no explanation, no text outside the JSON object. Your plans are evidence-based, safe, and tailored to the user profile provided.'
          },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: isRegenerate ? 0.75 : 0.3,
      });

      const rawContent = completion.choices[0]?.message?.content ?? '';
      const cleaned = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsedPlan = JSON.parse(cleaned);

      // Validate structure
      if (!parsedPlan.workoutPlan || !parsedPlan.dietPlan) {
        throw new Error('Missing workoutPlan or dietPlan keys in response');
      }
    } catch (groqError: any) {
      console.error('[PLAN GENERATE GROQ ERROR]', groqError);
      const errMsg = groqError.response?.data?.error?.message || groqError.message || 'Groq API call failed';
      return NextResponse.json(
        {
          success: false,
          message: `AI plan generation failed: ${errMsg}. Please verify your GROQ_API_KEY in .env.local and check your network connection.`
        },
        { status: 500 }
      );
    }

    // 10. Delete old plan and save new one
    await Plan.deleteMany({ userId, type: 'ai_free' });
    const plan = await Plan.create({
      userId,
      type: 'ai_free',
      workoutPlan: parsedPlan.workoutPlan,
      dietPlan: parsedPlan.dietPlan,
    });

    return NextResponse.json({ success: true, data: plan.toObject() });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    console.error('[PLAN GENERATE GENERAL ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
