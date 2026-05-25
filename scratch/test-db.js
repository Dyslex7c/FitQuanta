const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function testConnection() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('Error: .env.local file not found');
      return;
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    let uri = '';
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts[0] && parts[0].trim() === 'MONGODB_URI') {
        uri = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    });

    if (!uri) {
      console.log('Error: MONGODB_URI not found in .env.local');
      return;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connection successful!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Check users
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log('Number of users:', userCount);

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testConnection();
