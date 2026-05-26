const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const fs = require('fs');
const path = require('path');

// Read MONGODB_URI and JWT_SECRET from process.env or .env.local
let uri = process.env.MONGODB_URI || '';
let JWT_SECRET = process.env.JWT_SECRET || '';

if (!uri || !JWT_SECRET) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('MONGODB_URI=')) {
          uri = trimmed.split('MONGODB_URI=')[1].trim().replace(/['"]/g, '');
        }
        if (trimmed.startsWith('JWT_SECRET=')) {
          JWT_SECRET = trimmed.split('JWT_SECRET=')[1].trim().replace(/['"]/g, '');
        }
      }
    }
  } catch (err) {
    // Ignore
  }
}

if (!uri) {
  console.error('Error: MONGODB_URI not found in process.env or .env.local');
  process.exit(1);
}
if (!JWT_SECRET) {
  JWT_SECRET = 'fallback_test_secret_key_only_for_test';
}

// Schema and Model
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'trainer', 'client'], default: 'client' },
  },
  { timestamps: true, strict: false }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const email = `test-${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Test User';

    console.log('Checking for existing user...');
    const existing = await User.findOne({ email });
    console.log('Existing check done. Found:', existing);

    console.log('Hashing password...');
    const hashed = await bcrypt.hash(password, 12);
    console.log('Password hashed.');

    console.log('Creating user in DB...');
    const user = await User.create({ name, email, password: hashed, role: 'client' });
    console.log('User created:', user);

    console.log('Signing token...');
    const token = jwt.sign({ userId: user._id.toString(), role: 'client' }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Token signed successfully:', token);

    // Clean up test user
    console.log('Cleaning up test user...');
    await User.deleteOne({ _id: user._id });
    console.log('Cleanup completed.');

    process.exit(0);
  } catch (err) {
    console.error('API simulation failed with error:', err);
    process.exit(1);
  }
}
run();
