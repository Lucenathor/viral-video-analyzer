import { resolveVideoUrl, downloadResolvedVideo } from './server/services/videoUrlResolver.ts';
import { storagePut, storageGet } from './server/storage.ts';
import { analyzeVideoWithGemini } from './server/services/geminiDirect.ts';
import { nanoid } from 'nanoid';

// Test the FULL flow: resolve URL -> download -> upload to S3 -> analyze with Gemini

const testUrl = 'https://www.instagram.com/p/CyGEFpToo62/';

console.log('=== FULL FLOW TEST ===\n');

try {
  // Step 1: Resolve
  console.log('STEP 1: Resolving URL...');
  const resolved = await resolveVideoUrl(testUrl);
  console.log('  Platform:', resolved.platform);
  console.log('  Direct URL:', resolved.directUrl.substring(0, 80) + '...');

  // Step 2: Download
  console.log('\nSTEP 2: Downloading video...');
  const buffer = await downloadResolvedVideo(resolved);
  console.log('  Size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');

  // Step 3: Upload to S3
  console.log('\nSTEP 3: Uploading to S3...');
  const key = `test/viral-${nanoid()}.mp4`;
  const { url: s3Url } = await storagePut(key, buffer, 'video/mp4');
  console.log('  S3 URL:', s3Url.substring(0, 100) + '...');

  // Step 3b: Verify the S3 URL is accessible
  console.log('\nSTEP 3b: Verifying S3 URL accessibility...');
  const headResp = await fetch(s3Url, { method: 'HEAD' });
  console.log('  HEAD status:', headResp.status);
  console.log('  Content-Type:', headResp.headers.get('content-type'));
  console.log('  Content-Length:', headResp.headers.get('content-length'));

  // Step 4: Analyze with Gemini
  console.log('\nSTEP 4: Analyzing with Gemini Direct API...');
  console.log('  Sending S3 URL to Gemini...');
  const analysis = await analyzeVideoWithGemini(s3Url, 'video/mp4');
  console.log('  Score:', analysis.score);
  console.log('  Hook Score:', analysis.hookScore);
  console.log('  Hook Analysis:', analysis.hookAnalysis.substring(0, 150));

  console.log('\n=== ALL STEPS PASSED ===');
} catch (err) {
  console.error('\nFAILED:', err.message);
  console.error('Stack:', err.stack?.substring(0, 500));
}
