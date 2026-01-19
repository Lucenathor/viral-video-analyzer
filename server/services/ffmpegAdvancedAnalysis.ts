import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audioCodec: string;
  audioChannels: number;
  audioSampleRate: number;
  audioBitrate: number;
  hasAudio: boolean;
  fileSize: number;
  format: string;
  rotation: number;
  aspectRatio: string;
}

export interface SceneChange {
  timestamp: number;
  score: number; // 0-1, higher = more significant change
}

export interface AudioAnalysis {
  meanVolume: number; // dB
  maxVolume: number; // dB
  silences: Array<{ start: number; end: number; duration: number }>;
  loudPeaks: Array<{ timestamp: number; volume: number }>;
  hasMusic: boolean;
  hasSpeech: boolean;
  dynamicRange: number;
}

export interface ExtractedFrame {
  timestamp: number;
  path: string;
  base64: string;
  type: 'regular' | 'scene_change' | 'thumbnail';
}

export interface FullVideoAnalysis {
  metadata: VideoMetadata;
  frames: ExtractedFrame[];
  sceneChanges: SceneChange[];
  audioAnalysis: AudioAnalysis;
  audioPath: string | null;
  shotDurations: Array<{ start: number; end: number; duration: number }>;
}

/**
 * Get comprehensive video metadata using ffprobe
 */
export async function getFullMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,r_frame_rate,duration,bit_rate,display_aspect_ratio,rotation',
      '-show_entries', 'format=duration,size,format_name,bit_rate',
      '-of', 'json',
      videoPath
    ];
    
    const ffprobe = spawn('ffprobe', args);
    let output = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.on('close', async () => {
      try {
        const info = JSON.parse(output);
        const stream = info.streams?.[0] || {};
        const format = info.format || {};
        
        let fps = 30;
        if (stream.r_frame_rate) {
          const [num, den] = stream.r_frame_rate.split('/').map(Number);
          fps = den ? num / den : num;
        }
        
        // Get audio info separately
        const audioInfo = await getAudioStreamInfo(videoPath);
        
        resolve({
          duration: parseFloat(format.duration || stream.duration) || 0,
          width: stream.width || 0,
          height: stream.height || 0,
          fps: Math.round(fps * 100) / 100,
          codec: stream.codec_name || 'unknown',
          bitrate: parseInt(format.bit_rate) || 0,
          audioCodec: audioInfo.codec,
          audioChannels: audioInfo.channels,
          audioSampleRate: audioInfo.sampleRate,
          audioBitrate: audioInfo.bitrate,
          hasAudio: audioInfo.hasAudio,
          fileSize: parseInt(format.size) || 0,
          format: format.format_name || 'unknown',
          rotation: parseInt(stream.rotation) || 0,
          aspectRatio: stream.display_aspect_ratio || `${stream.width}:${stream.height}`
        });
      } catch {
        resolve({
          duration: 0, width: 0, height: 0, fps: 30, codec: 'unknown',
          bitrate: 0, audioCodec: 'unknown', audioChannels: 0,
          audioSampleRate: 0, audioBitrate: 0, hasAudio: false,
          fileSize: 0, format: 'unknown', rotation: 0, aspectRatio: '16:9'
        });
      }
    });
  });
}

/**
 * Get audio stream information
 */
async function getAudioStreamInfo(videoPath: string): Promise<{
  hasAudio: boolean;
  codec: string;
  channels: number;
  sampleRate: number;
  bitrate: number;
}> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_name,channels,sample_rate,bit_rate',
      '-of', 'json',
      videoPath
    ];
    
    const ffprobe = spawn('ffprobe', args);
    let output = '';
    
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.on('close', () => {
      try {
        const info = JSON.parse(output);
        const stream = info.streams?.[0];
        
        if (stream) {
          resolve({
            hasAudio: true,
            codec: stream.codec_name || 'unknown',
            channels: stream.channels || 2,
            sampleRate: parseInt(stream.sample_rate) || 44100,
            bitrate: parseInt(stream.bit_rate) || 0
          });
        } else {
          resolve({
            hasAudio: false,
            codec: 'none',
            channels: 0,
            sampleRate: 0,
            bitrate: 0
          });
        }
      } catch {
        resolve({
          hasAudio: false,
          codec: 'none',
          channels: 0,
          sampleRate: 0,
          bitrate: 0
        });
      }
    });
  });
}

/**
 * Detect scene changes using ffmpeg's scene detection filter
 */
export async function detectSceneChanges(videoPath: string, threshold: number = 0.3): Promise<SceneChange[]> {
  return new Promise((resolve) => {
    const args = [
      '-i', videoPath,
      '-vf', `select='gt(scene,${threshold})',showinfo`,
      '-f', 'null',
      '-'
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', () => {
      const sceneChanges: SceneChange[] = [];
      const lines = stderr.split('\n');
      
      for (const line of lines) {
        // Parse showinfo output: pts_time:X.XXX
        const ptsMatch = line.match(/pts_time:(\d+\.?\d*)/);
        if (ptsMatch) {
          const timestamp = parseFloat(ptsMatch[1]);
          // Extract scene score if available
          const scoreMatch = line.match(/scene:(\d+\.?\d*)/);
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : threshold;
          
          sceneChanges.push({ timestamp, score });
        }
      }
      
      resolve(sceneChanges);
    });
  });
}

/**
 * Analyze audio levels, detect silences and loud peaks
 */
export async function analyzeAudio(videoPath: string): Promise<AudioAnalysis> {
  return new Promise((resolve) => {
    // First, get volume statistics
    const args = [
      '-i', videoPath,
      '-af', 'volumedetect',
      '-f', 'null',
      '-'
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', async () => {
      let meanVolume = -30;
      let maxVolume = -10;
      
      // Parse volume statistics
      const meanMatch = stderr.match(/mean_volume:\s*(-?\d+\.?\d*)\s*dB/);
      const maxMatch = stderr.match(/max_volume:\s*(-?\d+\.?\d*)\s*dB/);
      
      if (meanMatch) meanVolume = parseFloat(meanMatch[1]);
      if (maxMatch) maxVolume = parseFloat(maxMatch[1]);
      
      // Detect silences
      const silences = await detectSilences(videoPath);
      
      // Detect loud peaks
      const loudPeaks = await detectLoudPeaks(videoPath);
      
      // Estimate if there's music or speech based on audio characteristics
      const dynamicRange = maxVolume - meanVolume;
      const hasMusic = dynamicRange > 15; // Music typically has higher dynamic range
      const hasSpeech = silences.length > 2 && dynamicRange < 25; // Speech has pauses
      
      resolve({
        meanVolume,
        maxVolume,
        silences,
        loudPeaks,
        hasMusic,
        hasSpeech,
        dynamicRange
      });
    });
  });
}

/**
 * Detect silence periods in audio
 */
async function detectSilences(videoPath: string): Promise<Array<{ start: number; end: number; duration: number }>> {
  return new Promise((resolve) => {
    const args = [
      '-i', videoPath,
      '-af', 'silencedetect=noise=-30dB:d=0.5',
      '-f', 'null',
      '-'
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', () => {
      const silences: Array<{ start: number; end: number; duration: number }> = [];
      const lines = stderr.split('\n');
      
      let currentStart: number | null = null;
      
      for (const line of lines) {
        const startMatch = line.match(/silence_start:\s*(\d+\.?\d*)/);
        const endMatch = line.match(/silence_end:\s*(\d+\.?\d*)/);
        const durationMatch = line.match(/silence_duration:\s*(\d+\.?\d*)/);
        
        if (startMatch) {
          currentStart = parseFloat(startMatch[1]);
        }
        
        if (endMatch && currentStart !== null) {
          const end = parseFloat(endMatch[1]);
          const duration = durationMatch ? parseFloat(durationMatch[1]) : end - currentStart;
          silences.push({ start: currentStart, end, duration });
          currentStart = null;
        }
      }
      
      resolve(silences);
    });
  });
}

/**
 * Detect loud peaks in audio (moments with high volume)
 */
async function detectLoudPeaks(videoPath: string): Promise<Array<{ timestamp: number; volume: number }>> {
  return new Promise((resolve) => {
    // Use astats filter to get per-frame audio levels
    const args = [
      '-i', videoPath,
      '-af', 'astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level',
      '-f', 'null',
      '-'
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', () => {
      const peaks: Array<{ timestamp: number; volume: number }> = [];
      const lines = stderr.split('\n');
      
      let currentTime = 0;
      const timeIncrement = 0.1; // Approximate time between samples
      
      for (const line of lines) {
        const peakMatch = line.match(/Peak_level=(-?\d+\.?\d*)/);
        if (peakMatch) {
          const volume = parseFloat(peakMatch[1]);
          // Only record significant peaks (above -10 dB)
          if (volume > -10) {
            peaks.push({ timestamp: currentTime, volume });
          }
          currentTime += timeIncrement;
        }
      }
      
      // Limit to top 20 peaks
      peaks.sort((a, b) => b.volume - a.volume);
      resolve(peaks.slice(0, 20));
    });
  });
}

/**
 * Extract audio track from video
 */
export async function extractAudio(videoPath: string): Promise<string | null> {
  const outputPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);
  
  return new Promise((resolve) => {
    const args = [
      '-i', videoPath,
      '-vn', // No video
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-ar', '44100',
      '-y',
      outputPath
    ];
    
    const ffmpeg = spawn('ffmpeg', args);
    
    ffmpeg.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Extract frames at regular intervals AND at scene changes
 */
export async function extractSmartFrames(
  videoPath: string,
  duration: number,
  sceneChanges: SceneChange[],
  maxFrames: number = 40
): Promise<ExtractedFrame[]> {
  const tempDir = path.join(os.tmpdir(), `frames_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  const frames: ExtractedFrame[] = [];
  const timestamps: Array<{ time: number; type: 'regular' | 'scene_change' | 'thumbnail' }> = [];
  
  // Add thumbnail at start, middle, and end
  timestamps.push({ time: 0, type: 'thumbnail' });
  timestamps.push({ time: duration / 2, type: 'thumbnail' });
  timestamps.push({ time: Math.max(0, duration - 1), type: 'thumbnail' });
  
  // Add scene change frames
  for (const scene of sceneChanges.slice(0, 15)) {
    timestamps.push({ time: scene.timestamp, type: 'scene_change' });
  }
  
  // Calculate interval for regular frames
  const remainingSlots = maxFrames - timestamps.length;
  const interval = duration / remainingSlots;
  
  for (let t = 0; t < duration && timestamps.length < maxFrames; t += interval) {
    // Don't add if too close to existing timestamp
    const tooClose = timestamps.some(ts => Math.abs(ts.time - t) < 0.5);
    if (!tooClose) {
      timestamps.push({ time: t, type: 'regular' });
    }
  }
  
  // Sort by time
  timestamps.sort((a, b) => a.time - b.time);
  
  // Extract frames
  for (let i = 0; i < timestamps.length && i < maxFrames; i++) {
    const { time, type } = timestamps[i];
    const outputPath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.jpg`);
    
    await new Promise<void>((resolve) => {
      const args = [
        '-ss', time.toFixed(2),
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath
      ];
      
      const ffmpeg = spawn('ffmpeg', args);
      ffmpeg.on('close', () => resolve());
    });
    
    if (fs.existsSync(outputPath)) {
      const buffer = fs.readFileSync(outputPath);
      frames.push({
        timestamp: time,
        path: outputPath,
        base64: buffer.toString('base64'),
        type
      });
    }
  }
  
  return frames;
}

/**
 * Calculate shot durations based on scene changes
 */
export function calculateShotDurations(
  duration: number,
  sceneChanges: SceneChange[]
): Array<{ start: number; end: number; duration: number }> {
  const shots: Array<{ start: number; end: number; duration: number }> = [];
  
  // Sort scene changes by timestamp
  const sortedChanges = [...sceneChanges].sort((a, b) => a.timestamp - b.timestamp);
  
  let lastTime = 0;
  for (const change of sortedChanges) {
    if (change.timestamp > lastTime) {
      shots.push({
        start: lastTime,
        end: change.timestamp,
        duration: change.timestamp - lastTime
      });
      lastTime = change.timestamp;
    }
  }
  
  // Add final shot
  if (lastTime < duration) {
    shots.push({
      start: lastTime,
      end: duration,
      duration: duration - lastTime
    });
  }
  
  return shots;
}

/**
 * Perform full video analysis using all FFmpeg capabilities
 */
export async function performFullAnalysis(videoPath: string): Promise<FullVideoAnalysis> {
  console.log('[FFmpeg] Starting full video analysis...');
  
  // Step 1: Get metadata
  console.log('[FFmpeg] Getting metadata...');
  const metadata = await getFullMetadata(videoPath);
  console.log(`[FFmpeg] Video: ${metadata.duration.toFixed(1)}s, ${metadata.width}x${metadata.height}, ${metadata.codec}`);
  console.log(`[FFmpeg] Audio: ${metadata.hasAudio ? `${metadata.audioCodec}, ${metadata.audioChannels}ch` : 'No audio'}`);
  
  // Step 2: Detect scene changes
  console.log('[FFmpeg] Detecting scene changes...');
  const sceneChanges = await detectSceneChanges(videoPath, 0.25);
  console.log(`[FFmpeg] Found ${sceneChanges.length} scene changes`);
  
  // Step 3: Analyze audio (if present)
  let audioAnalysis: AudioAnalysis = {
    meanVolume: -30,
    maxVolume: -10,
    silences: [],
    loudPeaks: [],
    hasMusic: false,
    hasSpeech: false,
    dynamicRange: 20
  };
  
  let audioPath: string | null = null;
  
  if (metadata.hasAudio) {
    console.log('[FFmpeg] Analyzing audio...');
    audioAnalysis = await analyzeAudio(videoPath);
    console.log(`[FFmpeg] Audio: mean=${audioAnalysis.meanVolume.toFixed(1)}dB, max=${audioAnalysis.maxVolume.toFixed(1)}dB`);
    console.log(`[FFmpeg] Silences: ${audioAnalysis.silences.length}, Peaks: ${audioAnalysis.loudPeaks.length}`);
    
    // Extract audio for transcription
    console.log('[FFmpeg] Extracting audio track...');
    audioPath = await extractAudio(videoPath);
    console.log(`[FFmpeg] Audio extracted: ${audioPath ? 'success' : 'failed'}`);
  }
  
  // Step 4: Extract smart frames
  console.log('[FFmpeg] Extracting smart frames...');
  const frames = await extractSmartFrames(videoPath, metadata.duration, sceneChanges, 35);
  console.log(`[FFmpeg] Extracted ${frames.length} frames`);
  
  // Step 5: Calculate shot durations
  const shotDurations = calculateShotDurations(metadata.duration, sceneChanges);
  console.log(`[FFmpeg] Calculated ${shotDurations.length} shots`);
  
  console.log('[FFmpeg] Full analysis complete!');
  
  return {
    metadata,
    frames,
    sceneChanges,
    audioAnalysis,
    audioPath,
    shotDurations
  };
}

/**
 * Cleanup extracted frames
 */
export function cleanupAnalysis(analysis: FullVideoAnalysis): void {
  // Cleanup frames
  for (const frame of analysis.frames) {
    try {
      if (fs.existsSync(frame.path)) {
        fs.unlinkSync(frame.path);
      }
    } catch {}
  }
  
  // Cleanup audio file
  if (analysis.audioPath && fs.existsSync(analysis.audioPath)) {
    try {
      fs.unlinkSync(analysis.audioPath);
    } catch {}
  }
  
  // Try to remove temp directories
  const dirs = Array.from(new Set(analysis.frames.map(f => path.dirname(f.path))));
  for (const dir of dirs) {
    try {
      fs.rmdirSync(dir);
    } catch {}
  }
}
