// Test Azure Video Indexer integration
import { config } from 'dotenv';
import fs from 'fs';
config();

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;
const AZURE_RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP;
const AZURE_VIDEO_INDEXER_ACCOUNT_NAME = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_NAME;
const AZURE_VIDEO_INDEXER_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_VIDEO_INDEXER_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION;

console.log('=== Azure Video Indexer Test ===\n');
console.log('Tenant ID:', AZURE_TENANT_ID);
console.log('Client ID:', AZURE_CLIENT_ID);
console.log('Subscription ID:', AZURE_SUBSCRIPTION_ID);
console.log('Resource Group:', AZURE_RESOURCE_GROUP);
console.log('Account Name:', AZURE_VIDEO_INDEXER_ACCOUNT_NAME);
console.log('Account ID:', AZURE_VIDEO_INDEXER_ACCOUNT_ID);
console.log('Location:', AZURE_VIDEO_INDEXER_LOCATION);

// Step 1: Get Azure AD token
async function getAzureADToken() {
  console.log('\n--- Step 1: Getting Azure AD Token ---');
  
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', AZURE_CLIENT_ID);
  params.append('client_secret', AZURE_CLIENT_SECRET);
  params.append('scope', 'https://management.azure.com/.default');
  params.append('grant_type', 'client_credentials');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  
  console.log('Token response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Azure AD token: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('✅ Azure AD token obtained');
  return result.access_token;
}

// Step 2: Get Video Indexer access token
async function getVideoIndexerToken(azureToken) {
  console.log('\n--- Step 2: Getting Video Indexer Access Token ---');
  
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_NAME}/generateAccessToken?api-version=2025-04-01`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${azureToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      permissionType: 'Contributor',
      scope: 'Account',
    }),
  });
  
  console.log('Video Indexer token response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Video Indexer token: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('✅ Video Indexer access token obtained');
  return result.accessToken;
}

// Step 3: Upload video to Video Indexer
async function uploadVideo(viToken, videoUrl, videoName) {
  console.log('\n--- Step 3: Uploading Video to Video Indexer ---');
  console.log('Video URL:', videoUrl);
  console.log('Video Name:', videoName);
  
  const uploadUrl = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos?accessToken=${viToken}&name=${encodeURIComponent(videoName)}&videoUrl=${encodeURIComponent(videoUrl)}&language=Spanish&indexingPreset=Default&streamingPreset=NoStreaming`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  console.log('Upload response status:', response.status);
  
  const result = await response.json();
  console.log('Upload result:', JSON.stringify(result, null, 2));
  
  if (!response.ok) {
    throw new Error(`Failed to upload video: ${response.status} - ${JSON.stringify(result)}`);
  }
  
  console.log('✅ Video uploaded, ID:', result.id);
  return result.id;
}

// Step 4: Check video indexing status
async function checkVideoStatus(viToken, videoId) {
  console.log('\n--- Step 4: Checking Video Status ---');
  
  const statusUrl = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${viToken}`;
  
  const response = await fetch(statusUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result;
}

// Step 5: Wait for indexing to complete
async function waitForIndexing(viToken, videoId, maxWaitMinutes = 30) {
  console.log('\n--- Step 5: Waiting for Indexing to Complete ---');
  console.log(`Max wait time: ${maxWaitMinutes} minutes`);
  
  const startTime = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkVideoStatus(viToken, videoId);
    
    console.log(`Status: ${status.state} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    
    if (status.state === 'Processed') {
      console.log('✅ Video indexing completed!');
      return status;
    }
    
    if (status.state === 'Failed') {
      throw new Error(`Video indexing failed: ${JSON.stringify(status)}`);
    }
    
    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  throw new Error('Timeout waiting for video indexing');
}

async function runTest() {
  try {
    // Get Azure AD token
    const azureToken = await getAzureADToken();
    
    // Get Video Indexer token
    const viToken = await getVideoIndexerToken(azureToken);
    
    // Use the video URL from S3 that we already uploaded
    const videoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/test/user-video-test-1768778730593.mov';
    const videoName = `test-video-${Date.now()}`;
    
    // Upload video
    const videoId = await uploadVideo(viToken, videoUrl, videoName);
    
    // Wait for indexing
    const indexResult = await waitForIndexing(viToken, videoId);
    
    console.log('\n=== INDEXING RESULT ===');
    console.log(JSON.stringify(indexResult, null, 2));
    
    console.log('\n✅ AZURE VIDEO INDEXER TEST PASSED!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

runTest();
