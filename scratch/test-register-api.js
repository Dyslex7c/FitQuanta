const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Construct URI from .env.local
const uri = 'mongodb://rit007:HInvB6lzobHltSSE@dulcet-shard-00-00.a62sz.mongodb.net:27017,dulcet-shard-00-01.a62sz.mongodb.net:27017,dulcet-shard-00-02.a62sz.mongodb.net:27017/?authSource=admin&replicaSet=atlas-r5kgao-shard-0&tls=true';
const JWT_SECRET = 'supersecretsupersecretsupersecretsupersecretsupersecretsupersecret';

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
