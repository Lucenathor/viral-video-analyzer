// Check status of existing video in Azure Video Indexer
import { config } from 'dotenv';
config();

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;
const AZURE_RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP;
const AZURE_VIDEO_INDEXER_ACCOUNT_NAME = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_NAME;
const AZURE_VIDEO_INDEXER_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_VIDEO_INDEXER_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION;

// The video ID from the error message
const VIDEO_ID = 'lwar7eexp2';

async function getAzureADToken() {
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', AZURE_CLIENT_ID);
  params.append('client_secret', AZURE_CLIENT_SECRET);
  params.append('scope', 'https://management.azure.com/.default');
  params.append('grant_type', 'client_credentials');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  
  const result = await response.json();
  return result.access_token;
}

async function getVideoIndexerToken(azureToken) {
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_NAME}/generateAccessToken?api-version=2025-04-01`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${azureToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissionType: 'Contributor', scope: 'Account' }),
  });
  
  const result = await response.json();
  return result.accessToken;
}

async function checkVideoStatus(viToken, videoId) {
  const statusUrl = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${viToken}`;
  
  const response = await fetch(statusUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

async function waitForProcessing(viToken, videoId) {
  console.log(`\nWaiting for video ${videoId} to finish processing...`);
  
  const startTime = Date.now();
  const maxWaitMs = 30 * 60 * 1000; // 30 minutes
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkVideoStatus(viToken, videoId);
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`Status: ${status.state} (${elapsed}s elapsed)`);
    
    if (status.state === 'Processed') {
      console.log('\n✅ Video processing completed!');
      return status;
    }
    
    if (status.state === 'Failed') {
      throw new Error(`Video processing failed: ${JSON.stringify(status)}`);
    }
    
    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  throw new Error('Timeout waiting for video processing');
}

async function run() {
  try {
    console.log('=== Checking Existing Video Status ===\n');
    console.log('Video ID:', VIDEO_ID);
    
    console.log('\nGetting Azure AD token...');
    const azureToken = await getAzureADToken();
    console.log('✅ Azure AD token obtained');
    
    console.log('\nGetting Video Indexer token...');
    const viToken = await getVideoIndexerToken(azureToken);
    console.log('✅ Video Indexer token obtained');
    
    // Check current status
    console.log('\nChecking current status...');
    const currentStatus = await checkVideoStatus(viToken, VIDEO_ID);
    console.log('Current state:', currentStatus.state);
    
    if (currentStatus.state === 'Processed') {
      console.log('\n=== VIDEO ANALYSIS RESULT ===');
      console.log(JSON.stringify(currentStatus, null, 2));
    } else {
      // Wait for processing
      const result = await waitForProcessing(viToken, VIDEO_ID);
      console.log('\n=== VIDEO ANALYSIS RESULT ===');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

run();
