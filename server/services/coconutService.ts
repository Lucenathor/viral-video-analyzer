/**
 * Coconut Video Compression Service
 * Uses Coconut API to compress videos before sending to Azure Video Indexer
 */

const COCONUT_API_KEY = process.env.COCONUT_API_KEY || '';
const COCONUT_API_URL = 'https://api.coconut.co/v2';

interface CoconutJobInput {
  url: string;
}

interface CoconutJobOutput {
  path: string;
  if?: string;
}

interface CoconutJobRequest {
  input: CoconutJobInput;
  storage?: {
    service: string;
    url?: string;
  };
  outputs: {
    [key: string]: CoconutJobOutput;
  };
}

interface CoconutJobResponse {
  id: string;
  status: string;
  progress?: string;
  output_urls?: {
    [key: string]: string;
  };
  error?: string;
}

/**
 * Create a compression job in Coconut
 */
export async function createCompressionJob(
  inputUrl: string
): Promise<CoconutJobResponse> {
  const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');
  
  const jobRequest = {
    input: {
      url: inputUrl
    },
    storage: {
      service: 'coconut'  // Use Coconut's temporary storage
    },
    outputs: {
      // Compress to MP4 H.264 at 720p for optimal balance of quality and size
      'mp4:720p': {
        path: '/compressed.mp4'
      }
    },
    // Notification is required by Coconut API
    notification: {
      type: 'http',
      url: 'https://app.coconut.co/notifications/http/fbadaade'
    }
  };

  const response = await fetch(`${COCONUT_API_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobRequest)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Coconut API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get the status of a Coconut job
 */
export async function getJobStatus(jobId: string): Promise<CoconutJobResponse> {
  const authHeader = Buffer.from(COCONUT_API_KEY + ':').toString('base64');
  
  const response = await fetch(`${COCONUT_API_URL}/jobs/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authHeader}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Coconut API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Wait for a Coconut job to complete
 * Polls the job status until it's completed or failed
 */
export async function waitForJobCompletion(
  jobId: string,
  maxWaitMs: number = 300000, // 5 minutes max
  pollIntervalMs: number = 3000 // Check every 3 seconds
): Promise<CoconutJobResponse> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getJobStatus(jobId);
    
    console.log(`[Coconut] Job ${jobId} status: ${status.status}, progress: ${status.progress || 'N/A'}`);
    
    if (status.status === 'completed') {
      return status;
    }
    
    if (status.status === 'failed' || status.status === 'error') {
      throw new Error(`Coconut job failed: ${status.error || 'Unknown error'}`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error('Coconut job timed out');
}

/**
 * Compress a video using Coconut and return the compressed video URL
 */
export async function compressVideo(inputUrl: string): Promise<string> {
  console.log(`[Coconut] Starting compression for: ${inputUrl}`);
  
  // Create the compression job
  const job = await createCompressionJob(inputUrl);
  console.log(`[Coconut] Job created with ID: ${job.id}`);
  
  // Wait for completion
  const completedJob = await waitForJobCompletion(job.id);
  
  // Get the compressed video URL
  const outputUrls = completedJob.output_urls;
  if (!outputUrls || !outputUrls['mp4:720p']) {
    throw new Error('Coconut job completed but no output URL found');
  }
  
  const compressedUrl = outputUrls['mp4:720p'];
  console.log(`[Coconut] Compression complete. Output URL: ${compressedUrl}`);
  
  return compressedUrl;
}

/**
 * Check if Coconut API is available and configured
 */
export function isCoconutConfigured(): boolean {
  return !!COCONUT_API_KEY && COCONUT_API_KEY.startsWith('k-');
}
