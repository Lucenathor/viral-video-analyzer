import { searchTikTokVideos, downloadTikTokVideo } from './server/services/tiktokService.js';

async function test() {
  console.log('=== Testing TikTok Service ===\n');
  
  // Test search
  console.log('1. Searching for viral videos...');
  const searchResult = await searchTikTokVideos('viral');
  console.log(`Found ${searchResult.videos.length} videos`);
  
  if (searchResult.videos.length > 0) {
    const firstVideo = searchResult.videos[0];
    console.log('\nFirst video:');
    console.log(`- ID: ${firstVideo.id}`);
    console.log(`- Description: ${firstVideo.description.substring(0, 50)}...`);
    console.log(`- Duration: ${firstVideo.duration}s`);
    console.log(`- Likes: ${firstVideo.stats.likeCount}`);
    console.log(`- Download URL: ${firstVideo.downloadUrl ? 'Available' : 'Not available'}`);
    
    // Test download (only if URL is available)
    if (firstVideo.downloadUrl) {
      console.log('\n2. Testing video download...');
      try {
        const downloadPath = await downloadTikTokVideo(firstVideo.downloadUrl);
        console.log(`Video downloaded to: ${downloadPath}`);
      } catch (err) {
        console.log(`Download failed: ${err.message}`);
      }
    }
  }
  
  console.log('\n=== Test Complete ===');
}

test().catch(console.error);
