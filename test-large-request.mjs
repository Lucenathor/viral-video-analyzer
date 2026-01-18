// Test sending a large request to the server
import fs from 'fs';

async function testLargeRequest() {
  console.log('=== Testing Large Request ===\n');
  
  // Read the actual video file
  const videoPath = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';
  const stats = fs.statSync(videoPath);
  console.log('Video file size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  
  // Read and convert to base64
  console.log('Reading file...');
  const buffer = fs.readFileSync(videoPath);
  console.log('Converting to base64...');
  const base64 = buffer.toString('base64');
  const dataUrl = `data:video/quicktime;base64,${base64}`;
  console.log('Data URL length:', (dataUrl.length / 1024 / 1024).toFixed(2), 'MB');
  
  // Try to send to the server
  console.log('\nSending request to server...');
  const startTime = Date.now();
  
  try {
    // First, we need to get a session cookie
    // For testing, let's just check if the server can handle the request size
    const testPayload = {
      videoData: dataUrl,
      fileName: 'test-video.mov',
      mimeType: 'video/quicktime',
      analysisType: 'viral_analysis'
    };
    
    const payloadSize = JSON.stringify(testPayload).length;
    console.log('Payload size:', (payloadSize / 1024 / 1024).toFixed(2), 'MB');
    
    // The issue is that the video is ~67MB in base64
    // This is too large for a single HTTP request in most configurations
    
    console.log('\n⚠️  ISSUE IDENTIFIED:');
    console.log('The video is', (dataUrl.length / 1024 / 1024).toFixed(2), 'MB in base64');
    console.log('This is likely exceeding:');
    console.log('1. Browser memory limits for FileReader');
    console.log('2. HTTP request timeout (default ~30s)');
    console.log('3. Proxy/CDN request size limits');
    
    console.log('\n=== RECOMMENDED SOLUTIONS ===');
    console.log('1. Use chunked upload (upload in parts)');
    console.log('2. Use direct S3 upload from frontend');
    console.log('3. Compress video before upload');
    console.log('4. Limit video size to ~20MB');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLargeRequest();
