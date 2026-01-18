// Test different video URL formats with LLM
import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const publicVideoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

async function testFormat(name, messageContent) {
  console.log(`\n--- Testing: ${name} ---`);
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { 
        role: 'system', 
        content: 'Describe what you see in the video. Be specific about the visual content.' 
      },
      { 
        role: 'user', 
        content: messageContent
      }
    ],
    max_tokens: 1024
  };
  
  try {
    const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed: ${response.status} - ${errorText.substring(0, 200)}`);
      return;
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    const textContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Check if it mentions specific video content (Chromecast, HBO, Game of Thrones, dragon)
    const mentionsSpecificContent = 
      textContent.toLowerCase().includes('chromecast') ||
      textContent.toLowerCase().includes('hbo') ||
      textContent.toLowerCase().includes('game of thrones') ||
      textContent.toLowerCase().includes('dragon') ||
      textContent.toLowerCase().includes('daenerys') ||
      textContent.toLowerCase().includes('fire') ||
      textContent.toLowerCase().includes('tablet');
    
    console.log(`Response (first 300 chars): ${textContent.substring(0, 300)}...`);
    console.log(`✅ Mentions specific video content: ${mentionsSpecificContent}`);
    
    return mentionsSpecificContent;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== Testing Video URL Formats ===');
  console.log('Video URL:', publicVideoUrl);
  
  // Format 1: file_url with mime_type
  const format1 = await testFormat('file_url with mime_type', [
    { type: 'text', text: 'What is happening in this video? Describe the visual content.' },
    { type: 'file_url', file_url: { url: publicVideoUrl, mime_type: 'video/mp4' } }
  ]);
  
  // Format 2: image_url (some models accept video this way)
  const format2 = await testFormat('image_url format', [
    { type: 'text', text: 'What is happening in this video? Describe the visual content.' },
    { type: 'image_url', image_url: { url: publicVideoUrl } }
  ]);
  
  // Format 3: Just text with URL
  const format3 = await testFormat('URL in text only', 
    `Watch this video and describe what happens: ${publicVideoUrl}`
  );
  
  console.log('\n=== RESULTS ===');
  console.log('Format 1 (file_url):', format1 ? '✅ WORKS' : '❌ FAILED');
  console.log('Format 2 (image_url):', format2 ? '✅ WORKS' : '❌ FAILED');
  console.log('Format 3 (text URL):', format3 ? '✅ WORKS' : '❌ FAILED');
}

runTests();
