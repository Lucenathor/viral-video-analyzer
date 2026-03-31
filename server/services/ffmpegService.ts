import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CompressionProgress {
  percent: number;
  currentTime?: string;
  speed?: string;
}

export interface CompressionResult {
  success: boolean;
  inputPath: string;
  outputPath: string;
  inputSize: number;
  outputSize: number;
  compressionRatio: number;
  duration: number;
  videoDuration: number; // Duration of the video in seconds
  error?: string;
}

/**
 * Compress and convert a video file to MP4 using FFmpeg
 * Optimized for Azure Video Indexer compatibility
 * 
 * Supports: MOV, MP4, WebM, AVI, MKV, M4V, 3GP, WMV, FLV
 * 
 * @param inputPath - Path to the input video file
 * @param onProgress - Callback for progress updates
 * @returns Promise with compression result
 */
export async function compressVideo(
  inputPath: string,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const startTime = Date.now();
  
  // Create output path in temp directory
  const tempDir = os.tmpdir();
  const outputFileName = `compressed_${Date.now()}.mp4`;
  const outputPath = path.join(tempDir, outputFileName);
  
  // Get input file size
  const inputStats = fs.statSync(inputPath);
  const inputSize = inputStats.size;
  
  // Get video duration first for progress calculation
  const duration = await getVideoDuration(inputPath);
  console.log(`[FFmpeg] Input video duration: ${duration / 1000}s, size: ${(inputSize / 1024 / 1024).toFixed(2)} MB`);
  
  return new Promise((resolve, reject) => {
    // FFmpeg command optimized for Azure Video Indexer compatibility
    // Key changes for MOV/HEVC compatibility:
    // - Use pixel format yuv420p for maximum compatibility
    // - Use profile:v baseline for older decoder support
    // - Force re-encoding of all streams
    // - Handle HEVC (H.265) from iPhone videos
    const args = [
      '-i', inputPath,
      '-y', // Overwrite output file
      // Video codec settings - force H.264 with maximum compatibility
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28', // Good enough quality for AI analysis
      '-profile:v', 'high', // High profile for better quality
      '-level', '4.1', // Compatible with most devices
      '-pix_fmt', 'yuv420p', // Required for compatibility
      // Scale to max 720p while maintaining aspect ratio (faster + smaller for AI analysis)
      '-vf', "scale='min(720,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
      // Audio codec settings - force AAC
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100', // Standard sample rate
      '-ac', '2', // Stereo audio
      // Container settings
      '-movflags', '+faststart', // Optimize for web streaming
      '-f', 'mp4', // Force MP4 container
      // Progress output
      '-progress', 'pipe:1',
      outputPath
    ];
    
    console.log(`[FFmpeg] Starting conversion with args: ffmpeg ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', args);
    
    let stderr = '';
    
    ffmpeg.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      
      // Parse progress from FFmpeg output
      const timeMatch = output.match(/out_time_ms=(\d+)/);
      const speedMatch = output.match(/speed=(\S+)/);
      
      if (timeMatch && duration > 0) {
        const currentTimeMs = parseInt(timeMatch[1]) / 1000;
        const percent = Math.min(99, Math.round((currentTimeMs / duration) * 100));
        
        if (onProgress) {
          onProgress({
            percent,
            currentTime: formatTime(currentTimeMs / 1000),
            speed: speedMatch ? speedMatch[1] : undefined
          });
        }
      }
    });
    
    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', async (code) => {
      const endTime = Date.now();
      const processingDuration = (endTime - startTime) / 1000;
      
      if (code === 0) {
        // Verify output file exists and has content
        if (!fs.existsSync(outputPath)) {
          reject({
            success: false,
            inputPath,
            outputPath: '',
            inputSize,
            outputSize: 0,
            compressionRatio: 0,
            duration: processingDuration,
            videoDuration: 0,
            error: 'Output file was not created'
          });
          return;
        }
        
        // Get output file size
        const outputStats = fs.statSync(outputPath);
        const outputSize = outputStats.size;
        
        if (outputSize < 1000) {
          reject({
            success: false,
            inputPath,
            outputPath: '',
            inputSize,
            outputSize: 0,
            compressionRatio: 0,
            duration: processingDuration,
            videoDuration: 0,
            error: 'Output file is too small, conversion may have failed'
          });
          return;
        }
        
        const compressionRatio = inputSize / outputSize;
        
        // Get output video duration to verify conversion
        const outputDuration = await getVideoDuration(outputPath);
        console.log(`[FFmpeg] Output video duration: ${outputDuration / 1000}s, size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (onProgress) {
          onProgress({ percent: 100 });
        }
        
        resolve({
          success: true,
          inputPath,
          outputPath,
          inputSize,
          outputSize,
          compressionRatio,
          duration: processingDuration,
          videoDuration: outputDuration / 1000 // Convert to seconds
        });
      } else {
        console.error(`[FFmpeg] Conversion failed with code ${code}`);
        console.error(`[FFmpeg] stderr: ${stderr.slice(-2000)}`); // Last 2000 chars of error
        
        reject({
          success: false,
          inputPath,
          outputPath: '',
          inputSize,
          outputSize: 0,
          compressionRatio: 0,
          duration: processingDuration,
          videoDuration: 0,
          error: `FFmpeg exited with code ${code}: ${stderr.slice(-500)}`
        });
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.error(`[FFmpeg] Process error: ${error.message}`);
      reject({
        success: false,
        inputPath,
        outputPath: '',
        inputSize,
        outputSize: 0,
        compressionRatio: 0,
        duration: 0,
        videoDuration: 0,
        error: error.message
      });
    });
  });
}

/**
 * Get video duration in milliseconds using FFprobe
 */
async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      inputPath
    ];
    
    const ffprobe = spawn('ffprobe', args);
    let output = '';
    let errorOutput = '';
    
    ffprobe.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    
    ffprobe.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });
    
    ffprobe.on('close', (code) => {
      if (code !== 0) {
        console.warn(`[FFprobe] Warning: exit code ${code}, error: ${errorOutput}`);
      }
      const duration = parseFloat(output.trim());
      resolve(isNaN(duration) ? 0 : duration * 1000); // Return in milliseconds
    });
    
    ffprobe.on('error', (error) => {
      console.error(`[FFprobe] Error: ${error.message}`);
      resolve(0);
    });
  });
}

/**
 * Get video codec information using FFprobe
 */
export async function getVideoInfo(inputPath: string): Promise<{
  duration: number;
  videoCodec: string;
  audioCodec: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height',
      '-show_entries', 'format=duration',
      '-of', 'json',
      inputPath
    ];
    
    const ffprobe = spawn('ffprobe', args);
    let output = '';
    
    ffprobe.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    
    ffprobe.on('close', () => {
      try {
        const info = JSON.parse(output);
        const stream = info.streams?.[0] || {};
        const format = info.format || {};
        
        resolve({
          duration: parseFloat(format.duration) || 0,
          videoCodec: stream.codec_name || 'unknown',
          audioCodec: 'unknown', // Would need separate query
          width: stream.width || 0,
          height: stream.height || 0
        });
      } catch {
        resolve({
          duration: 0,
          videoCodec: 'unknown',
          audioCodec: 'unknown',
          width: 0,
          height: 0
        });
      }
    });
    
    ffprobe.on('error', () => {
      resolve({
        duration: 0,
        videoCodec: 'unknown',
        audioCodec: 'unknown',
        width: 0,
        height: 0
      });
    });
  });
}

/**
 * Format time in seconds to HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clean up temporary compressed file
 */
export function cleanupCompressedFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up compressed file:', error);
  }
}
