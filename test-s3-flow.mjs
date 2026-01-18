// Test complete S3 upload + LLM analysis flow
import { config } from 'dotenv';
import fs from 'fs';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Use a small test video - download a sample first
const testVideoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

async function downloadVideo() {
  console.log('Downloading test video...');
  const response = await fetch(testVideoUrl);
  const buffer = await response.arrayBuffer();
  console.log(`Downloaded ${buffer.byteLength} bytes`);
  return Buffer.from(buffer);
}

async function uploadToS3(buffer, fileKey) {
  console.log(`Uploading to S3: ${fileKey}`);
  
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', fileKey);
  
  const blob = new Blob([buffer], { type: 'video/mp4' });
  const formData = new FormData();
  formData.append('file', blob, fileKey.split('/').pop());
  
  const response = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('Upload result:', result);
  return result.url;
}

async function getDownloadUrl(fileKey) {
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const downloadApiUrl = new URL('v1/storage/downloadUrl', baseUrl);
  downloadApiUrl.searchParams.set('path', fileKey);
  
  const response = await fetch(downloadApiUrl.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Get download URL failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('Download URL result:', result);
  return result.url;
}

async function analyzeWithLLM(videoUrl) {
  console.log('\nAnalyzing video with LLM...');
  console.log('Video URL:', videoUrl);
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { 
        role: 'system', 
        content: 'Describe what you see in the video. Be specific about the visual content. Mention specific elements like brands, characters, or actions.' 
      },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: 'What is happening in this video? Describe the visual content in detail.' },
          { type: 'file_url', file_url: { url: videoUrl, mime_type: 'video/mp4' } }
        ]
      }
    ],
    max_tokens: 1024
  };
  
  const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  
  console.log('LLM Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

async function runTest() {
  try {
    console.log('=== COMPLETE S3 + LLM FLOW TEST ===\n');
    
    // Step 1: Download test video
    const videoBuffer = await downloadVideo();
    
    // Step 2: Upload to S3
    const fileKey = `test/video-test-${Date.now()}.mp4`;
    const uploadedUrl = await uploadToS3(videoBuffer, fileKey);
    console.log('Uploaded URL:', uploadedUrl);
    
    // Step 3: Get presigned download URL
    const downloadUrl = await getDownloadUrl(fileKey);
    console.log('Presigned Download URL:', downloadUrl);
    
    // Step 4: Test if URL is accessible
    console.log('\nTesting URL accessibility...');
    const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
    console.log('URL accessible:', testResponse.ok, testResponse.status);
    
    // Step 5: Analyze with LLM using the S3 URL
    const analysis = await analyzeWithLLM(downloadUrl);
    
    console.log('\n=== LLM ANALYSIS RESULT ===');
    console.log(analysis);
    
    // Check if it mentions specific content
    const mentionsSpecific = 
      analysis.toLowerCase().includes('chromecast') ||
      analysis.toLowerCase().includes('hbo') ||
      analysis.toLowerCase().includes('game of thrones') ||
      analysis.toLowerCase().includes('dragon') ||
      analysis.toLowerCase().includes('fire') ||
      analysis.toLowerCase().includes('tablet');
    
    console.log('\n=== RESULT ===');
    console.log('Mentions specific video content:', mentionsSpecific ? '✅ YES' : '❌ NO');
    
    if (mentionsSpecific) {
      console.log('\n✅ COMPLETE FLOW TEST PASSED!');
    } else {
      console.log('\n❌ FLOW TEST FAILED - LLM did not see the video content');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

runTest();
