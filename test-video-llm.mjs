// Test if LLM can analyze video content directly
import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// First, let's get a presigned URL for the uploaded video
const videoKey = 'videos/test/1768777086911-test-video.mov.chunk0';

async function getVideoUrl() {
  const downloadApiUrl = new URL('v1/storage/downloadUrl', FORGE_API_URL.replace(/\/+$/, '') + '/');
  downloadApiUrl.searchParams.set('path', videoKey);
  
  const response = await fetch(downloadApiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
  });
  
  const result = await response.json();
  return result.url;
}

async function testVideoAnalysis() {
  console.log('=== Testing Video Analysis with LLM ===\n');
  
  // Use a public video URL for testing
  const videoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  
  console.log('Testing with video URL:', videoUrl);
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto analista de contenido viral. Analiza el vídeo proporcionado y describe lo que ves.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analiza este vídeo y describe: 1) Qué sucede en el vídeo, 2) Cuántos segundos dura aproximadamente, 3) Qué elementos visuales destacan. Responde en español.'
          },
          {
            type: 'file_url',
            file_url: {
              url: videoUrl,
              mime_type: 'video/mp4'
            }
          }
        ]
      }
    ],
    max_tokens: 2048
  };
  
  console.log('\nSending request to LLM...');
  
  try {
    const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('\n=== LLM Response ===');
    console.log(result.choices[0].message.content);
    console.log('\n✓ Video analysis successful!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVideoAnalysis();
