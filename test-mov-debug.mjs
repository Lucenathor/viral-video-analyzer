// Debug test for user's MOV video
import { config } from 'dotenv';
import fs from 'fs';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Use the already uploaded video URL
const videoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/test/user-video-test-1768778730593.mov';

async function analyzeWithLLM() {
  console.log('=== DEBUG: Analyzing user video ===\n');
  console.log('Video URL:', videoUrl);
  
  // First, let's try a simple description without JSON schema
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { 
        role: 'system', 
        content: 'Describe what you see in the video. Be specific about the visual content.' 
      },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: 'What is happening in this video? Describe the visual content in detail.' },
          { type: 'file_url', file_url: { url: videoUrl, mime_type: 'video/mp4' } }
        ]
      }
    ],
    max_tokens: 2048
  };
  
  console.log('\nCalling LLM (simple description)...');
  
  const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  
  console.log('Response status:', response.status);
  
  const result = await response.json();
  console.log('\n=== FULL RESPONSE ===');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.choices && result.choices[0]) {
    console.log('\n=== CONTENT ===');
    console.log(result.choices[0].message.content);
  }
  
  if (result.error) {
    console.log('\n=== ERROR ===');
    console.log(result.error);
  }
}

analyzeWithLLM().catch(console.error);
