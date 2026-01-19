// Direct Azure Video Indexer check without imports

const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;
const RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP;
const ACCOUNT_NAME = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_NAME;
const ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'eastus';
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;

async function getAzureToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://management.azure.com/.default',
      grant_type: 'client_credentials'
    })
  });
  const data = await response.json();
  return data.access_token;
}

async function getVideoIndexerToken(armToken) {
  const url = `https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${ACCOUNT_NAME}/generateAccessToken?api-version=2024-01-01`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${armToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      permissionType: 'Contributor',
      scope: 'Account'
    })
  });
  const data = await response.json();
  return data.accessToken;
}

async function main() {
  console.log('Getting Azure ARM token...');
  const armToken = await getAzureToken();
  
  console.log('Getting Video Indexer token...');
  const viToken = await getVideoIndexerToken(armToken);
  
  console.log('Listing videos...');
  const listResponse = await fetch(
    `https://api.videoindexer.ai/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos?accessToken=${viToken}`,
    { method: 'GET' }
  );
  
  const videos = await listResponse.json();
  console.log('Total videos:', videos.results?.length || 0);
  
  if (videos.results && videos.results.length > 0) {
    console.log('\n=== Recent Videos ===');
    for (const v of videos.results.slice(0, 3)) {
      console.log(`\nVideo: ${v.name}`);
      console.log(`  ID: ${v.id}`);
      console.log(`  State: ${v.state}`);
      console.log(`  Progress: ${v.processingProgress}`);
      console.log(`  Duration: ${v.durationInSeconds}s`);
      console.log(`  Created: ${v.created}`);
    }
    
    // Check the latest video in detail
    const latest = videos.results[0];
    if (latest.state === 'Processing') {
      console.log('\n⚠️ Latest video is still PROCESSING!');
      console.log('The app should wait for state="Processed" before fetching results.');
    } else if (latest.durationInSeconds === 0) {
      console.log('\n❌ Video has duration 0 - this indicates a processing error');
      console.log('Possible causes:');
      console.log('  - Video format not supported');
      console.log('  - Video file corrupted');
      console.log('  - Azure couldn\'t access the video URL');
    }
  }
}

main().catch(console.error);
