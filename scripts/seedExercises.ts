// Load environment variables first so that db connection can retrieve MONGODB_URI
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { connectDB } from '../lib/mongodb';
import Exercise from '../models/Exercise';
import mongoose from 'mongoose';

const SAMPLE_EXERCISES = [
  {
    name: 'Barbell Bench Press',
    slug: 'barbell-bench-press',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    workoutType: 'push',
    difficulty: 'intermediate',
    instructions: [
      'Lie flat on the bench with your feet flat on the floor, pushing down lightly to stabilize your pelvis.',
      'Grip the barbell with hands slightly wider than shoulder-width apart, ensuring your wrists are straight.',
      'Unrack the barbell and hold it directly over your chest with arms fully locked and shoulder blades retracted.',
      'Lower the bar slowly to your mid-chest while keeping your elbows tucked at a 45-degree angle.',
      'Push the bar back up powerfully by driving your feet into the floor and extending your elbows fully.',
      'Re-engage shoulder blades and repeat for the desired number of reps.'
    ],
    commonMistakes: [
      'Bouncing the barbell off the chest at the bottom of the movement.',
      'Flaring the elbows outward at 90 degrees, placing heavy stress on the rotator cuffs.',
      'Lifting the hips or lower back excessively off the bench during the press.'
    ],
    safetyNotes: [
      'Always perform this exercise with a spotter present when lifting heavy loads.',
      'Ensure the bar is securely racked and clamps are placed on both ends of the barbell.',
      'Avoid locking out elbows hyper-aggressively at the top of the movement.'
    ],
    recommendedSets: '4',
    recommendedReps: '8-10',
    caloriesBurnedEstimate: 95
  },
  {
    name: 'Dumbbell Bicep Curl',
    slug: 'dumbbell-bicep-curl',
    muscleGroup: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    workoutType: 'pull',
    difficulty: 'beginner',
    instructions: [
      'Stand upright with feet shoulder-width apart and a dumbbell in each hand, palms facing forward.',
      'Keep your elbows tucked close to your torso and stabilize your shoulders by squeezing your shoulder blades.',
      'Curl the weights upward while contracting your biceps, keeping the upper arms completely stationary.',
      'Continue raising the dumbbells until they reach shoulder level, holding the contraction for a full second.',
      'Inhale and slowly lower the dumbbells back to the starting position in a controlled motion.',
      'Fully extend your arms at the bottom before initiating the next repetition.'
    ],
    commonMistakes: [
      'Swinging the torso or using momentum to lift the dumbbells upward.',
      'Allowing the elbows to drift forward, engaging the anterior deltoids rather than isolation biceps.',
      'Dropping the weights rapidly without resisting on the eccentric phase.'
    ],
    safetyNotes: [
      'Use a weight that allows you to maintain completely still posture throughout the set.',
      'Keep your wrists neutral and strong; do not let them bend backward under the weight.',
      'Keep your knees slightly unlocked to absorb force and protect the lower back.'
    ],
    recommendedSets: '3',
    recommendedReps: '12-15',
    caloriesBurnedEstimate: 60
  },
  {
    name: 'Bodyweight Squat',
    slug: 'bodyweight-squat',
    muscleGroup: 'quadriceps',
    secondaryMuscles: ['glutes', 'hamstrings', 'calves'],
    equipment: 'bodyweight',
    workoutType: 'legs',
    difficulty: 'beginner',
    instructions: [
      'Stand with feet shoulder-width apart, toes pointed slightly outward, and arms relaxed at your sides.',
      'Brace your core, push your hips back, and bend your knees as if sitting down into a chair.',
      'Keep your chest upright and head forward, ensuring your knees track in line with your toes.',
      'Lower yourself until your thighs are at least parallel to the floor, or slightly lower if flexibility allows.',
      'Drive through your heels to return to the starting position, squeezing your glutes at the top.',
      'Maintain continuous control, keeping your weight evenly distributed across your feet.'
    ],
    commonMistakes: [
      'Allowing knees to cave inward (valgus collapse) during the descent or ascent.',
      'Rounding the lower back (butt wink) at the bottom of the squat.',
      'Shifting the weight to the toes and letting the heels lift off the ground.'
    ],
    safetyNotes: [
      'If you feel knee discomfort, reduce the depth of the squat until mobility improves.',
      'Keep your spine neutral throughout; do not look straight up at the ceiling or straight down at your feet.',
      'Ensure the floor is non-slippery to prevent foot sliding.'
    ],
    recommendedSets: '3-4',
    recommendedReps: '15-20',
    caloriesBurnedEstimate: 80
  },
  {
    name: 'Pull-Up',
    slug: 'pull-up',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'shoulders', 'forearms'],
    equipment: 'pull_up_bar',
    workoutType: 'pull',
    difficulty: 'intermediate',
    instructions: [
      'Hang from a pull-up bar with an overhand grip (palms facing away), hands slightly wider than shoulder-width.',
      'Start from a dead hang with arms fully extended and shoulders pulled away from your ears.',
      'Squeeze your shoulder blades together and pull your elbows down toward your ribs.',
      'Pull your chest up toward the bar until your chin has cleared the bar comfortably.',
      'Pause briefly at the top to secure the contraction in your latissimus dorsi.',
      'Lower yourself slowly back down to a full dead hang with complete muscular control.'
    ],
    commonMistakes: [
      'Kicking the legs or swinging the hips (kipping) to generate momentum.',
      'Using incomplete ranges of motion, such as not lowering all the way down or not pulling chin above the bar.',
      'Letting the shoulders shrug up toward the ears, placing heavy stress on the neck.'
    ],
    safetyNotes: [
      'Ensure the pull-up bar is securely mounted and capable of supporting your weight.',
      'Control the descent to avoid jerking your shoulder joints at the bottom of the hang.',
      'If unable to perform full bodyweight pull-ups, use a resistance band or assisted machine.'
    ],
    recommendedSets: '3',
    recommendedReps: '6-10',
    caloriesBurnedEstimate: 110
  },
  {
    name: 'Cable Triceps Pushdown',
    slug: 'cable-triceps-pushdown',
    muscleGroup: 'triceps',
    secondaryMuscles: ['shoulders', 'core'],
    equipment: 'cable',
    workoutType: 'push',
    difficulty: 'beginner',
    instructions: [
      'Attach a rope or straight bar to a high cable pulley and grab the handle with an overhand grip.',
      'Stand facing the machine, hinge forward slightly at the hips, and pull your elbows tight to your sides.',
      'Keep your upper arms locked in place and press the handle down toward your thighs by extending your elbows.',
      'At the bottom of the movement, fully contract your triceps and flare the rope outward slightly.',
      'Slowly return the handle upward to the starting position, letting your elbows bend up to roughly 90 degrees.',
      'Maintain strict posture and avoid leaning over the rope to use chest weight.'
    ],
    commonMistakes: [
      'Letting the elbows flare out to the sides during the pushdown phase.',
      'Using torso weight or leaning forward aggressively to push the weight down.',
      'Allowing the upper arms to move forward and backward, losing triceps isolation.'
    ],
    safetyNotes: [
      'Avoid letting the weight stack slam together at the top of the movement.',
      'Ensure the attachment is securely locked into the cable carabiner.',
      'Maintain a neutral spine; do not round your shoulders or upper back.'
    ],
    recommendedSets: '3',
    recommendedReps: '10-12',
    caloriesBurnedEstimate: 50
  },
  {
    name: 'Barbell Deadlift',
    slug: 'barbell-deadlift',
    muscleGroup: 'glutes',
    secondaryMuscles: ['hamstrings', 'back', 'core', 'forearms'],
    equipment: 'barbell',
    workoutType: 'compound',
    difficulty: 'advanced',
    instructions: [
      'Stand with feet hip-width apart, with the barbell positioned directly over the middle of your feet.',
      'Hinge at your hips and bend your knees slightly to grab the bar with a shoulder-width grip.',
      'Flatten your back, pull your chest up, and pull your shoulders back to slacken the bar against the plates.',
      'Drive through your legs to pull the barbell upward, keeping it close to your shins throughout the lift.',
      'As the bar passes your knees, push your hips forward to lock out fully, standing tall with shoulders retracted.',
      'Push your hips back and lower the bar under control, maintaining a flat back until the plates touch the floor.'
    ],
    commonMistakes: [
      'Rounding the spine (kyphosis) under load, which puts dangerous pressure on the lumbar vertebrae.',
      'Pulling exclusively with the upper body rather than driving through the legs.',
      'Hyperextending or leaning back excessively at the top lockout position.'
    ],
    safetyNotes: [
      'Never attempt this exercise with heavy weight without a completely flat spine.',
      'Wear flat-soled shoes or lift barefoot to establish a solid connection to the floor.',
      'Stop immediately if you feel sharp pain in your lower back.'
    ],
    recommendedSets: '3-4',
    recommendedReps: '5',
    caloriesBurnedEstimate: 130
  },
  {
    name: 'Dumbbell Shoulder Press',
    slug: 'dumbbell-shoulder-press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps', 'chest'],
    equipment: 'dumbbell',
    workoutType: 'push',
    difficulty: 'intermediate',
    instructions: [
      'Sit on an upright bench with back support, holding a dumbbell in each hand at shoulder height.',
      'Position your elbows slightly forward (in the scapular plane) rather than flared directly to the sides.',
      'Brace your core, press your feet firmly into the floor, and press the dumbbells straight up overhead.',
      'Drive the weights upward until your arms are fully extended but not hyperextended.',
      'Lower the dumbbells slowly and in a controlled path back to shoulder height.',
      'Pause briefly at the bottom to eliminate elastic momentum before the next repetition.'
    ],
    commonMistakes: [
      'Allowing the lower back to arch excessively, pushing the hips forward away from the bench support.',
      'Flaring the elbows outward at 90 degrees, increasing joint friction and rotator cuff impingement.',
      'Letting the dumbbells collide or bang together at the top of the movement.'
    ],
    safetyNotes: [
      'Always secure a bench with proper vertical angle or perform standing with strict core bracing.',
      'If using heavy dumbbells, safely kick them up to shoulder height using your knees.',
      'Avoid hyperextending your neck; keep your gaze straight forward throughout.'
    ],
    recommendedSets: '4',
    recommendedReps: '8-12',
    caloriesBurnedEstimate: 75
  },
  {
    name: 'Hanging Knee Raise',
    slug: 'hanging-knee-raise',
    muscleGroup: 'core',
    secondaryMuscles: ['forearms'],
    equipment: 'pull_up_bar',
    workoutType: 'isolation',
    difficulty: 'beginner',
    instructions: [
      'Hang from a pull-up bar with an overhand grip, arms fully extended and shoulders stabilized.',
      'Engage your abdominal muscles and slowly bend your knees to pull them upward toward your chest.',
      'Raise your knees until your thighs are slightly above parallel to the floor, rolling your pelvis upward.',
      'Squeeze your lower abdominals at the top position for a full second.',
      'Slowly lower your legs back to the vertical starting position, resisting the pull of gravity.',
      'Avoid swinging or using momentum as you transition into the next repetition.'
    ],
    commonMistakes: [
      'Swinging the legs back and forth, using hip flexors and momentum rather than core isolation.',
      'Dropping the legs quickly, skipping the eccentric core contraction phase.',
      'Hanging with completely loose shoulders, which places heavy strain on the shoulder capsule.'
    ],
    safetyNotes: [
      'Keep your shoulders packed (depressed and retracted) to protect the shoulder joints.',
      'If grip strength is a limiting factor, consider using abdominal straps or doing raises on a captain\'s chair.',
      'Ensure your grip is secure on the bar before starting.'
    ],
    recommendedSets: '3',
    recommendedReps: '12-15',
    caloriesBurnedEstimate: 45
  },
  {
    name: 'Dumbbell Bulgarian Split Squat',
    slug: 'dumbbell-bulgarian-split-squat',
    muscleGroup: 'quadriceps',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    workoutType: 'legs',
    difficulty: 'intermediate',
    instructions: [
      'Stand about two feet in front of a flat bench, holding a dumbbell in each hand with your palms facing in.',
      'Place the top of your trailing foot flat on the bench behind you, keeping your chest upright.',
      'Lower your hips slowly until your front thigh is nearly parallel to the floor, bending both knees.',
      'Ensure your front knee tracks in line with your front foot and does not drift excessively past your toes.',
      'Drive through the heel of your front foot to rise back up to the starting position.',
      'Complete all repetitions on one side before switching to the opposite leg.'
    ],
    commonMistakes: [
      'Leaning forward excessively and letting the chest collapse, putting heavy stress on the lower back.',
      'Placing the front foot too close to the bench, causing knee strain.',
      'Allowing the front knee to cave inwards during the squat motion.'
    ],
    safetyNotes: [
      'Keep your core tightly braced to maintain stability and balance throughout the movement.',
      'Start with a light weight or bodyweight only to master the balance before adding heavy dumbbells.',
      'Ensure the bench behind you is secure and will not slip.'
    ],
    recommendedSets: '3',
    recommendedReps: '10-12 each side',
    caloriesBurnedEstimate: 85
  },
  {
    name: 'Calf Raise',
    slug: 'calf-raise',
    muscleGroup: 'calves',
    secondaryMuscles: [],
    equipment: 'none',
    workoutType: 'isolation',
    difficulty: 'beginner',
    instructions: [
      'Stand upright on a flat surface or a slight elevated ledge, with your feet hip-width apart.',
      'Keep your knees straight but unlocked, and place your hands on a wall or steady object for balance if needed.',
      'Raise your heels slowly by pushing through the balls of both feet, lifting your body straight upward.',
      'Squeeze your calf muscles firmly at the top of the contraction for a full second.',
      'Slowly lower your heels back down until they are touching the floor or slightly below the ledge.',
      'Repeat the movement in a controlled manner, avoiding any rapid bouncing or jerking.'
    ],
    commonMistakes: [
      'Bouncing rapidly at the bottom of the movement, using achilles tendon elasticity instead of muscular work.',
      'Bending the knees during the raise, which transfers load to the quadriceps.',
      'Rushing through the eccentric (lowering) phase without control.'
    ],
    safetyNotes: [
      'Maintain upright spinal posture; do not hinge at the hips or round your shoulders.',
      'Ensure you do not roll your ankles outward or inward at the peak of the raise.',
      'If performing on a ledge, ensure your footing is completely secure.'
    ],
    recommendedSets: '3-4',
    recommendedReps: '15-20',
    caloriesBurnedEstimate: 40
  },
  {
    name: 'Push-Up',
    slug: 'push-up',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'core'],
    equipment: 'bodyweight',
    workoutType: 'push',
    difficulty: 'beginner',
    instructions: [
      'Place your hands flat on the floor, slightly wider than shoulder-width, and extend your legs behind you.',
      'Form a straight line from your head to your heels, bracing your core and contracting your glutes.',
      'Lower your chest toward the floor by bending your elbows, keeping them tucked at a 45-degree angle.',
      'Continue descending until your chest is just a few inches off the floor.',
      'Press powerfully through your hands to extend your elbows and return to the starting plank position.',
      'Avoid letting your lower back sag or your hips rise upward throughout the set.'
    ],
    commonMistakes: [
      'Flaring the elbows out at a 90-degree angle, placing excessive shear stress on the shoulders.',
      'Letting the hips sag or the lower back arch, indicating weak core engagement.',
      'Using a restricted range of motion and failing to go deep enough.'
    ],
    safetyNotes: [
      'Keep your neck neutral by looking at a point on the floor about a foot in front of your hands.',
      'If standard push-ups are too difficult, perform them with your knees on the floor or against an elevated box.',
      'Ensure your wrists are comfortable; use push-up handles if you experience wrist pain.'
    ],
    recommendedSets: '3',
    recommendedReps: '12-15',
    caloriesBurnedEstimate: 65
  },
  {
    name: 'Barbell Back Squat',
    slug: 'barbell-back-squat',
    muscleGroup: 'quadriceps',
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'barbell',
    workoutType: 'legs',
    difficulty: 'advanced',
    instructions: [
      'Position a barbell in a squat rack at chest height, and step under the bar, placing it firmly on your upper traps.',
      'Grip the bar with hands wider than shoulder-width, unrack it safely, and take two steps backward.',
      'Stand with feet slightly wider than shoulder-width apart, toes turned outward at 15-30 degrees.',
      'Brace your core, push your hips back, and bend your knees to lower your body under control.',
      'Descend until the crease of your hips is below the top of your knees (at least parallel).',
      'Drive powerfully upward through your heels, keeping your chest up and knees tracking in line with your feet.'
    ],
    commonMistakes: [
      'Allowing the knees to cave inward (knee valgus) under heavy loads.',
      'Rising on the toes and letting the heels lift, putting shear force on the knee joints.',
      'Rounding the lower back (butt wink) or collapsing the chest forward.'
    ],
    safetyNotes: [
      'Always set up safety bars in the squat rack at the appropriate height before lifting.',
      'Squat in a controlled eccentric cadence (2-3 seconds down) to protect spinal columns.',
      'Wear sturdy, flat-soled lifting shoes to establish solid ankle stability.'
    ],
    recommendedSets: '4',
    recommendedReps: '6-8',
    caloriesBurnedEstimate: 120
  }
];

async function seed() {
  console.log('Starting Exercise database seeder...');
  let connection: typeof mongoose | null = null;
  try {
    connection = await connectDB();
    console.log('Successfully connected to MongoDB.');

    // Clear existing exercises
    const deleteResult = await Exercise.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing exercises from database.`);

    // Insert new sample exercises
    const insertResult = await Exercise.insertMany(SAMPLE_EXERCISES);
    console.log(`Successfully seeded ${insertResult.length} exercises into the database!`);
  } catch (error) {
    console.error('Seeder execution failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    }
    process.exit(0);
  }
}

seed();
