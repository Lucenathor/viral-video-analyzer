import { compressVideo, cleanupCompressedFile } from './server/services/ffmpegService.ts';
import * as fs from 'fs';

const inputPath = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';

console.log('Starting video compression with FFmpeg...');
console.log('Input file:', inputPath);
console.log('Input size:', (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2), 'MB');
console.log('');

try {
  const result = await compressVideo(inputPath, (progress) => {
    process.stdout.write(`\rCompressing... ${progress.percent}% ${progress.speed || ''}`);
  });
  
  console.log('\n\n=== Compression Complete ===');
  console.log('Output file:', result.outputPath);
  console.log('Input size:', (result.inputSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Output size:', (result.outputSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Compression ratio:', result.compressionRatio.toFixed(2) + 'x');
  console.log('Processing time:', result.duration.toFixed(1), 'seconds');
  
  // Keep the file for testing
  console.log('\nCompressed file saved at:', result.outputPath);
  
} catch (error) {
  console.error('Compression failed:', error);
}
