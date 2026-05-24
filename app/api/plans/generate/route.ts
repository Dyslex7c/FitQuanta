import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { groq } from '@/lib/groq';
import { verifyAuth, sanitizeForPrompt } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

// High-quality fallback generator based on user goal, equipment, and diet preferences
function getMockPlan(user: any) {
  const goal = user.fitnessGoal || 'maintenance';
  const equip = user.equipment || 'none';
  const diet = user.dietPreference || 'veg';

  let totalCalories = 2200;
  let p = 130, c = 240, f = 75;

  if (goal === 'muscle_gain') {
    totalCalories = 2850;
    p = 165; c = 345; f = 80;
  } else if (goal === 'fat_loss') {
    totalCalories = 1750;
    p = 145; c = 165; f = 55;
  }

  // Workouts based on equipment
  let workoutPlan = [];
  if (equip === 'gym') {
    workoutPlan = [
      {
        day: 'Day 1 - Monday',
        focus: 'Chest, Shoulders & Triceps (Push)',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90s', notes: 'Control the descent.' },
          { name: 'Overhead Barbell Press', sets: 3, reps: '8-10', rest: '90s', notes: 'Keep core tight.' },
          { name: 'Incline Dumbbell Flyes', sets: 3, reps: '12', rest: '60s', notes: 'Focus on chest stretch.' },
          { name: 'Triceps Overhead Extension', sets: 3, reps: '12-15', rest: '60s', notes: 'Keep elbows tucked.' }
        ]
      },
      {
        day: 'Day 2 - Tuesday',
        focus: 'Back, Rear Delts & Biceps (Pull)',
        exercises: [
          { name: 'Lat Pulldowns', sets: 4, reps: '10-12', rest: '90s', notes: 'Pull with elbows.' },
          { name: 'Bent Over Barbell Row', sets: 3, reps: '8-10', rest: '90s', notes: 'Keep spine neutral.' },
          { name: 'Face Pulls', sets: 3, reps: '15', rest: '60s', notes: 'Focus on rear delts.' },
          { name: 'Dumbbell Hammer Curls', sets: 3, reps: '12', rest: '60s', notes: 'Squeeze at top.' }
        ]
      },
      {
        day: 'Day 3 - Wednesday',
        focus: 'Legs & Core',
        exercises: [
          { name: 'Barbell Back Squats', sets: 4, reps: '8', rest: '120s', notes: 'Go to parallel depth.' },
          { name: 'Romanian Deadlifts', sets: 3, reps: '10', rest: '90s', notes: 'Hinge at hips.' },
          { name: 'Leg Press', sets: 3, reps: '12', rest: '90s', notes: 'Do not lock knees.' },
          { name: 'Planks', sets: 3, reps: '60s hold', rest: '45s', notes: 'Maintain straight line.' }
        ]
      },
      {
        day: 'Day 4 - Thursday',
        focus: 'Rest & Recovery',
        exercises: []
      },
      {
        day: 'Day 5 - Friday',
        focus: 'Upper Body Hypertrophy',
        exercises: [
          { name: 'Dumbbell Incline Press', sets: 4, reps: '10', rest: '90s', notes: '30 degree incline.' },
          { name: 'Pull-Ups / Assisted Pull-Ups', sets: 3, reps: '8-12', rest: '90s', notes: 'Slow negatives.' },
          { name: 'Lateral Raises', sets: 4, reps: '15', rest: '60s', notes: 'Keep pinkies slightly up.' },
          { name: 'Preacher Bicep Curls', sets: 3, reps: '12', rest: '60s', notes: 'Full range of motion.' }
        ]
      },
      {
        day: 'Day 6 - Saturday',
        focus: 'Lower Body & Core',
        exercises: [
          { name: 'Walking Lunges', sets: 3, reps: '12 per leg', rest: '60s', notes: 'Keep torso upright.' },
          { name: 'Leg Curls', sets: 3, reps: '12-15', rest: '60s', notes: 'Squeeze hamstrings.' },
          { name: 'Hanging Leg Raises', sets: 3, reps: '12-15', rest: '60s', notes: 'Avoid swinging.' }
        ]
      },
      {
        day: 'Day 7 - Sunday',
        focus: 'Rest & Recovery',
        exercises: []
      }
    ];
  } else {
    workoutPlan = [
      {
        day: 'Day 1 - Monday',
        focus: 'Upper Body Bodyweight Conditioning',
        exercises: [
          { name: 'Standard Push-Ups', sets: 3, reps: '12-15', rest: '60s', notes: 'Keep elbows at 45 degrees.' },
          { name: 'Pike Push-Ups', sets: 3, reps: '8-10', rest: '60s', notes: 'Targets shoulders.' },
          { name: 'Chair Dips', sets: 3, reps: '10-12', rest: '60s', notes: 'Keep back close to chair.' },
          { name: 'Doorframe Pulls', sets: 3, reps: '12-15', rest: '60s', notes: 'Engage back muscles.' }
        ]
      },
      {
        day: 'Day 2 - Tuesday',
        focus: 'Lower Body Bodyweight',
        exercises: [
          { name: 'Bodyweight Squats', sets: 4, reps: '20', rest: '60s', notes: 'Keep chest high.' },
          { name: 'Reverse Lunges', sets: 3, reps: '12 per leg', rest: '60s', notes: 'Stepping back.' },
          { name: 'Single-leg Glute Bridges', sets: 3, reps: '10 per leg', rest: '60s', notes: 'Drive through heel.' },
          { name: 'Standing Calf Raises', sets: 3, reps: '25', rest: '45s', notes: 'Hold top for 1s.' }
        ]
      },
      {
        day: 'Day 3 - Wednesday',
        focus: 'Core & Cardio Blast',
        exercises: [
          { name: 'Mountain Climbers', sets: 3, reps: '40s work', rest: '20s', notes: 'Keep hips down.' },
          { name: 'Standard Plank hold', sets: 3, reps: '60s hold', rest: '30s', notes: 'Tighten glutes.' },
          { name: 'Bicycle Crunches', sets: 3, reps: '20', rest: '45s', notes: 'Elbow to opposite knee.' },
          { name: 'Jumping Jacks', sets: 3, reps: '45s work', rest: '15s', notes: 'Keep light on feet.' }
        ]
      },
      {
        day: 'Day 4 - Thursday',
        focus: 'Rest & Recovery',
        exercises: []
      },
      {
        day: 'Day 5 - Friday',
        focus: 'Full Body Bodyweight Hypertrophy',
        exercises: [
          { name: 'Decline Push-ups (Feet on Bed)', sets: 3, reps: '10-12', rest: '60s', notes: 'Upper chest focus.' },
          { name: 'Squat Jumps', sets: 3, reps: '12', rest: '60s', notes: 'Explosive power.' },
          { name: 'Burpees', sets: 3, reps: '10', rest: '60s', notes: 'Cardio builder.' },
          { name: 'Plank Shoulder Taps', sets: 3, reps: '20 total', rest: '45s', notes: 'Minimize hip sway.' }
        ]
      },
      {
        day: 'Day 6 - Saturday',
        focus: 'Active Recovery & Stretching',
        exercises: [
          { name: 'Cat-Cow stretch', sets: 2, reps: '10 breaths', rest: '30s', notes: 'Mobilize spine.' },
          { name: 'Downward Dog hold', sets: 2, reps: '30s hold', rest: '30s', notes: 'Hamstrings & shoulders.' },
          { name: 'Cobra stretch hold', sets: 2, reps: '30s hold', rest: '30s', notes: 'Core & lower back.' }
        ]
      },
      {
        day: 'Day 7 - Sunday',
        focus: 'Rest & Recovery',
        exercises: []
      }
    ];
  }

  // Diet Plan
  const mealConfig = diet === 'non-veg'
    ? {
        breakfast: { name: 'Eggs & Oatmeal Bowl', foods: ['3 Scrambled Eggs', '50g Oats', '1 Banana', 'Almonds'], p: 28, c: 45, f: 18, cal: 454 },
        lunch: { name: 'Chicken Breast & Rice', foods: ['150g Grilled Chicken Breast', '100g Basmati Rice', 'Steamed Broccoli', '1 tsp Olive Oil'], p: 42, c: 38, f: 8, cal: 392 },
        snack: { name: 'Whey Protein Shake & Apple', foods: ['1 Scoop Whey Protein', '250ml Skimmed Milk', '1 Apple'], p: 30, c: 28, f: 3, cal: 259 },
        dinner: { name: 'Fish Fillet & Sweet Potatoes', foods: ['150g Baked Fish Fillet', '150g Mashed Sweet Potatoes', 'Mixed Green Salad'], p: 35, c: 40, f: 7, cal: 363 }
      }
    : diet === 'vegan'
    ? {
        breakfast: { name: 'Tofu Scramble & Avocado Toast', foods: ['150g Organic Scrambled Tofu', '2 Slices Whole Grain Toast', 'Half Avocado'], p: 22, c: 35, f: 16, cal: 372 },
        lunch: { name: 'Chickpea & Quinoa Bowl', foods: ['150g Boiled Chickpeas', '100g Cooked Quinoa', 'Spinach', 'Tahini Dressing'], p: 18, c: 55, f: 10, cal: 382 },
        snack: { name: 'Soy Protein & Mixed Seeds', foods: ['1 Scoop Soy Protein', '300ml Soy Milk', '30g Pumpkin Seeds'], p: 32, c: 15, f: 12, cal: 296 },
        dinner: { name: 'Lentil Stew & Brown Rice', foods: ['200g Brown Lentil Curry', '100g Cooked Brown Rice', 'Assorted Vegetables'], p: 20, c: 50, f: 5, cal: 325 }
      }
    : {
        breakfast: { name: 'Paneer Bhurji & Multigrain Toast', foods: ['100g Low-fat Paneer Scramble', '2 Slices Multigrain Toast', '1 cup Green Tea'], p: 24, c: 32, f: 12, cal: 332 },
        lunch: { name: 'Dal Tadka, Rice & Curd', foods: ['150g Yellow Dal', '100g Basmati Rice', '100g Low-fat Greek Yogurt', 'Cucumber Salad'], p: 22, c: 52, f: 6, cal: 350 },
        snack: { name: 'Roasted Chana & Paneer Cubes', foods: ['50g Dry Roasted Chana', '50g Raw Paneer Cubes'], p: 18, c: 24, f: 10, cal: 258 },
        dinner: { name: 'Soya Chunks Stir-fry & Roti', foods: ['100g Soya Chunks', '2 Whole Wheat Rotis', 'Mixed Vegetables stir-fried'], p: 38, c: 45, f: 8, cal: 404 }
      };

  const scale = totalCalories / 1400; // scaling factor
  
  const dietPlan = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, idx) => {
    return {
      day: `Day ${idx + 1} - ${dayName}`,
      totalCalories: Math.round(totalCalories),
      meals: [
        {
          name: 'Breakfast',
          foods: mealConfig.breakfast.foods,
          protein: Math.round(mealConfig.breakfast.p * scale),
          carbs: Math.round(mealConfig.breakfast.c * scale),
          fats: Math.round(mealConfig.breakfast.f * scale),
          calories: Math.round(mealConfig.breakfast.cal * scale)
        },
        {
          name: 'Lunch',
          foods: mealConfig.lunch.foods,
          protein: Math.round(mealConfig.lunch.p * scale),
          carbs: Math.round(mealConfig.lunch.c * scale),
          fats: Math.round(mealConfig.lunch.f * scale),
          calories: Math.round(mealConfig.lunch.cal * scale)
        },
        {
          name: 'Evening Snack',
          foods: mealConfig.snack.foods,
          protein: Math.round(mealConfig.snack.p * scale),
          carbs: Math.round(mealConfig.snack.c * scale),
          fats: Math.round(mealConfig.snack.f * scale),
          calories: Math.round(mealConfig.snack.cal * scale)
        },
        {
          name: 'Dinner',
          foods: mealConfig.dinner.foods,
          protein: Math.round(mealConfig.dinner.p * scale),
          carbs: Math.round(mealConfig.dinner.c * scale),
          fats: Math.round(mealConfig.dinner.f * scale),
          calories: Math.round(mealConfig.dinner.cal * scale)
        }
      ]
    };
  });

  return { workoutPlan, dietPlan };
}

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

    // 3. Connect DB and fetch user
    await connectDB();
    const user = await User.findById(userId).select(
      'age gender bmi bmiCategory activityLevel fitnessLevel fitnessGoal ' +
      'dietPreference budget equipment country foodAllergies medicalConditions injuries onboardingComplete'
    );

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

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

    // 6. Sanitize user inputs
    const s = sanitizeForPrompt;
    const allergies = Array.isArray(user.foodAllergies) && user.foodAllergies.length > 0
      ? user.foodAllergies.map((a: string) => s(a)).join(', ')
      : 'None';

    // 7. Check if we need to use fallback (placeholder API key check)
    const apiKey = process.env.GROQ_API_KEY;
    const isMock = !apiKey || apiKey === 'gsk_placeholder_value_must_be_replaced' || apiKey.startsWith('gsk_placeholder');

    let parsedPlan: { workoutPlan: any; dietPlan: any };

    if (isMock) {
      console.log('[PLAN GENERATE] Using mock fallback plan due to missing/placeholder Groq API Key.');
      parsedPlan = getMockPlan(user);
    } else {
      // 8. Build Groq prompt
      const userPrompt = `
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

      try {
        // 9. Call Groq
        const completion = await groq.chat.completions.create({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a certified fitness and nutrition AI assistant for FitQuanta. You ONLY respond with valid raw JSON — no markdown, no code fences, no explanation, no text outside the JSON object. Your plans are evidence-based, safe, and tailored to the user profile provided.'
            },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 4096,
          temperature: 0.3,
        });

        const rawContent = completion.choices[0]?.message?.content ?? '';
        const cleaned = rawContent
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        parsedPlan = JSON.parse(cleaned);

        // Validate structure
        if (!parsedPlan.workoutPlan || !parsedPlan.dietPlan) {
          throw new Error('Missing workoutPlan or dietPlan keys in Groq response');
        }
      } catch (groqError: any) {
        console.error('[PLAN GENERATE GROQ ERROR] Falling back to high-quality mock plan:', groqError);
        parsedPlan = getMockPlan(user);
      }
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
