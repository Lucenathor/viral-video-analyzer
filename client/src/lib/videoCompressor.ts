/**
 * Browser-side video compression using Canvas + MediaRecorder
 * Compresses large videos (>80MB) to 720p WebM before uploading
 */

export interface CompressionProgress {
  phase: 'loading' | 'compressing' | 'done';
  progress: number; // 0-100
  originalSize: number;
  compressedSize?: number;
}

const COMPRESSION_THRESHOLD = 30 * 1024 * 1024; // 30MB - compress if larger (proxy limit ~100MB)
const TARGET_WIDTH = 720; // Target shorter dimension
const TARGET_BITRATE = 1_500_000; // 1.5 Mbps video bitrate (better compression)

export function needsCompression(file: File): boolean {
  return file.size > COMPRESSION_THRESHOLD;
}

export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void
): Promise<File> {
  // If file is small enough, skip compression
  if (!needsCompression(file)) {
    return file;
  }

  onProgress?.({ phase: 'loading', progress: 0, originalSize: file.size });

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      // Calculate target dimensions maintaining aspect ratio
      const { videoWidth, videoHeight } = video;
      let targetW: number, targetH: number;
      
      if (videoWidth > videoHeight) {
        // Landscape
        targetH = Math.min(TARGET_WIDTH, videoHeight);
        targetW = Math.round((videoWidth / videoHeight) * targetH);
      } else {
        // Portrait (most reels/shorts)
        targetW = Math.min(TARGET_WIDTH, videoWidth);
        targetH = Math.round((videoHeight / videoWidth) * targetW);
      }
      
      // Ensure even dimensions (required by some codecs)
      targetW = targetW % 2 === 0 ? targetW : targetW + 1;
      targetH = targetH % 2 === 0 ? targetH : targetH + 1;

      console.log(`[Compressor] Original: ${videoWidth}x${videoHeight} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      console.log(`[Compressor] Target: ${targetW}x${targetH}`);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;

      // Use MediaRecorder to capture the canvas + audio
      const stream = canvas.captureStream(30); // 30fps

      // Try to capture audio from the video
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination); // Also play to hear (muted anyway)
        
        // Add audio track to the stream
        dest.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (e) {
        console.warn('[Compressor] Could not capture audio, video-only compression');
      }

      // Choose codec - prefer VP9 for better compression, fallback to VP8
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: TARGET_BITRATE,
      });

      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const compressedFile = new File(
          [blob], 
          file.name.replace(/\.[^.]+$/, '.webm'),
          { type: 'video/webm' }
        );
        
        console.log(`[Compressor] Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
        
        onProgress?.({ 
          phase: 'done', 
          progress: 100, 
          originalSize: file.size,
          compressedSize: compressedFile.size
        });
        
        resolve(compressedFile);
      };

      recorder.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Error during video compression'));
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      
      const duration = video.duration;
      let animFrameId: number;
      
      const drawFrame = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          cancelAnimationFrame(animFrameId);
          return;
        }
        
        ctx.drawImage(video, 0, 0, targetW, targetH);
        
        // Report progress
        const progress = Math.min(99, Math.round((video.currentTime / duration) * 100));
        onProgress?.({ 
          phase: 'compressing', 
          progress, 
          originalSize: file.size 
        });
        
        animFrameId = requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        setTimeout(() => {
          recorder.stop();
          cancelAnimationFrame(animFrameId);
        }, 500);
      };

      // Start playback at max speed
      video.playbackRate = 16; // Process 16x faster
      video.play().then(() => {
        onProgress?.({ phase: 'compressing', progress: 0, originalSize: file.size });
        drawFrame();
      }).catch(reject);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error loading video for compression'));
    };
  });
}
