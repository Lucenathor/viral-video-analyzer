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
  error?: string;
}

/**
 * Compress a video file using FFmpeg
 * Optimized for social media (TikTok, Reels, etc.)
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
  
  return new Promise((resolve, reject) => {
    // FFmpeg command optimized for social media
    // - CRF 28 for good quality with smaller file size
    // - preset fast for reasonable speed
    // - scale to max 1080p while maintaining aspect ratio
    // - AAC audio at 128k
    const args = [
      '-i', inputPath,
      '-y', // Overwrite output file
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '28',
      '-vf', 'scale=\'min(1080,iw)\':\'min(1920,ih)\':force_original_aspect_ratio=decrease',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart', // Optimize for web streaming
      '-progress', 'pipe:1', // Output progress to stdout
      outputPath
    ];
    
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
    
    ffmpeg.on('close', (code) => {
      const endTime = Date.now();
      const processingDuration = (endTime - startTime) / 1000;
      
      if (code === 0) {
        // Get output file size
        const outputStats = fs.statSync(outputPath);
        const outputSize = outputStats.size;
        const compressionRatio = inputSize / outputSize;
        
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
          duration: processingDuration
        });
      } else {
        reject({
          success: false,
          inputPath,
          outputPath: '',
          inputSize,
          outputSize: 0,
          compressionRatio: 0,
          duration: processingDuration,
          error: `FFmpeg exited with code ${code}: ${stderr}`
        });
      }
    });
    
    ffmpeg.on('error', (error) => {
      reject({
        success: false,
        inputPath,
        outputPath: '',
        inputSize,
        outputSize: 0,
        compressionRatio: 0,
        duration: 0,
        error: error.message
      });
    });
  });
}

/**
 * Get video duration in seconds using FFprobe
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
    
    ffprobe.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    
    ffprobe.on('close', () => {
      const duration = parseFloat(output.trim());
      resolve(isNaN(duration) ? 0 : duration * 1000); // Return in milliseconds
    });
    
    ffprobe.on('error', () => {
      resolve(0);
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
