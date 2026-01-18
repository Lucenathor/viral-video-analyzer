import fs from 'fs';
import path from 'path';

// Read the test video
const videoPath = '/home/ubuntu/test-video.mp4';
const videoBuffer = fs.readFileSync(videoPath);
const base64Video = videoBuffer.toString('base64');

console.log('Video size:', videoBuffer.length, 'bytes');
console.log('Base64 length:', base64Video.length);

// Make a direct API call to test the analysis
const testData = {
  videoData: `data:video/mp4;base64,${base64Video}`,
  fileName: 'test-video.mp4',
  mimeType: 'video/mp4',
  analysisType: 'viral_analysis'
};

console.log('Test data prepared. Video data prefix:', testData.videoData.substring(0, 50));
console.log('\nTo test the analysis, the user needs to upload a video through the UI.');
console.log('The analysis endpoint requires authentication via session cookie.');

// Test the LLM directly
console.log('\n--- Testing LLM directly ---');

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.log('FORGE_API_URL:', FORGE_API_URL ? 'Set' : 'Not set');
  console.log('FORGE_API_KEY:', FORGE_API_KEY ? 'Set' : 'Not set');
  console.log('Cannot test LLM without environment variables');
  process.exit(1);
}

const testPrompt = {
  messages: [
    { role: "system", content: "Eres un experto analista de contenido viral. Responde siempre en español y en formato JSON válido." },
    { role: "user", content: "Analiza un vídeo de prueba y devuelve un JSON con los campos: hookAnalysis (string), summary (string), overallScore (number 0-100). Responde SOLO con el JSON." }
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "test_analysis",
      strict: true,
      schema: {
        type: "object",
        properties: {
          hookAnalysis: { type: "string" },
          summary: { type: "string" },
          overallScore: { type: "number" }
        },
        required: ["hookAnalysis", "summary", "overallScore"],
        additionalProperties: false
      }
    }
  }
};

try {
  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`
    },
    body: JSON.stringify(testPrompt)
  });

  console.log('LLM Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('LLM Error:', errorText);
    process.exit(1);
  }

  const data = await response.json();
  console.log('LLM Response:', JSON.stringify(data, null, 2));
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    console.log('\nParsed content:', data.choices[0].message.content);
  }
} catch (error) {
  console.error('Error calling LLM:', error);
}
