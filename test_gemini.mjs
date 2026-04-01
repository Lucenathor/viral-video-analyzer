import { analyzeVideoWithGemini } from './server/services/geminiDirect.ts';

// Test with a known working S3 URL from the previous successful analysis
const testUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/analysis/viral-_ifIqVd7pLIjKjPoTK0Ct.mp4';

console.log('Testing Gemini Direct API...');
console.log('GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);

try {
  const result = await analyzeVideoWithGemini(testUrl, 'video/mp4');
  console.log('SUCCESS! Score:', result.score);
  console.log('Hook Score:', result.hookScore);
  console.log('Hook Analysis (first 100 chars):', result.hookAnalysis.substring(0, 100));
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('Full error:', err.stack?.substring(0, 300));
}
