import { resolveVideoUrl, downloadResolvedVideo } from './server/services/videoUrlResolver.ts';
import fs from 'fs';

// Test with different URLs
const testUrls = [
  'https://www.instagram.com/reel/DFkMjxAoLHH/',
  'https://www.instagram.com/p/CyGEFpToo62/',
];

for (const testUrl of testUrls) {
  console.log('\n========================================');
  console.log('Testing URL:', testUrl);
  console.log('========================================');
  
  try {
    const resolved = await resolveVideoUrl(testUrl);
    console.log('Platform:', resolved.platform);
    console.log('Direct URL:', resolved.directUrl.substring(0, 120));
    
    // Download and check what we actually got
    const buffer = await downloadResolvedVideo(resolved);
    console.log('Downloaded size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
    
    // Check if it's actually a video or HTML
    const header = buffer.slice(0, 100).toString('utf-8');
    const isHTML = header.includes('<!DOCTYPE') || header.includes('<html') || header.includes('<!doctype');
    const isMP4 = buffer.slice(4, 8).toString('ascii') === 'ftyp';
    
    console.log('First bytes (hex):', buffer.slice(0, 16).toString('hex'));
    console.log('Is HTML?', isHTML);
    console.log('Is MP4?', isMP4);
    
    if (isHTML) {
      console.log('WARNING: Downloaded HTML instead of video!');
      console.log('First 200 chars:', header.substring(0, 200));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

// Also test what the RapidAPI returns directly
console.log('\n========================================');
console.log('Direct RapidAPI test');
console.log('========================================');

const apiKey = process.env.RAPIDAPI_KEY;
console.log('RAPIDAPI_KEY available:', !!apiKey);
if (apiKey) {
  console.log('Key prefix:', apiKey.substring(0, 8) + '...');
  
  // Test v2 endpoint
  const shortcode = 'DFkMjxAoLHH';
  const apiUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data_v2.php?media_code=${shortcode}`;
  try {
    const resp = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
      signal: AbortSignal.timeout(15000),
    });
    console.log('v2 Status:', resp.status);
    const json = await resp.json();
    console.log('v2 Response keys:', Object.keys(json));
    console.log('v2 Response:', JSON.stringify(json).substring(0, 500));
  } catch (e) {
    console.error('v2 Error:', e.message);
  }
}
