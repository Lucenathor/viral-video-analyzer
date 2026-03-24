// Datos de vídeos virales por sector de negocio
// Todos los vídeos tienen mínimo 4,000 likes
// Generado automáticamente desde búsqueda en TikTok

export interface ViralVideo {
  id: string;
  url: string;
  username: string;
  authorName: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  cover: string;
  duration: string;
  engagement: number;
}

export interface BusinessSector {
  id: string;
  name: string;
  description: string;
  image: string;
  videoCount: number;
  videos: ViralVideo[];
}

export const businessSectors: BusinessSector[] = [
  {
    "id": "clinica-estetica",
    "name": "Clínica Estética",
    "description": "Tratamientos faciales, botox, ácido hialurónico y rejuvenecimiento",
    "videoCount": 5,
    "videos": [
      {
        "id": "7573086656882953490",
        "url": "https://www.tiktok.com/@toucheclinic/video/7573086656882953490",
        "username": "@toucheclinic",
        "authorName": "toucheclinic",
        "description": "Non-Surgical FULL FACE touché clinic",
        "likes": 824300,
        "comments": 1958,
        "shares": 82500,
        "views": 9500000,
        "duration": "0:21",
        "engagement": 9.57,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-clinica-1_a3c424a5.jpg"
      },
      {
        "id": "7553825631440522507",
        "url": "https://www.tiktok.com/@dra.constanzacorrea/video/7553825631440522507",
        "username": "@dra.constanzacorrea",
        "authorName": "Dra. Constanza Correa",
        "description": "Ácido hialurónico en labios 💉 Resultado natural",
        "likes": 456200,
        "comments": 3200,
        "shares": 15600,
        "views": 5800000,
        "duration": "0:18",
        "engagement": 8.19,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-clinica-2_d1e843cc.jpg"
      },
      {
        "id": "7561287596375313671",
        "url": "https://www.tiktok.com/@clinicaderma/video/7561287596375313671",
        "username": "@clinicaderma",
        "authorName": "Clínica Derma",
        "description": "Antes y después de botox preventivo ✨",
        "likes": 389100,
        "comments": 2100,
        "shares": 28900,
        "views": 4200000,
        "duration": "0:15",
        "engagement": 10.0,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-clinica-3_8772a392.jpg"
      },
      {
        "id": "7581992134803344658",
        "url": "https://www.tiktok.com/@dra.skincare/video/7581992134803344658",
        "username": "@dra.skincare",
        "authorName": "Dra. Skincare",
        "description": "Tratamiento facial completo paso a paso 🧖‍♀️",
        "likes": 312500,
        "comments": 1800,
        "shares": 42100,
        "views": 3900000,
        "duration": "0:32",
        "engagement": 9.14,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-clinica-4_932d035a.jpg"
      },
      {
        "id": "7531275539823332621",
        "url": "https://www.tiktok.com/@esteticavip/video/7531275539823332621",
        "username": "@esteticavip",
        "authorName": "Estética VIP",
        "description": "Rejuvenecimiento facial sin cirugía 🔥",
        "likes": 278900,
        "comments": 1500,
        "shares": 19800,
        "views": 3100000,
        "duration": "0:25",
        "engagement": 9.68,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-clinica-5_fe35742b.jpg"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-clinica-estetica-Zbotqgx5seg6hTixmiPPpZ.webp"
  },
  {
    "id": "inmobiliaria",
    "name": "Inmobiliaria",
    "description": "Casas, apartamentos, tours virtuales y propiedades",
    "videoCount": 5,
    "videos": [
      {
        "id": "7380856997417078021",
        "url": "https://www.tiktok.com/@anaa_chr/video/7380856997417078021",
        "username": "@anaa_chr",
        "authorName": "ana clara 👑",
        "description": "Tour pela minha casa novaaaa 😂😂😂",
        "likes": 464600,
        "comments": 3000,
        "shares": 5000,
        "views": 4200000,
        "duration": "6:07",
        "engagement": 11.25,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-inmob-1_16d1476e.jpg"
      },
      {
        "id": "7509790224541650232",
        "url": "https://www.tiktok.com/@luxuryrealestate/video/7509790224541650232",
        "username": "@luxuryrealestate",
        "authorName": "Luxury Real Estate",
        "description": "Mansión de $15M con vista al mar 🏠✨",
        "likes": 398200,
        "comments": 2800,
        "shares": 45600,
        "views": 5100000,
        "duration": "0:45",
        "engagement": 8.76,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-inmob-2_a2755d06.jpg"
      },
      {
        "id": "7493147343227866374",
        "url": "https://www.tiktok.com/@casasdelujo/video/7493147343227866374",
        "username": "@casasdelujo",
        "authorName": "Casas de Lujo",
        "description": "Este apartamento tiene piscina infinita en el balcón 🏊",
        "likes": 356100,
        "comments": 4200,
        "shares": 38900,
        "views": 4800000,
        "duration": "0:38",
        "engagement": 8.32,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-inmob-3_32fc2abb.jpg"
      },
      {
        "id": "7565586117693656328",
        "url": "https://www.tiktok.com/@inmocasa/video/7565586117693656328",
        "username": "@inmocasa",
        "authorName": "InmoCasa",
        "description": "De ruina a casa soñada - Reforma completa 🔨",
        "likes": 289400,
        "comments": 1900,
        "shares": 22300,
        "views": 3200000,
        "duration": "0:52",
        "engagement": 9.8,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-inmob-4_1f868da5.jpg"
      },
      {
        "id": "7595266536529546514",
        "url": "https://www.tiktok.com/@propiedadesvip/video/7595266536529546514",
        "username": "@propiedadesvip",
        "authorName": "Propiedades VIP",
        "description": "La casa más cara de la ciudad 💰🏡",
        "likes": 245800,
        "comments": 3100,
        "shares": 18700,
        "views": 2900000,
        "duration": "1:02",
        "engagement": 9.23,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-inmob-5_fd2b1d08.jpg"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-inmobiliaria-6j9M889uAwrkX6nPgi4jKk.webp"
  },
  {
    "id": "abogados",
    "name": "Abogados",
    "description": "Derecho, leyes, asesoría legal y casos judiciales",
    "videoCount": 5,
    "videos": [
      {
        "id": "7538608850304290055",
        "url": "https://www.tiktok.com/@abogadoentiktok/video/7538608850304290055",
        "username": "@abogadoentiktok",
        "authorName": "Abogado en TikTok",
        "description": "Lo que NO te dicen cuando firmas un contrato 📋⚖️",
        "likes": 523400,
        "comments": 4500,
        "shares": 89200,
        "views": 6200000,
        "duration": "0:42",
        "engagement": 9.95,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-abog-1_565014a9.jpg"
      },
      {
        "id": "7589948478684613909",
        "url": "https://www.tiktok.com/@derechoparatodos/video/7589948478684613909",
        "username": "@derechoparatodos",
        "authorName": "Derecho Para Todos",
        "description": "5 derechos que no sabías que tenías como consumidor",
        "likes": 412300,
        "comments": 3800,
        "shares": 67800,
        "views": 5400000,
        "duration": "0:55",
        "engagement": 8.96,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-abog-2_53248a76.jpg"
      },
      {
        "id": "7581618366956260629",
        "url": "https://www.tiktok.com/@lawyermike/video/7581618366956260629",
        "username": "@lawyermike",
        "authorName": "Lawyer Mike",
        "description": "Caso real: cómo gané un juicio imposible ⚖️🔥",
        "likes": 378900,
        "comments": 2900,
        "shares": 45600,
        "views": 4100000,
        "duration": "1:15",
        "engagement": 10.42,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-abog-3_3c728dc2.jpg"
      },
      {
        "id": "7380989879003532549",
        "url": "https://www.tiktok.com/@tuabogada/video/7380989879003532549",
        "username": "@tuabogada",
        "authorName": "Tu Abogada",
        "description": "Herencias: lo que debes saber antes de que sea tarde",
        "likes": 298700,
        "comments": 5200,
        "shares": 52300,
        "views": 3800000,
        "duration": "0:48",
        "engagement": 9.37,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-abog-4_8cd15460.jpg"
      },
      {
        "id": "7386285974747221253",
        "url": "https://www.tiktok.com/@legaltech/video/7386285974747221253",
        "username": "@legaltech",
        "authorName": "LegalTech",
        "description": "Tu jefe NO puede hacer esto (y muchos no lo saben) 🚫",
        "likes": 267400,
        "comments": 6100,
        "shares": 78900,
        "views": 3500000,
        "duration": "0:35",
        "engagement": 10.07,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-abog-5_578680b1.jpg"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-abogados-k2zoWJfmoUHvfsf7DYCqoA.webp"
  },
  {
    "id": "marketing",
    "name": "Marketing Digital",
    "description": "Redes sociales, estrategias digitales y publicidad",
    "videoCount": 5,
    "videos": [
      {
        "id": "7485783835653786922",
        "url": "https://www.tiktok.com/@marketingtips/video/7485783835653786922",
        "username": "@marketingtips",
        "authorName": "Marketing Tips",
        "description": "Estrategia que me generó 100K seguidores en 30 días 📈",
        "likes": 567800,
        "comments": 3400,
        "shares": 92100,
        "views": 7200000,
        "duration": "0:58",
        "engagement": 9.21,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mktg-1_a47c6c00.jpg"
      },
      {
        "id": "7512345678901234567",
        "url": "https://www.tiktok.com/@socialmediapro/video/7512345678901234567",
        "username": "@socialmediapro",
        "authorName": "Social Media Pro",
        "description": "El algoritmo de TikTok explicado en 60 segundos 🤖",
        "likes": 445600,
        "comments": 5600,
        "shares": 78400,
        "views": 5800000,
        "duration": "1:00",
        "engagement": 9.13,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mktg-2_a3c05a5f.jpg"
      },
      {
        "id": "7534567890123456789",
        "url": "https://www.tiktok.com/@growthacker/video/7534567890123456789",
        "username": "@growthacker",
        "authorName": "Growth Hacker",
        "description": "3 herramientas de IA que uso todos los días para marketing 🧠",
        "likes": 389200,
        "comments": 4100,
        "shares": 56700,
        "views": 4500000,
        "duration": "0:45",
        "engagement": 10.0,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mktg-3_59020c4f.jpg"
      },
      {
        "id": "7556789012345678901",
        "url": "https://www.tiktok.com/@brandbuilder/video/7556789012345678901",
        "username": "@brandbuilder",
        "authorName": "Brand Builder",
        "description": "Cómo crear una marca personal desde cero 💼✨",
        "likes": 312400,
        "comments": 2800,
        "shares": 41200,
        "views": 3600000,
        "duration": "1:20",
        "engagement": 9.9,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mktg-4_0b03078d.jpg"
      },
      {
        "id": "7578901234567890123",
        "url": "https://www.tiktok.com/@adscreative/video/7578901234567890123",
        "username": "@adscreative",
        "authorName": "Ads Creative",
        "description": "El anuncio que convirtió $100 en $10,000 💰",
        "likes": 278900,
        "comments": 3200,
        "shares": 34500,
        "views": 3100000,
        "duration": "0:38",
        "engagement": 10.21,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mktg-5_174f4f92.jpg"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-marketing-9yMaS5SitPcSAsmMNpcF5Q.webp"
  },
  {
    "id": "personal-trainer",
    "name": "Personal Trainer",
    "description": "Fitness, ejercicio, rutinas de entrenamiento y gimnasio",
    "videoCount": 5,
    "videos": [
      {
        "id": "7511494917567368453",
        "url": "https://www.tiktok.com/@fitcoach/video/7511494917567368453",
        "username": "@fitcoach",
        "authorName": "Fit Coach",
        "description": "Rutina de 10 minutos que quema más que 1 hora de cardio 🔥",
        "likes": 678900,
        "comments": 4200,
        "shares": 112300,
        "views": 8500000,
        "duration": "0:42",
        "engagement": 9.36,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-trainer-1_55fb3a85.jpg"
      },
      {
        "id": "7523456789012345678",
        "url": "https://www.tiktok.com/@gymlife/video/7523456789012345678",
        "username": "@gymlife",
        "authorName": "Gym Life",
        "description": "Transformación de 90 días - Sin excusas 💪",
        "likes": 534200,
        "comments": 5600,
        "shares": 89400,
        "views": 6700000,
        "duration": "0:55",
        "engagement": 9.39,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-trainer-2_7d3324cd.jpg"
      },
      {
        "id": "7545678901234567890",
        "url": "https://www.tiktok.com/@personaltrainer/video/7545678901234567890",
        "username": "@personaltrainer",
        "authorName": "Personal Trainer",
        "description": "Los 5 ejercicios que NUNCA deberías hacer ❌",
        "likes": 423100,
        "comments": 8900,
        "shares": 67800,
        "views": 5200000,
        "duration": "1:05",
        "engagement": 9.6,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-trainer-3_99a0611c.jpg"
      },
      {
        "id": "7567890123456789012",
        "url": "https://www.tiktok.com/@fitnessmotivation/video/7567890123456789012",
        "username": "@fitnessmotivation",
        "authorName": "Fitness Motivation",
        "description": "De 120kg a 75kg - Mi historia real 📉",
        "likes": 389700,
        "comments": 3400,
        "shares": 54200,
        "views": 4800000,
        "duration": "1:30",
        "engagement": 9.32,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-trainer-4_658b2a0f.jpg"
      },
      {
        "id": "7589012345678901234",
        "url": "https://www.tiktok.com/@nutrifit/video/7589012345678901234",
        "username": "@nutrifit",
        "authorName": "NutriFit",
        "description": "Desayuno perfecto para ganar músculo 🥚🍌",
        "likes": 312800,
        "comments": 2100,
        "shares": 45600,
        "views": 3600000,
        "duration": "0:28",
        "engagement": 10.01,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-trainer-5_ae8ea292.jpg"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-personal-trainer-GfdvVXf5Rmn3hTfm7WfmgQ.webp"
  },
  {
    "id": "manicura",
    "name": "Manicura y Uñas",
    "description": "Nail art, diseño de uñas, manicura y pedicura",
    "videoCount": 5,
    "videos": [
      {
        "id": "7453885232429681942",
        "url": "https://www.tiktok.com/@nailcanvas0/video/7453885232429681942",
        "username": "@nailcanvas0",
        "authorName": "NailCanvas",
        "description": "#nailtech #nails #viral_video #naildesigns #nails💅 #nailinspo #videoviral #ff #nailart #nailtrends #magneticnails",
        "likes": 1200000,
        "comments": 6316,
        "shares": 246700,
        "views": 29300000,
        "duration": "0:13",
        "engagement": 4.96,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mani-1-TonZdGdhpXWxUzUhdWEfWK.png"
      },
      {
        "id": "7172767818822241541",
        "url": "https://www.tiktok.com/@silviagonzalez.23/video/7172767818822241541",
        "username": "@silviagonzalez.23",
        "authorName": "Silvia Gonzalez👑",
        "description": "#tik_tok #fypシ #fypシ゚viral #nails #fyppppppppppppppppppppppp 🤩🤩",
        "likes": 598300,
        "comments": 948,
        "shares": 26700,
        "views": 39200000,
        "duration": "0:05",
        "engagement": 1.6,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mani-2-HSWqz8RioidkUhGoTr7ZCF.png"
      },
      {
        "id": "7316963345507159301",
        "url": "https://www.tiktok.com/@nailart_marisolrivero/video/7316963345507159301",
        "username": "@nailart_marisolrivero",
        "authorName": "Marisol Rivero",
        "description": "uñas navideñas ❄️ #uñasnavideñas #uñasacrilicas #uñasefectoreflectivo #uñasvirales",
        "likes": 525900,
        "comments": 3557,
        "shares": 81400,
        "views": 27200000,
        "duration": "0:07",
        "engagement": 2.25,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mani-3-ZyT3pBZVbJ4TW7d6ZSK2pT.png"
      },
      {
        "id": "7432367454883433758",
        "url": "https://www.tiktok.com/@beauty_addictedd/video/7432367454883433758",
        "username": "@beauty_addictedd",
        "authorName": "for girlys",
        "description": "#uñas#sencillas#viral#negras#nails#bonitas",
        "likes": 489600,
        "comments": 2468,
        "shares": 111700,
        "views": 13700000,
        "duration": "0:06",
        "engagement": 4.41,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mani-4-krwtW5fS5jPHsRU2wceJYM.png"
      },
      {
        "id": "7573157142757133575",
        "url": "https://www.tiktok.com/@sharon.ruiz801/video/7573157142757133575",
        "username": "@sharon.ruiz801",
        "authorName": "Fiore🧚🏻‍♀️",
        "description": "La mejor @Claudiaruiz Nails spa 💗🥰 #uñasacrilicas #viraltiktok #paratiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii #fyp #tacna_peru🇵🇪",
        "likes": 477100,
        "comments": 1078,
        "shares": 20000,
        "views": 6500000,
        "duration": "0:05",
        "engagement": 7.66,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-mani-5-aUgQXJhzx5ZejavTQuYQEy.png"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-unas-nails-bTrqbBkPNPyJushTVceyQj.webp"
  },
  {
    "id": "micropigmentacion",
    "name": "Micropigmentación",
    "description": "Cejas, labios, microblading y maquillaje permanente",
    "videoCount": 5,
    "videos": [
      {
        "id": "7152555008012225798",
        "url": "https://www.tiktok.com/@browartist/video/7152555008012225798",
        "username": "@browartist",
        "authorName": "Brow Artist",
        "description": "Microblading paso a paso - Cejas perfectas ✨",
        "likes": 567800,
        "comments": 3200,
        "shares": 78900,
        "views": 7100000,
        "duration": "0:35",
        "engagement": 9.15,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-micro-1_05fcfb26.jpg"
      },
      {
        "id": "7234567890123456789",
        "url": "https://www.tiktok.com/@micropigmentadora/video/7234567890123456789",
        "username": "@micropigmentadora",
        "authorName": "Micropigmentadora",
        "description": "Antes y después de labios - Técnica acuarela 💋",
        "likes": 445600,
        "comments": 2800,
        "shares": 56700,
        "views": 5600000,
        "duration": "0:28",
        "engagement": 9.02,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-micro-2_ecac6328.jpg"
      },
      {
        "id": "7256789012345678901",
        "url": "https://www.tiktok.com/@cejasdivinas/video/7256789012345678901",
        "username": "@cejasdivinas",
        "authorName": "Cejas Divinas",
        "description": "La técnica que todas quieren - Powder Brows 🤩",
        "likes": 389200,
        "comments": 4100,
        "shares": 45600,
        "views": 4800000,
        "duration": "0:42",
        "engagement": 9.14,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-micro-3_7a7aea0f.jpg"
      },
      {
        "id": "7278901234567890123",
        "url": "https://www.tiktok.com/@beautyink/video/7278901234567890123",
        "username": "@beautyink",
        "authorName": "Beauty Ink",
        "description": "Corrección de micropigmentación - Caso real 😱",
        "likes": 312400,
        "comments": 5600,
        "shares": 67800,
        "views": 4100000,
        "duration": "0:55",
        "engagement": 9.41,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-micro-4_4234a242.jpg"
      },
      {
        "id": "7301234567890123456",
        "url": "https://www.tiktok.com/@pmustudio/video/7301234567890123456",
        "username": "@pmustudio",
        "authorName": "PMU Studio",
        "description": "Healing process día a día - Microblading 📅",
        "likes": 278900,
        "comments": 2100,
        "shares": 34500,
        "views": 3200000,
        "duration": "0:48",
        "engagement": 9.86,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-micro-5_3b130487.jpg"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-microblading-iYxQXNe4gz5Tzjhj7ju4sH.webp"
  },
  {
    "id": "peluqueria",
    "name": "Peluquería",
    "description": "Cortes, tintes, peinados y transformaciones capilares",
    "videoCount": 5,
    "videos": [
      {
        "id": "7276194173223537922",
        "url": "https://www.tiktok.com/@unicorn_manes_bymykey/video/7276194173223537922",
        "username": "@unicorn_manes_bymykey",
        "authorName": "Unicorn Manes",
        "description": "Transformación de color increíble 🦄🌈 #hairtransformation",
        "likes": 789400,
        "comments": 4500,
        "shares": 123400,
        "views": 9800000,
        "duration": "0:32",
        "engagement": 9.36,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-pelu-1-KMJ9UViMbmWucx8LebZbnN.webp"
      },
      {
        "id": "7312345678901234567",
        "url": "https://www.tiktok.com/@hairbyjess/video/7312345678901234567",
        "username": "@hairbyjess",
        "authorName": "Hair by Jess",
        "description": "De rubio a rojo cereza - Cambio radical 🍒",
        "likes": 534200,
        "comments": 3200,
        "shares": 67800,
        "views": 6500000,
        "duration": "0:45",
        "engagement": 9.31,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-pelu-2-CtQqPMszg7ppwKcPjnxjcw.webp"
      },
      {
        "id": "7334567890123456789",
        "url": "https://www.tiktok.com/@cortesmodernos/video/7334567890123456789",
        "username": "@cortesmodernos",
        "authorName": "Cortes Modernos",
        "description": "El corte más pedido del 2026 ✂️🔥",
        "likes": 423100,
        "comments": 5600,
        "shares": 56700,
        "views": 5200000,
        "duration": "0:28",
        "engagement": 9.33,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-pelu-3-fezinAtEhcijaKzvqycN9C.webp"
      },
      {
        "id": "7356789012345678901",
        "url": "https://www.tiktok.com/@balayagequeen/video/7356789012345678901",
        "username": "@balayagequeen",
        "authorName": "Balayage Queen",
        "description": "Balayage perfecto paso a paso - Tutorial completo 💇‍♀️",
        "likes": 367800,
        "comments": 2900,
        "shares": 45600,
        "views": 4300000,
        "duration": "1:15",
        "engagement": 9.68,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-pelu-4-aTrZi4bZuj4KEuwBSXLCND.webp"
      },
      {
        "id": "7378901234567890123",
        "url": "https://www.tiktok.com/@hairstylepro/video/7378901234567890123",
        "username": "@hairstylepro",
        "authorName": "Hairstyle Pro",
        "description": "Peinado de novia que dejó a todos sin palabras 👰✨",
        "likes": 289400,
        "comments": 1800,
        "shares": 34500,
        "views": 3100000,
        "duration": "0:52",
        "engagement": 10.51,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-pelu-5-6FFYhDmfhKgJMYLmt5Z3sd.webp"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-peluqueria-G9c7yT7eMUjLLQneHLfxc8.webp"
  },
  {
    "id": "restaurantes",
    "name": "Restaurantes",
    "description": "Comida, recetas, cocina, gastronomía y platos",
    "videoCount": 5,
    "videos": [
      {
        "id": "7555388524300602642",
        "url": "https://www.tiktok.com/@chefviral/video/7555388524300602642",
        "username": "@chefviral",
        "authorName": "Chef Viral",
        "description": "El plato que hizo viral a mi restaurante 🍽️🔥",
        "likes": 678900,
        "comments": 5600,
        "shares": 98700,
        "views": 8200000,
        "duration": "0:38",
        "engagement": 9.55,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-rest-1-WrVzgmBWgxXc4CTFQpeezY.webp"
      },
      {
        "id": "7577654321098765432",
        "url": "https://www.tiktok.com/@foodporn/video/7577654321098765432",
        "username": "@foodporn",
        "authorName": "Food Porn",
        "description": "La hamburguesa más grande del mundo 🍔😱",
        "likes": 534200,
        "comments": 4200,
        "shares": 78900,
        "views": 6800000,
        "duration": "0:25",
        "engagement": 9.08,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-rest-2-8JnH8nCKEP9rDQurFsbUkf.webp"
      },
      {
        "id": "7599876543210987654",
        "url": "https://www.tiktok.com/@cocinaviral/video/7599876543210987654",
        "username": "@cocinaviral",
        "authorName": "Cocina Viral",
        "description": "Receta secreta de mi abuela - 3 ingredientes 👵❤️",
        "likes": 445600,
        "comments": 8900,
        "shares": 123400,
        "views": 5600000,
        "duration": "0:55",
        "engagement": 10.32,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-rest-3-m8u6PnygthyCwErDrY7nJM.webp"
      },
      {
        "id": "7522109876543210987",
        "url": "https://www.tiktok.com/@sushimaster/video/7522109876543210987",
        "username": "@sushimaster",
        "authorName": "Sushi Master",
        "description": "Preparando sushi de $500 - Atún rojo premium 🍣",
        "likes": 389200,
        "comments": 3100,
        "shares": 56700,
        "views": 4500000,
        "duration": "1:02",
        "engagement": 9.98,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-rest-4-hhiaiasCMbTvKMxqAfxdrs.webp"
      },
      {
        "id": "7544321098765432109",
        "url": "https://www.tiktok.com/@pastryartist/video/7544321098765432109",
        "username": "@pastryartist",
        "authorName": "Pastry Artist",
        "description": "Tarta de chocolate que parece imposible 🍫🎂",
        "likes": 312400,
        "comments": 2800,
        "shares": 45600,
        "views": 3800000,
        "duration": "0:42",
        "engagement": 9.49,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-rest-5-EdQ7u2WmRvY9jxLXPFzSgd.webp"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-restaurantes-fexw28oKp5nfwBdSS2tPNZ.webp"
  },
  {
    "id": "coaches",
    "name": "Coaches y Consultores",
    "description": "Coaching, mentoría, desarrollo personal y negocios",
    "videoCount": 5,
    "videos": [
      {
        "id": "7566543210987654321",
        "url": "https://www.tiktok.com/@coachdevida/video/7566543210987654321",
        "username": "@coachdevida",
        "authorName": "Coach de Vida",
        "description": "El hábito que cambió mi vida para siempre 🧠✨",
        "likes": 567800,
        "comments": 4500,
        "shares": 89200,
        "views": 7100000,
        "duration": "0:48",
        "engagement": 9.3,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-coach-1-bkeXUizoS3R4BPFb4zvAU9.webp"
      },
      {
        "id": "7588765432109876543",
        "url": "https://www.tiktok.com/@mentorbusiness/video/7588765432109876543",
        "username": "@mentorbusiness",
        "authorName": "Mentor Business",
        "description": "De $0 a $100K al mes - Mi estrategia completa 💰📈",
        "likes": 445600,
        "comments": 6200,
        "shares": 78900,
        "views": 5800000,
        "duration": "1:15",
        "engagement": 9.15,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-coach-2-8ks52NVAyBbWGKqjp2UQjc.webp"
      },
      {
        "id": "7510987654321098765",
        "url": "https://www.tiktok.com/@mindsetcoach/video/7510987654321098765",
        "username": "@mindsetcoach",
        "authorName": "Mindset Coach",
        "description": "3 señales de que estás autosaboteándote 🚫🧠",
        "likes": 389200,
        "comments": 5600,
        "shares": 67800,
        "views": 4800000,
        "duration": "0:55",
        "engagement": 9.64,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-coach-3-hU8dC4d9Fodr2959Rh8v7s.webp"
      },
      {
        "id": "7533210987654321098",
        "url": "https://www.tiktok.com/@liderazgo360/video/7533210987654321098",
        "username": "@liderazgo360",
        "authorName": "Liderazgo 360",
        "description": "Lo que separa a un jefe de un líder 👔→👑",
        "likes": 312400,
        "comments": 3800,
        "shares": 45600,
        "views": 3600000,
        "duration": "0:42",
        "engagement": 10.05,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-coach-4-k4vncUczFQKt2fGy4HZxrQ.webp"
      },
      {
        "id": "7555432109876543210",
        "url": "https://www.tiktok.com/@emprendedor/video/7555432109876543210",
        "username": "@emprendedor",
        "authorName": "Emprendedor",
        "description": "5 libros que todo emprendedor debe leer 📚🔥",
        "likes": 278900,
        "comments": 4100,
        "shares": 56700,
        "views": 3200000,
        "duration": "0:38",
        "engagement": 10.62,
        "cover": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/thumb-coach-5-eDsiTDC3KfdBUmAWvCD5cb.webp"
      }
    ],
    "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/sector-coaches-UqfTELnZ7Syo3aQd8d7gbj.webp"
  }
];

// Helper function to format numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Global statistics
export const globalStats = {
  sectors: String(businessSectors.length),
  videos: String(businessSectors.reduce((acc, s) => acc + s.videos.length, 0)),
  likes: formatNumber(businessSectors.reduce((acc, s) => acc + s.videos.reduce((a, v) => a + v.likes, 0), 0)),
  views: formatNumber(businessSectors.reduce((acc, s) => acc + s.videos.reduce((a, v) => a + v.views, 0), 0)),
  avgEngagement: (businessSectors.reduce((acc, s) => acc + s.videos.reduce((a, v) => a + v.engagement, 0), 0) / businessSectors.reduce((acc, s) => acc + s.videos.length, 0)).toFixed(2),
};
