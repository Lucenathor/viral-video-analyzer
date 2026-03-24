import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Read the parsed JSON
const data = JSON.parse(fs.readFileSync('./client/src/data/inspirationSectors.json', 'utf-8'));

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}

const CATEGORY_META = {
  "Salud y Belleza": { icon: "💅", from: "#FF6B9D", to: "#C44569" },
  "Fitness y Deporte": { icon: "💪", from: "#4ECDC4", to: "#2C9E8F" },
  "Salud y Bienestar": { icon: "🧘", from: "#A8E6CF", to: "#56AB91" },
  "Gastronomía y Alimentación": { icon: "🍽️", from: "#FFD93D", to: "#F0A500" },
  "Inmobiliaria y Hogar": { icon: "🏠", from: "#6C5CE7", to: "#4834D4" },
  "Marketing y Negocios": { icon: "📈", from: "#00B4D8", to: "#0077B6" },
  "Moda y Accesorios": { icon: "👗", from: "#E056A0", to: "#B8336A" },
  "Eventos y Entretenimiento": { icon: "🎉", from: "#FF9A56", to: "#FF6348" },
  "Fotografía y Audiovisual": { icon: "📸", from: "#A29BFE", to: "#6C5CE7" },
  "Servicios Profesionales": { icon: "🔧", from: "#74B9FF", to: "#0984E3" },
  "Animales": { icon: "🐾", from: "#FDCB6E", to: "#E17055" },
  "Arte y Artesanía": { icon: "🎨", from: "#FD79A8", to: "#E84393" },
};

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log(`Seeding ${data.sectors.length} inspiration sectors...`);
  
  const usedSlugs = new Set();
  let success = 0;
  let errors = 0;
  
  for (const sector of data.sectors) {
    let slug = slugify(sector.name);
    if (usedSlugs.has(slug)) {
      slug = slug + '-' + Math.random().toString(36).substring(2, 6);
    }
    usedSlugs.add(slug);
    
    const meta = CATEGORY_META[sector.category] || CATEGORY_META["Servicios Profesionales"];
    
    try {
      await conn.execute(
        `INSERT INTO inspiration_sectors (name, slug, category, reelUrl, platform, categoryIcon, gradientFrom, gradientTo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE reelUrl = VALUES(reelUrl), category = VALUES(category)`,
        [
          sector.name,
          slug,
          sector.category,
          sector.url,
          sector.platform,
          meta.icon,
          meta.from,
          meta.to,
        ]
      );
      success++;
    } catch (err) {
      console.error(`  ✗ ${sector.name}: ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\n✓ ${success} sectors imported, ${errors} errors`);
  
  // Verify
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM inspiration_sectors');
  console.log(`Total in DB: ${rows[0].count}`);
  
  const [cats] = await conn.execute('SELECT category, COUNT(*) as count FROM inspiration_sectors GROUP BY category ORDER BY count DESC');
  console.log('\nBy category:');
  for (const cat of cats) {
    console.log(`  ${cat.category}: ${cat.count}`);
  }
  
  await conn.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
