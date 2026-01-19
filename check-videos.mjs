import dotenv from 'dotenv';
dotenv.config();

const AZURE_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION;
const AZURE_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_API_KEY = process.env.AZURE_VIDEO_INDEXER_API_KEY;

async function getAccessToken() {
  const url = `https://api.videoindexer.ai/Auth/${AZURE_LOCATION}/Accounts/${AZURE_ACCOUNT_ID}/AccessToken?allowEdit=true`;
  const response = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': AZURE_API_KEY }
  });
  return response.text().then(t => t.replace(/"/g, ''));
}

async function listVideos(accessToken) {
  const url = `https://api.videoindexer.ai/${AZURE_LOCATION}/Accounts/${AZURE_ACCOUNT_ID}/Videos?accessToken=${accessToken}`;
  const response = await fetch(url);
  return response.json();
}

async function main() {
  const accessToken = await getAccessToken();
  const videos = await listVideos(accessToken);
  
  console.log('=== VIDEOS IN AZURE ===');
  for (const video of videos.results || []) {
    console.log(`ID: ${video.id}`);
    console.log(`Name: ${video.name}`);
    console.log(`State: ${video.state}`);
    console.log(`Duration: ${video.durationInSeconds}s`);
    console.log('---');
  }
}

main().catch(console.error);
