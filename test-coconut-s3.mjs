const COCONUT_API_KEY = process.env.COCONUT_API_KEY;
const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');

// Use the video that's already uploaded to S3 (the one we tested with Azure)
const s3VideoUrl = 'https://manus-storage-test.s3.us-east-1.amazonaws.com/test-video-1737290067.mp4';

const jobRequest = {
  input: {
    url: s3VideoUrl
  },
  storage: {
    service: 'coconut'
  },
  outputs: {
    'mp4:720p': {
      path: '/compressed.mp4'
    }
  },
  notification: {
    type: 'http',
    url: 'https://app.coconut.co/notifications/http/fbadaade'
  }
};

console.log('Creating job with S3 video...');
console.log('Input URL:', s3VideoUrl);

const response = await fetch('https://api.coconut.co/v2/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${authHeader}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(jobRequest)
});

const job = await response.json();
console.log('Job created:', job.id, 'Status:', job.status);

if (job.error) {
  console.log('Error:', job.message);
  process.exit(1);
}

// Wait and check status
async function checkStatus(jobId) {
  const res = await fetch(`https://api.coconut.co/v2/jobs/${jobId}`, {
    headers: { 'Authorization': `Basic ${authHeader}` }
  });
  return await res.json();
}

console.log('Waiting for completion...');
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const status = await checkStatus(job.id);
  console.log(`[${i*5}s] Status: ${status.status}, Progress: ${status.progress}, Input: ${status.input?.status}`);
  
  if (status.status === 'job.completed') {
    console.log('\n=== SUCCESS! ===');
    console.log('Output URLs:', JSON.stringify(status.output_urls, null, 2));
    break;
  }
  if (status.status === 'job.failed') {
    console.log('\n=== FAILED ===');
    console.log('Details:', JSON.stringify(status, null, 2));
    break;
  }
}
