import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ExtractedFrame {
  timestamp: number; // seconds
  base64: string;
  path: string;
}

export interface VideoMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  hasAudio: boolean;
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,r_frame_rate,duration',
      '-show_entries', 'format=duration',
      '-of', 'json',
      videoPath
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
        
        // Parse frame rate (e.g., "30/1" -> 30)
        let fps = 30;
        if (stream.r_frame_rate) {
          const [num, den] = stream.r_frame_rate.split('/').map(Number);
          fps = den ? num / den : num;
        }
        
        resolve({
          duration: parseFloat(format.duration || stream.duration) || 0,
          width: stream.width || 0,
          height: stream.height || 0,
          fps: fps,
          codec: stream.codec_name || 'unknown',
          hasAudio: true // Will check separately if needed
        });
      } catch {
        resolve({
          duration: 0,
          width: 0,
          height: 0,
          fps: 30,
          codec: 'unknown',
          hasAudio: false
        });
      }
    });
    
    ffprobe.on('error', () => {
      resolve({
        duration: 0,
        width: 0,
        height: 0,
        fps: 30,
        codec: 'unknown',
        hasAudio: false
      });
    });
  });
}

/**
 * Extract frames from video at regular intervals
 * @param videoPath - Path to the video file
 * @param frameInterval - Interval between frames in seconds (default: 1)
 * @param maxFrames - Maximum number of frames to extract (default: 30)
 */
export async function extractFrames(
  videoPath: string,
  frameInterval: number = 1,
  maxFrames: number = 30
): Promise<ExtractedFrame[]> {
  const metadata = await getVideoMetadata(videoPath);
  const duration = metadata.duration;
  
  if (duration <= 0) {
    console.error('[FrameExtractor] Could not determine video duration');
    return [];
  }
  
  console.log(`[FrameExtractor] Video duration: ${duration}s, extracting frames every ${frameInterval}s`);
  
  // Calculate timestamps to extract
  const timestamps: number[] = [];
  for (let t = 0; t < duration && timestamps.length < maxFrames; t += frameInterval) {
    timestamps.push(t);
  }
  
  // Also add the last frame
  if (timestamps.length < maxFrames && duration > 0) {
    timestamps.push(Math.max(0, duration - 0.5));
  }
  
  console.log(`[FrameExtractor] Will extract ${timestamps.length} frames`);
  
  // Create temp directory for frames
  const tempDir = path.join(os.tmpdir(), `frames_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  const frames: ExtractedFrame[] = [];
  
  // Extract each frame
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const outputPath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.jpg`);
    
    try {
      await extractSingleFrame(videoPath, timestamp, outputPath);
      
      if (fs.existsSync(outputPath)) {
        const buffer = fs.readFileSync(outputPath);
        frames.push({
          timestamp,
          base64: buffer.toString('base64'),
          path: outputPath
        });
      }
    } catch (error) {
      console.warn(`[FrameExtractor] Failed to extract frame at ${timestamp}s:`, error);
    }
  }
  
  console.log(`[FrameExtractor] Successfully extracted ${frames.length} frames`);
  return frames;
}

/**
 * Extract a single frame at a specific timestamp
 */
async function extractSingleFrame(
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-ss', timestamp.toFixed(2),
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2', // High quality JPEG
      '-y',
      outputPath
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed: ${stderr.slice(-200)}`));
      }
    });
    
    ffmpeg.on('error', reject);
  });
}

/**
 * Extract audio from video and transcribe using Whisper
 */
export async function extractAndTranscribeAudio(
  videoPath: string,
  transcribeAudio: (audioUrl: string) => Promise<{ text: string; segments?: any[] }>
): Promise<{ transcript: string; segments: Array<{ start: number; end: number; text: string }> }> {
  const tempDir = path.join(os.tmpdir(), `audio_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  const audioPath = path.join(tempDir, 'audio.mp3');
  
  console.log('[FrameExtractor] Extracting audio from video...');
  
  // Extract audio using FFmpeg
  await new Promise<void>((resolve, reject) => {
    const args = [
      '-i', videoPath,
      '-vn', // No video
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-ar', '44100',
      '-y',
      audioPath
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Audio extraction might fail if video has no audio
        console.warn('[FrameExtractor] Audio extraction failed (video may have no audio)');
        resolve();
      }
    });
    
    ffmpeg.on('error', () => {
      console.warn('[FrameExtractor] FFmpeg error during audio extraction');
      resolve();
    });
  });
  
  // Check if audio was extracted
  if (!fs.existsSync(audioPath)) {
    console.log('[FrameExtractor] No audio track found in video');
    return { transcript: '', segments: [] };
  }
  
  const audioStats = fs.statSync(audioPath);
  if (audioStats.size < 1000) {
    console.log('[FrameExtractor] Audio file too small, likely no audio');
    return { transcript: '', segments: [] };
  }
  
  console.log(`[FrameExtractor] Audio extracted: ${(audioStats.size / 1024).toFixed(2)} KB`);
  
  // For now, return empty transcript - we'll use Gemini's vision to analyze
  // In a full implementation, we would upload to S3 and use Whisper API
  return { transcript: '', segments: [] };
}

/**
 * Clean up temporary frame files
 */
export function cleanupFrames(frames: ExtractedFrame[]): void {
  const dirs = new Set<string>();
  
  for (const frame of frames) {
    try {
      if (fs.existsSync(frame.path)) {
        fs.unlinkSync(frame.path);
        dirs.add(path.dirname(frame.path));
      }
    } catch (error) {
      console.warn('[FrameExtractor] Failed to cleanup frame:', error);
    }
  }
  
  // Try to remove temp directories
  dirs.forEach((dir) => {
    try {
      fs.rmdirSync(dir);
    } catch {
      // Directory might not be empty or already removed
    }
  });
}

/**
 * Extract key frames (scene changes) from video
 * This is more efficient than extracting at fixed intervals
 */
export async function extractKeyFrames(
  videoPath: string,
  maxFrames: number = 30
): Promise<ExtractedFrame[]> {
  const tempDir = path.join(os.tmpdir(), `keyframes_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  const outputPattern = path.join(tempDir, 'keyframe_%03d.jpg');
  
  console.log('[FrameExtractor] Extracting key frames (scene changes)...');
  
  return new Promise((resolve) => {
    // Use scene detection filter to extract key frames
    const args = [
      '-i', videoPath,
      '-vf', `select='gt(scene,0.3)',showinfo`, // Scene change threshold
      '-vsync', 'vfr',
      '-q:v', '2',
      '-frames:v', maxFrames.toString(),
      '-y',
      outputPattern
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    const timestamps: number[] = [];
    
    ffmpeg.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      stderr += output;
      
      // Parse timestamps from showinfo filter
      const regex = /pts_time:(\d+\.?\d*)/g;
      let match;
      while ((match = regex.exec(output)) !== null) {
        timestamps.push(parseFloat(match[1]));
      }
    });
    
    ffmpeg.on('close', async (code) => {
      if (code !== 0) {
        console.warn('[FrameExtractor] Key frame extraction failed, falling back to interval extraction');
        // Fall back to regular interval extraction
        const frames = await extractFrames(videoPath, 1, maxFrames);
        resolve(frames);
        return;
      }
      
      // Read extracted frames
      const frames: ExtractedFrame[] = [];
      const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.jpg')).sort();
      
      for (let i = 0; i < files.length; i++) {
        const filePath = path.join(tempDir, files[i]);
        const buffer = fs.readFileSync(filePath);
        frames.push({
          timestamp: timestamps[i] || i,
          base64: buffer.toString('base64'),
          path: filePath
        });
      }
      
      console.log(`[FrameExtractor] Extracted ${frames.length} key frames`);
      resolve(frames);
    });
    
    ffmpeg.on('error', async () => {
      console.warn('[FrameExtractor] FFmpeg error, falling back to interval extraction');
      const frames = await extractFrames(videoPath, 1, maxFrames);
      resolve(frames);
    });
  });
}
