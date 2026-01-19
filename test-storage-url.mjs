import { storageGet } from './server/storage.ts';

async function testStorageUrl() {
  console.log('Getting presigned URL from storage...');
  
  // Get the URL for a video chunk that was uploaded
  const { url } = await storageGet('videos/test/test-video.chunk0');
  console.log('Presigned URL:', url);
  
  // Test if the URL is accessible
  console.log('\nTesting URL accessibility...');
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    if (response.ok) {
      console.log('\n=== URL is accessible! ===');
      
      // Now test with Coconut
      console.log('\nTesting with Coconut...');
      const COCONUT_API_KEY = process.env.COCONUT_API_KEY;
      const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');
      
      const jobRequest = {
        input: { url },
        storage: { service: 'coconut' },
        outputs: { 'mp4:480p': { path: '/compressed.mp4' } },
        notification: { type: 'http', url: 'https://app.coconut.co/notifications/http/fbadaade' }
      };
      
      const coconutResponse = await fetch('https://api.coconut.co/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobRequest)
      });
      
      const job = await coconutResponse.json();
      console.log('Coconut job created:', job.id, 'Status:', job.status);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStorageUrl();
