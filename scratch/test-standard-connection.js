const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read MONGODB_URI from process.env or .env.local
let uri = process.env.MONGODB_URI || '';

if (!uri) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('MONGODB_URI=')) {
          uri = line.split('MONGODB_URI=')[1].trim().replace(/['"]/g, '');
          break;
        }
      }
    }
  } catch (err) {
    // Ignore and proceed
  }
}

if (!uri) {
  console.error('Error: MONGODB_URI not found in process.env or .env.local');
  process.exit(1);
}

console.log('Connecting to standard MongoDB Atlas URI (sanitized)...');

mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Standard connection failed with error:', err);
    process.exit(1);
  });
