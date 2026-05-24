const mongoose = require('mongoose');

const uri = 'mongodb://rit007:HInvB6lzobHltSSE@dulcet-shard-00-00.a62sz.mongodb.net:27017,dulcet-shard-00-01.a62sz.mongodb.net:27017,dulcet-shard-00-02.a62sz.mongodb.net:27017/?authSource=admin&replicaSet=atlas-r5kgao-shard-0&tls=true';

console.log('Connecting to standard MongoDB Atlas URI...');

mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas using standard string!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Standard connection failed with error:', err);
    process.exit(1);
  });
