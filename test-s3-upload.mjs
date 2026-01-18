// Test direct S3 upload from frontend perspective
import fs from 'fs';
import path from 'path';

const FORGE_API_URL = process.env.VITE_FRONTEND_FORGE_API_URL || process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.VITE_FRONTEND_FORGE_API_KEY || process.env.BUILT_IN_FORGE_API_KEY;

console.log('=== Testing S3 Upload ===\n');
console.log('FORGE_API_URL:', FORGE_API_URL);
console.log('FORGE_API_KEY:', FORGE_API_KEY ? 'SET (length: ' + FORGE_API_KEY.length + ')' : 'NOT SET');

async function testS3Upload() {
  const videoPath = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';
  const stats = fs.statSync(videoPath);
  console.log('\nVideo file size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  
  // Read file
  console.log('Reading file...');
  const buffer = fs.readFileSync(videoPath);
  
  // Create FormData-like structure
  const fileKey = `videos/test/${Date.now()}-test-video.mov`;
  
  // Build upload URL
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', fileKey);
  
  console.log('Upload URL:', uploadUrl.toString());
  
  // Create form data
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('file', buffer, {
    filename: 'test-video.mov',
    contentType: 'video/quicktime',
  });
  
  console.log('\nUploading to S3...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FORGE_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });
    
    const elapsed = Date.now() - startTime;
    console.log('Response status:', response.status, response.statusText);
    console.log('Upload time:', elapsed, 'ms');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Upload result:', result);
    console.log('\n✓ Upload successful!');
    console.log('Video URL:', result.url);
    
  } catch (error) {
    console.error('Upload error:', error.message);
    console.error('Error details:', error);
  }
}

testS3Upload();
