import dotenv from 'dotenv';
dotenv.config();

const AZURE_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION;
const AZURE_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_API_KEY = process.env.AZURE_VIDEO_INDEXER_API_KEY;

// Use the video that's already processed
const VIDEO_ID = 'lwar7eexp2';

async function getAccessToken() {
  const url = `https://api.videoindexer.ai/Auth/${AZURE_LOCATION}/Accounts/${AZURE_ACCOUNT_ID}/AccessToken?allowEdit=true`;
  const response = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': AZURE_API_KEY }
  });
  return response.text().then(t => t.replace(/"/g, ''));
}

async function getVideoIndex(accessToken) {
  const url = `https://api.videoindexer.ai/${AZURE_LOCATION}/Accounts/${AZURE_ACCOUNT_ID}/Videos/${VIDEO_ID}/Index?accessToken=${accessToken}`;
  const response = await fetch(url);
  return response.json();
}

async function getThumbnail(accessToken, thumbnailId) {
  const url = `https://api.videoindexer.ai/${AZURE_LOCATION}/Accounts/${AZURE_ACCOUNT_ID}/Videos/${VIDEO_ID}/Thumbnails/${thumbnailId}?accessToken=${accessToken}&format=Base64`;
  const response = await fetch(url);
  return response.text();
}

async function main() {
  console.log('Getting access token...');
  const accessToken = await getAccessToken();
  
  console.log('Getting video index...');
  const indexResult = await getVideoIndex(accessToken);
  
  const insights = indexResult.videos?.[0]?.insights || {};
  
  // Get all thumbnail IDs
  const thumbnailIds = [];
  if (insights.shots) {
    for (const shot of insights.shots) {
      if (shot.keyFrames) {
        for (const kf of shot.keyFrames) {
          if (kf.instances) {
            for (const inst of kf.instances) {
              if (inst.thumbnailId) {
                thumbnailIds.push({
                  id: inst.thumbnailId,
                  timestamp: inst.start
                });
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`Found ${thumbnailIds.length} thumbnails`);
  
  // Download up to 30 thumbnails
  const maxThumbnails = Math.min(thumbnailIds.length, 30);
  const thumbnailsBase64 = [];
  
  for (let i = 0; i < maxThumbnails; i++) {
    console.log(`Downloading thumbnail ${i+1}/${maxThumbnails} (${thumbnailIds[i].timestamp})...`);
    const base64 = await getThumbnail(accessToken, thumbnailIds[i].id);
    thumbnailsBase64.push({
      base64,
      timestamp: thumbnailIds[i].timestamp
    });
  }
  
  // Extract all Azure data
  const azureData = {
    transcript: insights.transcript?.map(t => t.text).join(' ') || '',
    transcriptWithTimestamps: insights.transcript?.map(t => `[${t.instances?.[0]?.start || ''}] ${t.text}`).join('\n') || '',
    duration: indexResult.videos?.[0]?.durationInSeconds || 0,
    language: indexResult.videos?.[0]?.language || 'unknown',
    resolution: `${indexResult.width || 0}x${indexResult.height || 0}`,
    topics: insights.topics?.map(t => `${t.name} (${(t.confidence * 100).toFixed(0)}%)`) || [],
    keywords: insights.keywords?.map(k => k.text) || [],
    people: insights.namedPeople?.map(p => p.name) || [],
    locations: insights.namedLocations?.map(l => l.name) || [],
    brands: insights.brands?.map(b => b.name) || [],
    objects: insights.detectedObjects?.map(o => o.displayName) || [],
    labels: insights.labels?.map(l => l.name) || [],
    sentiments: insights.sentiments?.map(s => ({ type: s.sentimentType, score: s.averageScore })) || [],
    emotions: insights.emotions?.map(e => ({ type: e.type, score: e.averageScore })) || [],
    speakers: insights.speakers?.length || 0,
    audioEffects: insights.audioEffects?.map(a => a.type) || [],
    shots: insights.shots?.map(s => ({
      start: s.keyFrames?.[0]?.instances?.[0]?.start || '',
      end: s.keyFrames?.[0]?.instances?.[0]?.end || ''
    })) || [],
    ocr: insights.ocr?.flatMap(o => o.instances?.map(inst => ({ text: o.text, timestamp: inst.start })) || []) || [],
    faces: insights.faces?.map(f => ({ name: f.name || 'Unknown', appearances: f.instances?.map(inst => `${inst.start}-${inst.end}`) || [] })) || [],
    scenes: insights.scenes?.map(s => ({ start: s.instances?.[0]?.start || '', end: s.instances?.[0]?.end || '' })) || []
  };
  
  console.log('\n=== AZURE DATA EXTRACTED ===');
  console.log('Transcript:', azureData.transcript.substring(0, 200) + '...');
  console.log('Duration:', azureData.duration, 'seconds');
  console.log('Thumbnails downloaded:', thumbnailsBase64.length);
  console.log('Shots:', azureData.shots.length);
  console.log('OCR texts:', azureData.ocr.length);
  console.log('Faces:', azureData.faces.length);
  
  // Now send to Gemini with ultra-detailed prompt
  console.log('\n=== SENDING TO GEMINI FOR ULTRA-DETAILED ANALYSIS ===');
  
  const contentParts = [];
  
  // Add Azure data
  const azureDataText = `
DATOS COMPLETOS DE AZURE VIDEO INDEXER:

=== INFORMACIÓN GENERAL ===
- Duración total: ${azureData.duration} segundos
- Idioma detectado: ${azureData.language}
- Resolución: ${azureData.resolution}

=== TRANSCRIPCIÓN COMPLETA CON TIMESTAMPS ===
${azureData.transcriptWithTimestamps || 'Sin transcripción'}

=== TEMAS DETECTADOS ===
${azureData.topics.join(', ') || 'Ninguno'}

=== PALABRAS CLAVE ===
${azureData.keywords.join(', ') || 'Ninguna'}

=== PERSONAS MENCIONADAS ===
${azureData.people.join(', ') || 'Ninguna'}

=== UBICACIONES ===
${azureData.locations.join(', ') || 'Ninguna'}

=== OBJETOS DETECTADOS ===
${azureData.objects.join(', ') || 'Ninguno'}

=== ETIQUETAS VISUALES ===
${azureData.labels.join(', ') || 'Ninguna'}

=== TEXTO EN PANTALLA (OCR) ===
${azureData.ocr.map(o => `[${o.timestamp}] "${o.text}"`).join('\n') || 'Ninguno'}

=== CARAS/PERSONAS DETECTADAS ===
${azureData.faces.map(f => `${f.name}: aparece en ${f.appearances.join(', ')}`).join('\n') || 'Ninguna'}

=== SHOTS/CORTES DE EDICIÓN ===
${azureData.shots.map((s, i) => `Shot ${i+1}: ${s.start} - ${s.end}`).join('\n') || 'Ninguno'}
`;

  contentParts.push({ type: 'text', text: azureDataText });
  
  // Add images with timestamps
  for (const thumb of thumbnailsBase64) {
    contentParts.push({ type: 'text', text: `\n--- FRAME EN TIMESTAMP ${thumb.timestamp} ---` });
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${thumb.base64}`,
        detail: 'high'
      }
    });
  }
  
  // Add ultra-detailed prompt
  contentParts.push({
    type: 'text',
    text: `
ANALIZA ESTE VÍDEO EN DETALLE EXTREMO. Tienes ${thumbnailsBase64.length} frames/imágenes del vídeo y todos los datos de Azure Video Indexer.

DEBES DESCRIBIR EXACTAMENTE:

1. **DESCRIPCIÓN FRAME POR FRAME**: Para CADA imagen que ves, describe:
   - Qué persona aparece y qué está haciendo exactamente
   - Expresión facial y lenguaje corporal
   - Posición de la cámara (primer plano, plano medio, plano general)
   - Movimiento de cámara (estático, zoom, pan, tilt)
   - Iluminación y colores dominantes
   - Objetos y fondo visible
   - Texto en pantalla (si hay)

2. **CORTES DE EDICIÓN**: Identifica TODOS los cortes/transiciones:
   - Timestamp exacto de cada corte
   - Tipo de transición (corte seco, fade, zoom, etc.)
   - Ritmo de edición (rápido, lento, variable)

3. **CALL TO ACTION (CTA)**: 
   - ¿Hay CTA? ¿Cuál es exactamente?
   - ¿En qué momento aparece? (timestamp)
   - ¿Es verbal, visual o ambos?
   - ¿Qué acción pide al espectador?

4. **HOOK (primeros 3 segundos)**:
   - ¿Qué técnica usa para captar atención?
   - ¿Qué se ve y se escucha exactamente?
   - ¿Por qué funciona (o no) como gancho?

5. **AUDIO Y VOZ**:
   - Tono de voz (energético, calmado, humorístico)
   - Velocidad del habla
   - Música de fondo (si hay)
   - Efectos de sonido

Responde en JSON. Sé EXTREMADAMENTE DETALLADO. No omitas nada de lo que ves en las imágenes.
`
  });
  
  // Call Gemini
  const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
  const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
  
  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`
    },
    body: JSON.stringify({
      messages: [
        { 
          role: 'system', 
          content: 'Eres un experto analista de contenido viral con experiencia en TikTok, Instagram Reels y YouTube Shorts. Tu trabajo es analizar vídeos frame por frame, identificando CADA detalle visual, cada corte de edición, cada CTA, y todo lo que ocurre en el vídeo. Debes ser EXTREMADAMENTE DETALLADO y describir exactamente lo que ves en cada imagen. Responde siempre en español y en formato JSON válido.'
        },
        { role: 'user', content: contentParts }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'viral_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              frameByFrameAnalysis: { type: 'string' },
              hookAnalysis: { type: 'string' },
              editingAnalysis: { type: 'string' },
              callToAction: { type: 'string' },
              audioAnalysis: { type: 'string' },
              visualElements: { type: 'string' },
              summary: { type: 'string' },
              overallScore: { type: 'number' },
              hookScore: { type: 'number' },
              pacingScore: { type: 'number' },
              engagementScore: { type: 'number' }
            },
            required: ['frameByFrameAnalysis', 'hookAnalysis', 'editingAnalysis', 'callToAction', 'audioAnalysis', 'visualElements', 'summary', 'overallScore', 'hookScore', 'pacingScore', 'engagementScore'],
            additionalProperties: false
          }
        }
      }
    })
  });
  
  const result = await response.json();
  const analysis = JSON.parse(result.choices[0].message.content);
  
  console.log('\n=== ANÁLISIS ULTRA-DETALLADO ===\n');
  console.log('FRAME BY FRAME ANALYSIS:');
  console.log(analysis.frameByFrameAnalysis);
  console.log('\n---\n');
  console.log('HOOK ANALYSIS:');
  console.log(analysis.hookAnalysis);
  console.log('\n---\n');
  console.log('EDITING ANALYSIS:');
  console.log(analysis.editingAnalysis);
  console.log('\n---\n');
  console.log('CALL TO ACTION:');
  console.log(analysis.callToAction);
  console.log('\n---\n');
  console.log('AUDIO ANALYSIS:');
  console.log(analysis.audioAnalysis);
  console.log('\n---\n');
  console.log('SCORES:');
  console.log('Overall:', analysis.overallScore);
  console.log('Hook:', analysis.hookScore);
  console.log('Pacing:', analysis.pacingScore);
  console.log('Engagement:', analysis.engagementScore);
}

main().catch(console.error);
