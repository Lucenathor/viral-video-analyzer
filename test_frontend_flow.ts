// Test que simula EXACTAMENTE lo que hace el frontend
import * as fs from 'fs';
import * as path from 'path';

const VIDEO_PATH = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';
const API_BASE = 'http://localhost:3000/api/trpc';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

// Simular cookie de sesión (necesitamos obtenerla del navegador)
const SESSION_COOKIE = process.env.SESSION_COOKIE || '';

async function trpcCall(procedure: string, input: any) {
  const url = `${API_BASE}/${procedure}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': SESSION_COOKIE,
    },
    body: JSON.stringify(input),
  });
  
  const data = await response.json();
  
  if (data.error) {
    console.error(`[ERROR] ${procedure}:`, JSON.stringify(data.error, null, 2));
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  
  return data.result?.data;
}

async function testFrontendFlow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    TEST DEL FLUJO EXACTO DEL FRONTEND');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Read video file
  const videoBuffer = fs.readFileSync(VIDEO_PATH);
  const fileName = path.basename(VIDEO_PATH);
  const fileSize = videoBuffer.length;
  const mimeType = 'video/quicktime';
  
  console.log(`📹 Archivo: ${fileName}`);
  console.log(`📦 Tamaño: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📄 MIME: ${mimeType}\n`);
  
  try {
    // Step 1: Get upload URL
    console.log('📤 PASO 1: Obteniendo URL de subida...');
    const { fileKey } = await trpcCall('video.getUploadUrl', {
      fileName,
      mimeType,
    });
    console.log(`   ✅ fileKey: ${fileKey}\n`);
    
    // Step 2: Upload chunks
    console.log('📤 PASO 2: Subiendo chunks...');
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = videoBuffer.slice(start, end);
      const base64Chunk = chunk.toString('base64');
      
      await trpcCall('video.uploadChunk', {
        fileKey,
        chunk: base64Chunk,
        chunkIndex: i,
        totalChunks,
        mimeType,
        isLastChunk: i === totalChunks - 1,
      });
      
      console.log(`   ✅ Chunk ${i + 1}/${totalChunks} subido (${(chunk.length / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    // Step 3: Finalize and analyze
    console.log('\n🔬 PASO 3: Finalizando y analizando...');
    console.log('   (Esto puede tardar varios minutos...)\n');
    
    const startTime = Date.now();
    const result = await trpcCall('video.finalizeUploadAndAnalyze', {
      fileKey,
      fileName,
      mimeType,
      fileSize,
      analysisType: 'viral_analysis',
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ✅ ANÁLISIS COMPLETADO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`⏱️  Tiempo total: ${elapsed}s`);
    console.log(`⭐ Overall Score: ${result.overallScore}`);
    console.log(`🎣 Hook Score: ${result.hookScore}`);
    console.log(`⚡ Pacing Score: ${result.pacingScore}`);
    console.log(`💬 Engagement Score: ${result.engagementScore}`);
    
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testFrontendFlow();
