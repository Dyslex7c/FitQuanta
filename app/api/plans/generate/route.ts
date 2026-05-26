import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { groq } from '@/lib/groq';
import { verifyAuth, sanitizeForPrompt } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { runAchievementEngine } from '@/lib/achievementEngine';

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
      'age gender height weight bmi bmiCategory activityLevel fitnessLevel fitnessGoal ' +
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

    // 7.1. Scientific Maintenance Calories Calculation (Mifflin-St Jeor)
    const weightKg = user.weight || 70; // Fallback to 70kg
    const heightCm = user.height || 170; // Fallback to 170cm
    const ageYrs = user.age || 25; // Fallback to 25 years
    const gender = user.gender || 'male';

    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYrs;
    if (gender === 'male') {
      bmr += 5;
    } else if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr -= 78; // average offset for other genders
    }

    // Activity Multiplier
    const activityMap: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const multiplier = activityMap[user.activityLevel || 'moderate'] ?? 1.375;
    const maintenanceCalories = Math.round(bmr * multiplier);

    // Goal Calories Adjustment
    let targetCalories = maintenanceCalories;
    let goalAdjustmentText = 'maintenance intake';
    const goal = user.fitnessGoal || 'maintenance';

    if (goal === 'fat_loss') {
      targetCalories = Math.max(gender === 'female' ? 1200 : 1500, maintenanceCalories - 500);
      goalAdjustmentText = '500 kcal deficit for healthy fat loss';
    } else if (goal === 'muscle_gain') {
      targetCalories = maintenanceCalories + 300;
      goalAdjustmentText = '300 kcal surplus for clean muscle hypertrophy';
    }

    // 7.2. Dynamic split structures to avoid repetitive routines
    let recommendedSplit = 'Full Body';
    let splitDescription = '3 active training days focusing on full-body functional compound movements, and 4 rest/recovery days.';

    const level = user.fitnessLevel || 'beginner';
    const equip = user.equipment || 'none';

    if (level === 'beginner' || equip === 'none') {
      recommendedSplit = 'Full Body';
      splitDescription = 'A 3-day Full Body functional routine (e.g., Mon/Wed/Fri active, other days rest). Perfect for beginners or home/bodyweight workouts.';
    } else if (level === 'intermediate') {
      if (goal === 'muscle_gain') {
        recommendedSplit = 'Push / Pull / Legs (PPL)';
        splitDescription = 'A highly effective 5 or 6-day Push, Pull, Legs (PPL) split protocol (e.g., Push, Pull, Legs, Rest, Repeat) targeting key push, pull, and leg muscles separately on distinct days.';
      } else {
        recommendedSplit = 'Upper / Lower Body';
        splitDescription = 'A balanced 4-day Upper/Lower body split protocol (e.g., Upper, Lower, Rest, Upper, Lower, Rest, Rest). Excellent balance of frequency and recovery.';
      }
    } else if (level === 'advanced') {
      recommendedSplit = 'Bro Split (Double Body Part)';
      splitDescription = 'A high-volume 5 or 6-day split focusing on double muscle groups (e.g., Chest & Triceps, Back & Biceps, Shoulders & Abs, Legs, Arms & Cardio, Rest). Perfect for high-intensity muscle hypertrophy.';
    }

    // 8. Build Groq prompt
    let userPrompt = `
You are generating a highly personalized fitness and nutrition plan for the following user profile:
[USER PROFILE START]
Age: ${s(String(user.age ?? 'unknown'))}
Gender: ${s(user.gender ?? 'unknown')}
Height: ${s(String(user.height ?? 'unknown'))} cm
Weight: ${s(String(user.weight ?? 'unknown'))} kg
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

Every plan must be strictly and highly personalized according to the user's specific information (age, gender, height, weight, BMI, fitness level, activity level, fitness goal, available equipment, country, diet preference, budget, and food allergies). Do not provide generic workouts or meals.

CALORIES TARGET INFORMATION:
- Calculated Daily Maintenance Calories: ${maintenanceCalories} kcal
- User Fitness Goal: ${goal}
- Target Daily Calorie Intake: ${targetCalories} kcal (representing a ${goalAdjustmentText})

WORKOUT SPLIT ASSIGNMENT:
- Recommended Training Split Protocol: ${recommendedSplit}
- Protocol Description: ${splitDescription}

Return ONLY a single valid JSON object. No markdown. No code blocks. No explanation text. No trailing commas. The JSON must have exactly two keys:

"workoutPlan": an array of exactly 7 objects, each representing a day. Rest days should have an empty "exercises" array. For each active training day, you MUST generate a minimum of 4 exercises and a maximum of 6 exercises. Keep names and notes extremely concise. The split structure must be strictly modeled based on the ${recommendedSplit} protocol assigned above. Do NOT use generic splits. Each day object has:
  - "day": string (e.g. "Day 1 - Monday")
  - "focus": string (e.g. "Push Day" or "Pull Day" or "Leg Day" or "Rest Day" depending on the split)
  - "exercises": array of objects (exactly 4 to 6 exercises for active days; empty array [] for rest days) each with "name" (string), "sets" (number), "reps" (string), "rest" (string), "notes" (string)

"dietPlan": an array of exactly 7 objects, each with:
  - "day": string (e.g. "Day 1 - Monday")
  - "totalCalories": number (this MUST be exactly ${targetCalories} kcal, allow +/- 50 kcal)
  - "meals": an array of exactly 3 to 4 meals (e.g., Breakfast, Lunch, Dinner, Snack). Keep foods lists brief. Each meal object has "name" (string), "foods" (array of strings), "protein" (number in grams), "carbs" (number in grams), "fats" (number in grams), "calories" (number)

Make the diet plan use foods commonly available in ${s(user.country ?? 'India')} and appropriate for ${s(user.dietPreference ?? 'veg')} diet. Keep all texts and instructions extremely concise to prevent truncation. Respect the budget level: ${s(user.budget ?? 'medium')}.
`.trim();

    if (isRegenerate) {
      userPrompt += `\n\n[REGENERATION INSTRUCTION]\nThis is a plan regeneration request. The user already has a plan. To keep their routine fresh, interesting, and effective, please introduce variety: change the focus of the days, use different but equally effective exercises for the workouts (e.g. swap bench press for chest dips/inclines), and provide different options of meals and snacks for the diet plan while respecting the target calories and preferences. Do NOT return the same plan as before.`;
    }

    let parsedPlan: { workoutPlan: any; dietPlan: any } = { workoutPlan: null, dietPlan: null };
    let rawContent = '';
    let usedModel = 'llama-3.3-70b-versatile';

    try {
      // 9. Call Groq with preferred model
      console.log('Attempting AI plan generation using preferred model:', usedModel);
      const completion = await groq.chat.completions.create({
        model: usedModel,
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

      rawContent = completion.choices[0]?.message?.content ?? '';
    } catch (groqError: any) {
      console.warn('Llama 3.3 70B hit rate limits or API errors. Retrying with high-speed fallback model llama-3.1-8b-instant...', groqError.message);
      
      usedModel = 'llama-3.1-8b-instant';
      try {
        const completion = await groq.chat.completions.create({
          model: usedModel,
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
        rawContent = completion.choices[0]?.message?.content ?? '';
      } catch (fallbackError: any) {
        console.error('[PLAN GENERATE FALLBACK ERROR]', fallbackError);
        const errMsg = fallbackError.response?.data?.error?.message || fallbackError.message || 'Groq API call failed';
        return NextResponse.json(
          {
            success: false,
            message: `AI plan generation failed: ${errMsg}. Please verify your GROQ_API_KEY in .env.local and check your network connection.`
          },
          { status: 500 }
        );
      }
    }

    try {
      // Resilient JSON extraction - extracts text between the first '{' and the last '}'
      let jsonContent = rawContent.trim();
      
      // Remove possible markdown enclosures
      jsonContent = jsonContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const firstBrace = jsonContent.indexOf('{');
      const lastBrace = jsonContent.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
      }

      // Strip illegal trailing commas inside arrays or objects that crash JSON.parse
      const sanitizedJson = jsonContent
        .replace(/,\s*([\]}])/g, '$1')
        .trim();

      parsedPlan = JSON.parse(sanitizedJson);

      // Validate structure
      if (!parsedPlan.workoutPlan || !parsedPlan.dietPlan) {
        throw new Error('Missing workoutPlan or dietPlan keys in response');
      }
    } catch (parseError: any) {
      console.error('[JSON PARSE ERROR]', parseError, 'Raw content was:', rawContent);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate plan structure from AI response. Please try again.'
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

    /* Trigger achievements check asynchronously */
    void runAchievementEngine(userId);

    return NextResponse.json({ success: true, data: plan.toObject() });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    console.error('[PLAN GENERATE GENERAL ERROR]', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
