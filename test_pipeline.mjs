import { resolveVideoUrl, downloadResolvedVideo } from './server/services/videoUrlResolver.ts';

// Test with a public Instagram reel
const testUrl = 'https://www.instagram.com/reel/DFkMjxAoLHH/';

console.log('=== STEP 1: Resolve URL ===');
try {
  const resolved = await resolveVideoUrl(testUrl);
  console.log('Platform:', resolved.platform);
  console.log('Direct URL:', resolved.directUrl.substring(0, 100) + '...');
  console.log('Metadata:', JSON.stringify(resolved.metadata, null, 2));
  
  console.log('\n=== STEP 2: Download Video ===');
  const buffer = await downloadResolvedVideo(resolved);
  console.log('Downloaded size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('Buffer valid:', buffer.length > 1000 ? 'YES' : 'NO');
  
  console.log('\n=== ALL STEPS PASSED ===');
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('Stack:', err.stack);
}
