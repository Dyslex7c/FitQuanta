const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let uri = '';

for (const line of lines) {
  if (line.startsWith('MONGODB_URI=')) {
    uri = line.substring('MONGODB_URI='.length).trim();
  }
}

if (!uri) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('Connecting to:', uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed with error:', err);
    process.exit(1);
  });
