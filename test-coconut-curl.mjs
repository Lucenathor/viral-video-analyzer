const COCONUT_API_KEY = process.env.COCONUT_API_KEY;
const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');

const jobRequest = {
  input: {
    url: 'https://storage.googleapis.com/coconut-demo/spring.mp4'
  },
  storage: {
    service: 'coconut'
  },
  outputs: {
    'mp4:720p': {
      path: '/compressed.mp4'
    }
  }
};

console.log('Request body:', JSON.stringify(jobRequest, null, 2));
console.log('\nAuth header:', authHeader);

const response = await fetch('https://api.coconut.co/v2/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${authHeader}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(jobRequest)
});

console.log('\nResponse status:', response.status);
const responseText = await response.text();
console.log('Response body:', responseText);
