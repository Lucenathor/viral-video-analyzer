import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const sectors = [
  {
    name: "Restaurantes y Hostelería",
    slug: "restaurantes",
    description: "Reels virales para restaurantes, bares, cafeterías y negocios de hostelería",
    imageUrl: "/sectors/restaurantes.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Fitness y Entrenadores",
    slug: "fitness",
    description: "Contenido viral para gimnasios, entrenadores personales y centros deportivos",
    imageUrl: "/sectors/fitness.png",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Peluquerías y Estética",
    slug: "peluqueria",
    description: "Reels virales para salones de belleza, peluquerías y centros de estética",
    imageUrl: "/sectors/peluqueria.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Abogados y Asesorías",
    slug: "abogados",
    description: "Contenido viral para despachos de abogados, asesorías y consultorías legales",
    imageUrl: "/sectors/abogados.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Inmobiliarias",
    slug: "inmobiliarias",
    description: "Reels virales para agencias inmobiliarias y agentes de bienes raíces",
    imageUrl: "/sectors/inmobiliarias.jpeg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Coaches y Consultores",
    slug: "coaches",
    description: "Contenido viral para coaches de vida, negocios y consultores empresariales",
    imageUrl: "/sectors/coaches.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Tiendas de Moda",
    slug: "moda",
    description: "Reels virales para boutiques, tiendas de ropa y negocios de moda",
    imageUrl: "/sectors/moda.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Clínicas Dentales",
    slug: "dental",
    description: "Contenido viral para dentistas, clínicas dentales y ortodoncistas",
    imageUrl: "/sectors/dental.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Fotografía y Videografía",
    slug: "fotografia",
    description: "Reels virales para fotógrafos, videógrafos y estudios creativos",
    imageUrl: "/sectors/fotografia.jpg",
    reelsCount: 0,
    isActive: true
  },
  {
    name: "Academias y Formación",
    slug: "academias",
    description: "Contenido viral para academias, centros de formación y cursos online",
    imageUrl: "/sectors/academias.jpg",
    reelsCount: 0,
    isActive: true
  }
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seeding sectors...");

  for (const sector of sectors) {
    try {
      await connection.execute(
        `INSERT INTO sectors (name, slug, description, imageUrl, reelsCount, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), imageUrl = VALUES(imageUrl)`,
        [sector.name, sector.slug, sector.description, sector.imageUrl, sector.reelsCount, sector.isActive]
      );
      console.log(`✓ Sector "${sector.name}" created/updated`);
    } catch (error) {
      console.error(`✗ Error with sector "${sector.name}":`, error.message);
    }
  }

  await connection.end();
  console.log("Seeding complete!");
}

seed().catch(console.error);
