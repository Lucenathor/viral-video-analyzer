// Test if Manus storage URLs are accessible for Coconut

// First, let's get a presigned URL using the API directly
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.log('Missing FORGE credentials');
  process.exit(1);
}

// Get a download URL for a test file
const downloadApiUrl = new URL('v1/storage/downloadUrl', FORGE_API_URL.endsWith('/') ? FORGE_API_URL : FORGE_API_URL + '/');
downloadApiUrl.searchParams.set('path', 'videos/test/test.mp4');

console.log('Getting presigned URL...');
const response = await fetch(downloadApiUrl, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${FORGE_API_KEY}` }
});

const data = await response.json();
console.log('Presigned URL:', data.url);

// Test accessibility
if (data.url) {
  console.log('\nTesting URL accessibility...');
  const headResponse = await fetch(data.url, { method: 'HEAD' });
  console.log('Status:', headResponse.status);
}
