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
  return (await response.json()).access_token;
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
  return (await response.json()).accessToken;
}

async function getVideoIndex(viToken, videoId) {
  const url = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${viToken}`;
  const response = await fetch(url);
  return await response.json();
}

async function run() {
  const azureToken = await getAzureADToken();
  const viToken = await getVideoIndexerToken(azureToken);
  
  // Get the new video details
  const videoId = '20ks3fjk6k';
  const index = await getVideoIndex(viToken, videoId);
  
  const video = index.videos?.[0];
  const insights = video?.insights || {};
  
  console.log('=== DETALLES DEL VIDEO NUEVO ===');
  console.log(`Duración: ${index.durationInSeconds || video?.durationInSeconds}s`);
  console.log(`Idioma: ${video?.language}`);
  console.log(`Resolución: ${video?.width}x${video?.height}`);
  
  console.log('\n=== TRANSCRIPCIÓN ===');
  const transcript = insights.transcript || [];
  for (const t of transcript) {
    console.log(`[${t.instances?.[0]?.start} - ${t.instances?.[0]?.end}] ${t.text}`);
  }
  
  console.log('\n=== TEMAS ===');
  console.log(insights.topics?.map(t => t.name).join(', ') || 'Ninguno');
  
  console.log('\n=== KEYWORDS ===');
  console.log(insights.keywords?.map(k => k.text).join(', ') || 'Ninguna');
  
  console.log('\n=== PERSONAS ===');
  console.log(insights.namedPeople?.map(p => p.name).join(', ') || 'Ninguna');
  
  console.log('\n=== SHOTS ===');
  console.log(`Total: ${insights.shots?.length || 0}`);
}

run();
