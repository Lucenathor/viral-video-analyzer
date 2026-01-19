// Test: Get all Azure Video Indexer data + thumbnails and send to Gemini
import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;
const AZURE_RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP;
const AZURE_VIDEO_INDEXER_ACCOUNT_NAME = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_NAME;
const AZURE_VIDEO_INDEXER_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_VIDEO_INDEXER_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION;

const VIDEO_ID = 'lwar7eexp2'; // User's processed video

async function getAzureADToken() {
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', AZURE_CLIENT_ID);
  params.append('client_secret', AZURE_CLIENT_SECRET);
  params.append('scope', 'https://management.azure.com/.default');
  params.append('grant_type', 'client_credentials');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  return (await response.json()).access_token;
}

async function getVideoIndexerToken(azureToken) {
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_NAME}/generateAccessToken?api-version=2025-04-01`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${azureToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissionType: 'Contributor', scope: 'Account' }),
  });
  return (await response.json()).accessToken;
}

async function getVideoIndex(viToken, videoId) {
  const url = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${viToken}`;
  const response = await fetch(url);
  return await response.json();
}

async function getThumbnails(viToken, videoId, indexResult) {
  const thumbnails = [];
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  // Get keyframes/shots thumbnails
  if (insights.shots) {
    for (const shot of insights.shots.slice(0, 10)) { // Limit to 10 shots
      for (const keyFrame of (shot.keyFrames || []).slice(0, 2)) {
        const thumbnailId = keyFrame.instances?.[0]?.thumbnailId;
        if (thumbnailId) {
          const url = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Thumbnails/${thumbnailId}?accessToken=${viToken}&format=Jpeg`;
          thumbnails.push({
            id: thumbnailId,
            url: url,
            time: keyFrame.instances?.[0]?.start || '0:00:00'
          });
        }
      }
    }
  }
  
  return thumbnails;
}

async function downloadThumbnailAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (e) {
    console.error('Error downloading thumbnail:', e.message);
    return null;
  }
}

async function analyzeWithGemini(azureData, thumbnailsBase64) {
  // Build the content array with text and images
  const content = [];
  
  // Add the Azure data as text
  const azureDataText = `
DATOS COMPLETOS DE AZURE VIDEO INDEXER:

INFORMACIÓN GENERAL:
- Duración: ${azureData.duration} segundos
- Idioma detectado: ${azureData.language}
- Resolución: ${azureData.resolution}

TRANSCRIPCIÓN COMPLETA:
${azureData.transcript}

TEMAS DETECTADOS:
${azureData.topics.join(', ') || 'Ninguno'}

PALABRAS CLAVE:
${azureData.keywords.join(', ') || 'Ninguna'}

PERSONAS MENCIONADAS:
${azureData.people.join(', ') || 'Ninguna'}

UBICACIONES:
${azureData.locations.join(', ') || 'Ninguna'}

MARCAS DETECTADAS:
${azureData.brands.join(', ') || 'Ninguna'}

OBJETOS DETECTADOS:
${azureData.objects.join(', ') || 'Ninguno'}

ETIQUETAS:
${azureData.labels.join(', ') || 'Ninguna'}

SENTIMIENTOS:
${azureData.sentiments.map(s => `${s.type}: ${s.score}`).join(', ') || 'Neutral'}

EMOCIONES DETECTADAS:
${azureData.emotions.map(e => `${e.type}: ${e.score}`).join(', ') || 'Ninguna'}

NÚMERO DE HABLANTES: ${azureData.speakers}

EFECTOS DE AUDIO:
${azureData.audioEffects.join(', ') || 'Ninguno'}

ESCENAS/SHOTS:
${azureData.shots.map((s, i) => `Shot ${i+1}: ${s.start} - ${s.end}`).join('\n')}
`;

  content.push({ type: 'text', text: azureDataText });
  
  // Add images
  for (let i = 0; i < thumbnailsBase64.length; i++) {
    if (thumbnailsBase64[i]) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${thumbnailsBase64[i]}`,
          detail: 'high'
        }
      });
    }
  }
  
  // Add the analysis request
  content.push({
    type: 'text',
    text: `
Basándote en TODOS los datos de Azure Video Indexer anteriores Y las ${thumbnailsBase64.filter(t => t).length} imágenes/frames del vídeo que te he proporcionado, genera un ANÁLISIS DE VIRALIDAD COMPLETO.

Debes analizar:
1. HOOK (primeros 3 segundos): ¿Qué técnica visual y auditiva usa para captar atención? Describe exactamente lo que ves en las primeras imágenes.
2. ESTRUCTURA: Divide el vídeo en segmentos con timestamps basándote en los shots y la transcripción.
3. ELEMENTOS VISUALES: Describe lo que ves en cada frame/imagen - colores, composición, texto en pantalla, expresiones faciales, etc.
4. FACTORES DE VIRALIDAD: Puntúa cada aspecto del 0 al 100.
5. RESUMEN COMPLETO: Explica por qué este vídeo funcionaría (o no) como contenido viral.

Responde en JSON con esta estructura:
{
  "hookAnalysis": "descripción detallada del hook basada en lo que VES",
  "visualElements": "descripción de los elementos visuales de cada frame",
  "structureBreakdown": { "segments": [...] },
  "viralityFactors": { "factors": [...] },
  "summary": "resumen completo",
  "overallScore": número,
  "hookScore": número,
  "pacingScore": número,
  "engagementScore": número
}
`
  });

  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { 
        role: 'system', 
        content: 'Eres un experto analista de contenido viral. Analiza TODOS los datos de Azure Video Indexer Y las imágenes proporcionadas para dar un análisis completo. Responde en español y en JSON válido.' 
      },
      { role: 'user', content: content }
    ]
  };

  console.log('\nEnviando a Gemini:');
  console.log('- Datos de Azure: ✓');
  console.log(`- Imágenes/frames: ${thumbnailsBase64.filter(t => t).length}`);
  
  const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}

function extractFullAzureData(indexResult) {
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  return {
    duration: video?.durationInSeconds || 0,
    language: video?.language || 'unknown',
    resolution: `${indexResult.width || 0}x${indexResult.height || 0}`,
    transcript: insights.transcript?.map(t => `[${t.instances?.[0]?.start || ''}] ${t.text}`).join('\n') || '',
    topics: insights.topics?.map(t => `${t.name} (${t.confidence})`) || [],
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
    })) || []
  };
}

async function runTest() {
  try {
    console.log('=== TEST: AZURE DATA + THUMBNAILS → GEMINI ===\n');
    
    // Step 1: Get Azure tokens
    console.log('1. Obteniendo tokens de Azure...');
    const azureToken = await getAzureADToken();
    const viToken = await getVideoIndexerToken(azureToken);
    console.log('✓ Tokens obtenidos');
    
    // Step 2: Get video index with all data
    console.log('\n2. Obteniendo datos completos de Azure Video Indexer...');
    const indexResult = await getVideoIndex(viToken, VIDEO_ID);
    const azureData = extractFullAzureData(indexResult);
    console.log('✓ Datos extraídos:');
    console.log(`  - Duración: ${azureData.duration}s`);
    console.log(`  - Transcripción: ${azureData.transcript.length} caracteres`);
    console.log(`  - Temas: ${azureData.topics.length}`);
    console.log(`  - Keywords: ${azureData.keywords.length}`);
    console.log(`  - Shots: ${azureData.shots.length}`);
    
    // Step 3: Get thumbnails
    console.log('\n3. Obteniendo thumbnails/frames...');
    const thumbnails = await getThumbnails(viToken, VIDEO_ID, indexResult);
    console.log(`✓ ${thumbnails.length} thumbnails encontrados`);
    
    // Step 4: Download thumbnails as base64
    console.log('\n4. Descargando imágenes...');
    const thumbnailsBase64 = [];
    for (const thumb of thumbnails) {
      const base64 = await downloadThumbnailAsBase64(thumb.url);
      if (base64) {
        thumbnailsBase64.push(base64);
        console.log(`  ✓ Frame ${thumb.time} descargado`);
      }
    }
    console.log(`✓ ${thumbnailsBase64.length} imágenes descargadas`);
    
    // Step 5: Send to Gemini
    console.log('\n5. Enviando a Gemini para análisis completo...');
    const geminiResult = await analyzeWithGemini(azureData, thumbnailsBase64);
    
    console.log('\n=== RESPUESTA DE GEMINI ===');
    console.log('Status:', geminiResult.choices ? 'OK' : 'ERROR');
    
    if (geminiResult.choices?.[0]?.message?.content) {
      const content = geminiResult.choices[0].message.content;
      console.log('\nAnálisis completo:');
      console.log(content.substring(0, 2000) + '...');
      
      // Try to parse JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log('\n=== RESUMEN DEL ANÁLISIS ===');
          console.log('Overall Score:', analysis.overallScore);
          console.log('Hook Score:', analysis.hookScore);
          console.log('Pacing Score:', analysis.pacingScore);
          console.log('Engagement Score:', analysis.engagementScore);
          console.log('\nHook Analysis:', analysis.hookAnalysis?.substring(0, 300) + '...');
          console.log('\nVisual Elements:', analysis.visualElements?.substring(0, 300) + '...');
        }
      } catch (e) {
        console.log('(Respuesta no es JSON puro, pero el análisis está completo)');
      }
    } else {
      console.log('Error:', JSON.stringify(geminiResult, null, 2));
    }
    
    console.log('\n✓ TEST COMPLETADO');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

runTest();
