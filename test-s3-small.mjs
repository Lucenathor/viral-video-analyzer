import fs from 'fs';

const FORGE_API_URL = process.env.VITE_FRONTEND_FORGE_API_URL || process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.VITE_FRONTEND_FORGE_API_KEY || process.env.BUILT_IN_FORGE_API_KEY;

console.log('=== Testing S3 Upload with small file ===\n');

async function testSmallUpload() {
  // Create a small test file
  const testContent = Buffer.from('Hello World - Test file');
  const fileKey = `test/${Date.now()}-test.txt`;
  
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', fileKey);
  
  console.log('Upload URL:', uploadUrl.toString());
  
  // Try using native fetch with Blob
  const blob = new Blob([testContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'test.txt');
  
  console.log('Uploading small file...');
  
  try {
    const response = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FORGE_API_KEY}`,
      },
      body: formData,
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Upload result:', result);
    console.log('\n✓ Upload successful!');
    
  } catch (error) {
    console.error('Upload error:', error.message);
  }
}

testSmallUpload();
