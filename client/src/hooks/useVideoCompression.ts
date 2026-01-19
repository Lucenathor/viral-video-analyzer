import { useState, useCallback, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'done' | 'error';
  progress: number;
  message: string;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export function useVideoCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress>({
    stage: 'loading',
    progress: 0,
    message: '',
  });
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadedRef = useRef(false);

  const loadFFmpeg = useCallback(async () => {
    if (loadedRef.current && ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      const percent = Math.round(progress * 100);
      setCompressionProgress({
        stage: 'compressing',
        progress: percent,
        message: `Comprimiendo... ${percent}%`,
      });
    });

    setCompressionProgress({
      stage: 'loading',
      progress: 0,
      message: 'Cargando compresor de vídeo...',
    });

    // Load FFmpeg core from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    loadedRef.current = true;
    return ffmpeg;
  }, []);

  const compressVideo = useCallback(async (
    file: File,
    options?: {
      maxSizeMB?: number;
      targetBitrate?: string;
      maxWidth?: number;
      maxHeight?: number;
    }
  ): Promise<CompressionResult | null> => {
    const {
      maxSizeMB = 25,
      targetBitrate = '2M',
      maxWidth = 1280,
      maxHeight = 720,
    } = options || {};

    // Skip compression if file is already small enough
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB <= maxSizeMB) {
      console.log(`[Compression] File is already ${fileSizeMB.toFixed(1)}MB, skipping compression`);
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
      };
    }

    setIsCompressing(true);
    
    try {
      const ffmpeg = await loadFFmpeg();

      setCompressionProgress({
        stage: 'compressing',
        progress: 0,
        message: 'Preparando vídeo para compresión...',
      });

      // Write input file to FFmpeg virtual filesystem
      const inputFileName = 'input' + getExtension(file.name);
      const outputFileName = 'output.mp4';
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));

      setCompressionProgress({
        stage: 'compressing',
        progress: 10,
        message: 'Comprimiendo vídeo...',
      });

      // Compress video with optimized settings for web
      // -vf scale: resize to max dimensions while keeping aspect ratio
      // -c:v libx264: use H.264 codec (most compatible)
      // -preset fast: balance between speed and compression
      // -crf 28: constant rate factor (higher = more compression, 23-28 is good for web)
      // -c:a aac: use AAC audio codec
      // -b:a 128k: audio bitrate
      // -movflags +faststart: optimize for web streaming
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vf', `scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputFileName,
      ]);

      setCompressionProgress({
        stage: 'compressing',
        progress: 90,
        message: 'Finalizando compresión...',
      });

      // Read the output file
      const data = await ffmpeg.readFile(outputFileName);
      // @ts-ignore - FFmpeg returns FileData which is compatible with Blob
      const compressedBlob = new Blob([data], { type: 'video/mp4' });
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4',
        { type: 'video/mp4' }
      );

      // Clean up
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      const result: CompressionResult = {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size / compressedFile.size,
      };

      setCompressionProgress({
        stage: 'done',
        progress: 100,
        message: `Comprimido: ${(result.originalSize / 1024 / 1024).toFixed(1)}MB → ${(result.compressedSize / 1024 / 1024).toFixed(1)}MB (${Math.round((1 - result.compressedSize / result.originalSize) * 100)}% reducción)`,
      });

      return result;
    } catch (error) {
      console.error('[Compression Error]', error);
      setCompressionProgress({
        stage: 'error',
        progress: 0,
        message: 'Error al comprimir el vídeo. Subiendo original...',
      });
      return null;
    } finally {
      setIsCompressing(false);
    }
  }, [loadFFmpeg]);

  return {
    compressVideo,
    isCompressing,
    compressionProgress,
  };
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'mov') return '.mov';
  if (ext === 'webm') return '.webm';
  if (ext === 'avi') return '.avi';
  if (ext === 'mkv') return '.mkv';
  return '.mp4';
}
