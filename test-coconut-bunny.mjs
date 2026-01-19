const COCONUT_API_KEY = process.env.COCONUT_API_KEY;
const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');

// Use Big Buck Bunny - a well-known public domain video
const jobRequest = {
  input: {
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
  },
  storage: {
    service: 'coconut'
  },
  outputs: {
    'mp4:480p': {
      path: '/compressed.mp4'
    }
  },
  notification: {
    type: 'http',
    url: 'https://app.coconut.co/notifications/http/fbadaade'
  }
};

console.log('Creating job with Big Buck Bunny video...');

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

// Wait and check status
async function checkStatus(jobId) {
  const res = await fetch(`https://api.coconut.co/v2/jobs/${jobId}`, {
    headers: { 'Authorization': `Basic ${authHeader}` }
  });
  return await res.json();
}

console.log('Waiting for completion...');
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 3000));
  const status = await checkStatus(job.id);
  console.log(`Status: ${status.status}, Progress: ${status.progress}`);
  
  if (status.status === 'job.completed') {
    console.log('SUCCESS! Output URLs:', JSON.stringify(status.output_urls, null, 2));
    break;
  }
  if (status.status === 'job.failed') {
    console.log('FAILED:', JSON.stringify(status, null, 2));
    break;
  }
}
