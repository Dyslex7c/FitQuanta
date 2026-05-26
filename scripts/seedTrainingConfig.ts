import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        if (key) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (e) {
  console.warn('Failed to load .env.local manually:', e);
}

const TrainingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: 'trainingconfigs' }
);

const TrainingConfig: mongoose.Model<any> =
  mongoose.models.TrainingConfig ??
  mongoose.model('TrainingConfig', TrainingConfigSchema);

const DEFAULT_THRESHOLDS = {
  key: 'thresholds',
  value: {
    weeklyVolume:        { under: 40, optimal: [40, 150], over: 150 },
    weeklyFrequency:     { under: 2,  optimal: [3, 5],    over: 6  },
    consecutiveDays:     { overLimit: 5 },
    sleepHours:          { poor: 6,   good: 7.5 },
    calories:            { low: 1600, high: 3500 },
    cardioMinutes:       { over: 300 },
    setsPerMuscle:       { over: 20 },
    recoveryHours:       { minimum: 48 },
  },
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await TrainingConfig.findOneAndUpdate(
    { key: 'thresholds' },
    { $set: DEFAULT_THRESHOLDS },
    { upsert: true, new: true }
  );
  console.log('✓ Seeded training configuration thresholds.');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
