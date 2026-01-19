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
  const indexResult = await getVideoIndex(viToken, VIDEO_ID);
  
  console.log('=== DATOS COMPLETOS DE AZURE VIDEO INDEXER ===\n');
  
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  console.log('DURACIÓN:', video?.durationInSeconds, 'segundos');
  console.log('IDIOMA:', video?.language);
  console.log('RESOLUCIÓN:', indexResult.width + 'x' + indexResult.height);
  
  console.log('\n=== TRANSCRIPCIÓN COMPLETA ===');
  if (insights.transcript) {
    insights.transcript.forEach((t, i) => {
      const start = t.instances?.[0]?.start || '';
      const end = t.instances?.[0]?.end || '';
      console.log(`[${start} - ${end}] ${t.text}`);
    });
  }
  
  console.log('\n=== TEMAS ===');
  console.log(insights.topics?.map(t => t.name).join(', '));
  
  console.log('\n=== KEYWORDS ===');
  console.log(insights.keywords?.map(k => k.text).join(', '));
  
  console.log('\n=== PERSONAS ===');
  console.log(insights.namedPeople?.map(p => p.name).join(', '));
  
  console.log('\n=== UBICACIONES ===');
  console.log(insights.namedLocations?.map(l => l.name).join(', '));
  
  console.log('\n=== OBJETOS ===');
  console.log(insights.detectedObjects?.map(o => o.displayName).join(', '));
  
  console.log('\n=== SHOTS/ESCENAS ===');
  console.log('Total shots:', insights.shots?.length);
  
  console.log('\n=== RAW TRANSCRIPT DATA ===');
  console.log(JSON.stringify(insights.transcript, null, 2));
}

run();
