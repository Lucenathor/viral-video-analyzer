import { getAccessToken } from './server/services/azureVideoIndexer.ts';

const ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'trial';

async function checkVideoStatus() {
  const accessToken = await getAccessToken();
  
  // List all videos
  const listResponse = await fetch(
    `https://api.videoindexer.ai/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos?accessToken=${accessToken}`,
    { method: 'GET' }
  );
  
  const videos = await listResponse.json();
  console.log('Videos in account:', videos.results?.length || 0);
  
  if (videos.results && videos.results.length > 0) {
    // Get the most recent video
    const latestVideo = videos.results[0];
    console.log('\nLatest video:');
    console.log('- ID:', latestVideo.id);
    console.log('- Name:', latestVideo.name);
    console.log('- State:', latestVideo.state);
    console.log('- Processing Progress:', latestVideo.processingProgress);
    console.log('- Duration:', latestVideo.durationInSeconds, 'seconds');
    
    if (latestVideo.state !== 'Processed') {
      console.log('\n⚠️ Video is still processing! State:', latestVideo.state);
      console.log('Wait for state to be "Processed" before fetching results.');
    }
    
    // Get full index
    const indexResponse = await fetch(
      `https://api.videoindexer.ai/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos/${latestVideo.id}/Index?accessToken=${accessToken}`,
      { method: 'GET' }
    );
    
    const index = await indexResponse.json();
    console.log('\nFull index state:', index.state);
    console.log('Duration in index:', index.durationInSeconds);
    
    if (index.videos && index.videos[0]) {
      const videoInsights = index.videos[0].insights;
      console.log('\nInsights available:');
      console.log('- Transcript entries:', videoInsights?.transcript?.length || 0);
      console.log('- Topics:', videoInsights?.topics?.length || 0);
      console.log('- Faces:', videoInsights?.faces?.length || 0);
    }
  }
}

checkVideoStatus().catch(console.error);
