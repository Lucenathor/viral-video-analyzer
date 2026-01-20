import { db } from './server/db.ts';
import { videoAnalyses } from './drizzle/schema.ts';
import { desc } from 'drizzle-orm';

const recent = await db.select().from(videoAnalyses).orderBy(desc(videoAnalyses.createdAt)).limit(5);
console.log('=== ÚLTIMOS 5 ANÁLISIS ===');
recent.forEach((a, i) => {
  console.log(`\n--- Análisis ${i+1} ---`);
  console.log('ID:', a.id);
  console.log('VideoID:', a.videoId);
  console.log('Status:', a.status);
  console.log('Overall Score:', a.overallScore);
  console.log('Hook Score:', a.hookScore);
  console.log('Pacing Score:', a.pacingScore);
  console.log('Engagement Score:', a.engagementScore);
  console.log('Error Message:', a.errorMessage);
  console.log('Created:', a.createdAt);
  console.log('Hook Analysis (primeros 200 chars):', a.hookAnalysis?.substring(0, 200));
});
process.exit(0);
