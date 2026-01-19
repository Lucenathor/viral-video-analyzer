import { createCompressionJob, getJobStatus, waitForJobCompletion, compressVideo, isCoconutConfigured } from './server/services/coconutService.ts';

async function testCoconutIntegration() {
  console.log('=== Testing Coconut Integration ===\n');
  
  // Check if configured
  console.log('1. Checking if Coconut is configured...');
  const configured = isCoconutConfigured();
  console.log('   Configured:', configured);
  
  if (!configured) {
    console.log('   ERROR: Coconut API key not found');
    return;
  }
  
  // Test with a sample video
  const testVideoUrl = 'https://storage.googleapis.com/coconut-demo/spring.mp4';
  console.log('\n2. Creating compression job for:', testVideoUrl);
  
  try {
    const job = await createCompressionJob(testVideoUrl);
    console.log('   Job created:', job.id);
    console.log('   Status:', job.status);
    
    console.log('\n3. Waiting for job completion...');
    const completed = await waitForJobCompletion(job.id, 120000, 5000);
    console.log('   Job completed!');
    console.log('   Output URLs:', JSON.stringify(completed.output_urls, null, 2));
    
    console.log('\n=== Coconut Integration Test PASSED ===');
  } catch (error) {
    console.error('\n   ERROR:', error.message);
    console.log('\n=== Coconut Integration Test FAILED ===');
  }
}

testCoconutIntegration();
