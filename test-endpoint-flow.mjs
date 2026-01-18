// Test the complete endpoint flow
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function testEndpointFlow() {
  console.log('=== Testing Complete Endpoint Flow ===\n');
  
  // We need to test with authentication
  // First, let's check what the tRPC endpoint expects
  
  // Read a small test file
  const testVideoPath = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';
  
  // Check file size
  const stats = fs.statSync(testVideoPath);
  console.log('Video file size:', stats.size, 'bytes');
  console.log('Video file size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  
  // The issue might be:
  // 1. File too large for base64 encoding
  // 2. Timeout during upload
  // 3. Memory issues
  
  // Let's check if the file can be read and converted to base64
  console.log('\nReading file...');
  const startRead = Date.now();
  const buffer = fs.readFileSync(testVideoPath);
  console.log('File read in', Date.now() - startRead, 'ms');
  
  console.log('\nConverting to base64...');
  const startBase64 = Date.now();
  const base64 = buffer.toString('base64');
  console.log('Base64 conversion in', Date.now() - startBase64, 'ms');
  console.log('Base64 length:', base64.length, 'characters');
  console.log('Base64 size:', (base64.length / 1024 / 1024).toFixed(2), 'MB');
  
  // The base64 string is about 70MB which might be too large for a single request
  console.log('\n⚠️  POTENTIAL ISSUE FOUND:');
  console.log('The base64 encoded video is', (base64.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('This might exceed request body limits or cause timeouts.');
  
  // Check if there's a body size limit issue
  console.log('\n=== Recommendations ===');
  console.log('1. Increase body-parser limit in Express');
  console.log('2. Use streaming upload instead of base64');
  console.log('3. Compress video before upload');
}

testEndpointFlow();
