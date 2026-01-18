// Full test of Azure Video Indexer flow with user's video
import { config } from 'dotenv';
import fs from 'fs';
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

// Use the video that was already processed
const EXISTING_VIDEO_ID = 'lwar7eexp2';

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
  
  const result = await response.json();
  return result.access_token;
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
  
  const result = await response.json();
  return result.accessToken;
}

async function getVideoIndex(viToken, videoId) {
  const statusUrl = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${viToken}`;
  const response = await fetch(statusUrl);
  return await response.json();
}

function extractViralAnalysis(indexResult) {
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  return {
    transcript: insights.transcript?.map(t => t.text).join(' ') || '',
    duration: video?.durationInSeconds || 0,
    language: video?.language || 'unknown',
    topics: insights.topics?.map(t => t.name) || [],
    keywords: insights.keywords?.map(k => k.text) || [],
    sentiments: insights.sentiments?.map(s => ({ type: s.sentimentType, score: s.averageScore })) || [],
    speakers: insights.speakers?.length || 0,
    locations: insights.namedLocations?.map(l => l.name) || [],
    people: insights.namedPeople?.map(p => p.name) || [],
    objects: insights.detectedObjects?.map(o => o.displayName) || [],
    audioEffects: insights.audioEffects?.map(a => a.type) || [],
  };
}

async function generateViralAnalysis(analysis) {
  const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales (Instagram Reels, TikTok, YouTube Shorts).

Te proporciono los datos extraídos por Azure Video Indexer de un vídeo. ANALIZA estos datos y proporciona un análisis de viralidad detallado.

DATOS DEL VÍDEO:
- Duración: ${analysis.duration} segundos
- Idioma: ${analysis.language}
- Transcripción: "${analysis.transcript}"
- Temas detectados: ${analysis.topics.join(', ') || 'Ninguno'}
- Palabras clave: ${analysis.keywords.join(', ') || 'Ninguna'}
- Ubicaciones mencionadas: ${analysis.locations.join(', ') || 'Ninguna'}
- Personas mencionadas: ${analysis.people.join(', ') || 'Ninguna'}
- Objetos detectados: ${analysis.objects.join(', ') || 'Ninguno'}
- Número de hablantes: ${analysis.speakers}
- Sentimientos: ${analysis.sentiments.map(s => s.type + ' (' + s.score + ')').join(', ') || 'Neutral'}
- Efectos de audio: ${analysis.audioEffects.join(', ') || 'Ninguno'}

Basándote en estos datos, analiza:
1. Los primeros 3 segundos (el "hook") - ¿Qué técnica usa para captar atención?
2. La estructura completa del vídeo - Divide en segmentos con timestamps
3. Los factores de viralidad - Puntúa cada aspecto del 0 al 100
4. Un resumen detallado de qué hace el vídeo y por qué funcionaría (o no) como contenido viral

Responde en formato JSON.`;

  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'Eres un experto analista de contenido viral. Analiza los datos del vídeo y proporciona un análisis detallado. Responde siempre en español y en formato JSON válido.' },
      { role: 'user', content: analysisPrompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'viral_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            hookAnalysis: { type: 'string' },
            structureBreakdown: {
              type: 'object',
              properties: {
                segments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      startTime: { type: 'number' },
                      endTime: { type: 'number' },
                      type: { type: 'string' },
                      description: { type: 'string' }
                    },
                    required: ['startTime', 'endTime', 'type', 'description'],
                    additionalProperties: false
                  }
                }
              },
              required: ['segments'],
              additionalProperties: false
            },
            viralityFactors: {
              type: 'object',
              properties: {
                factors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      score: { type: 'number' },
                      description: { type: 'string' }
                    },
                    required: ['name', 'score', 'description'],
                    additionalProperties: false
                  }
                }
              },
              required: ['factors'],
              additionalProperties: false
            },
            summary: { type: 'string' },
            overallScore: { type: 'number' },
            hookScore: { type: 'number' },
            pacingScore: { type: 'number' },
            engagementScore: { type: 'number' }
          },
          required: ['hookAnalysis', 'structureBreakdown', 'viralityFactors', 'summary', 'overallScore', 'hookScore', 'pacingScore', 'engagementScore'],
          additionalProperties: false
        }
      }
    }
  };
  
  const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  
  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

async function runTest() {
  try {
    console.log('=== FULL AZURE VIDEO INDEXER FLOW TEST ===\n');
    console.log('Using existing processed video ID:', EXISTING_VIDEO_ID);
    
    // Step 1: Get Azure tokens
    console.log('\n1. Getting Azure tokens...');
    const azureToken = await getAzureADToken();
    const viToken = await getVideoIndexerToken(azureToken);
    console.log('✅ Tokens obtained');
    
    // Step 2: Get video index
    console.log('\n2. Getting video index from Azure...');
    const indexResult = await getVideoIndex(viToken, EXISTING_VIDEO_ID);
    console.log('✅ Video index retrieved');
    console.log('   State:', indexResult.state);
    
    // Step 3: Extract analysis data
    console.log('\n3. Extracting analysis data...');
    const analysis = extractViralAnalysis(indexResult);
    console.log('✅ Analysis data extracted');
    console.log('   Duration:', analysis.duration, 'seconds');
    console.log('   Language:', analysis.language);
    console.log('   Transcript length:', analysis.transcript.length, 'chars');
    console.log('   Topics:', analysis.topics.join(', ') || 'None');
    console.log('   Keywords:', analysis.keywords.slice(0, 5).join(', ') || 'None');
    console.log('   Locations:', analysis.locations.join(', ') || 'None');
    console.log('   People:', analysis.people.join(', ') || 'None');
    console.log('   Objects:', analysis.objects.join(', ') || 'None');
    console.log('   Speakers:', analysis.speakers);
    
    // Step 4: Generate viral analysis with LLM
    console.log('\n4. Generating viral analysis with LLM...');
    const viralAnalysis = await generateViralAnalysis(analysis);
    console.log('✅ Viral analysis generated');
    
    // Step 5: Display results
    console.log('\n=== VIRAL ANALYSIS RESULT ===');
    console.log('Overall Score:', viralAnalysis.overallScore);
    console.log('Hook Score:', viralAnalysis.hookScore);
    console.log('Pacing Score:', viralAnalysis.pacingScore);
    console.log('Engagement Score:', viralAnalysis.engagementScore);
    
    console.log('\nHook Analysis:');
    console.log(viralAnalysis.hookAnalysis);
    
    console.log('\nStructure Breakdown:');
    viralAnalysis.structureBreakdown.segments.forEach((seg, i) => {
      console.log(`  ${i+1}. [${seg.startTime}s - ${seg.endTime}s] ${seg.type}: ${seg.description.substring(0, 80)}...`);
    });
    
    console.log('\nVirality Factors:');
    viralAnalysis.viralityFactors.factors.forEach(f => {
      console.log(`  - ${f.name}: ${f.score}/100`);
    });
    
    console.log('\nSummary:');
    console.log(viralAnalysis.summary);
    
    console.log('\n✅ FULL AZURE FLOW TEST PASSED!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

runTest();
