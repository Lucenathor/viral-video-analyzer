const COCONUT_API_KEY = process.env.COCONUT_API_KEY;
const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');

const response = await fetch('https://api.coconut.co/v2/jobs/IvWDF2y3DpF4cI', {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${authHeader}`,
  }
});

const data = await response.json();
console.log('Job details:', JSON.stringify(data, null, 2));
