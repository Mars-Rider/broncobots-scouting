// Script to set CORS on Firebase Storage bucket
// Run: node setup-cors.js

const { Storage } = require('@google-cloud/storage');

const corsConfiguration = [
  {
    origin: ['http://localhost:3000'],
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type'],
  },
];

async function setCors() {
  try {
    const storage = new Storage({
      projectId: 'broncobots-scouting-3185e',
    });
    
    const bucket = storage.bucket('broncobots-scouting-3185e.appspot.com');
    
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('CORS configuration set successfully!');
  } catch (error) {
    console.error('Error setting CORS:', error.message);
    console.log('\nTo set CORS, you need to:');
    console.log('1. Set up Google Cloud authentication:');
    console.log('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"');
    console.log('\nOr use the Firebase CLI:');
    console.log('   firebase init functions');
    console.log('   Then use the Cloud SDK in your functions');
  }
}

setCors();

