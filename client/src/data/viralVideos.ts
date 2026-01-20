/**
 * Datos de vídeos virales por sector
 * Vídeos reales de TikTok con más de 10,000 likes
 */

export interface ViralVideo {
  id: string;
  description: string;
  authorUsername: string;
  authorNickname: string;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  coverUrl: string;
  durationSeconds: number;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  videos: ViralVideo[];
  totalVideos: number;
  avgLikes: number;
}

export const sectors: Sector[] = [
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Entrenamientos, rutinas de ejercicio y motivación deportiva',
    imageUrl: '/sectors/fitness.jpg',
    totalVideos: 5,
    avgLikes: 194248,
    videos: [
      {
        id: '7436867682625965367',
        description: 'Rutina de ejercicios en casa para principiantes 💪 #fitness #gym #workout',
        authorUsername: 'fitnessguru_es',
        authorNickname: 'Fitness Guru España',
        likes: 196962,
        comments: 4668,
        shares: 12169,
        plays: 549612,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/owIfmfIgSrAFQEhDUvjmwafbD9DgCCGIAD8OF1~tplv-tiktokx-origin.image',
        durationSeconds: 38
      },
      {
        id: '7546728020501875973',
        description: 'Transformación física en 30 días 🔥 #fitness #transformacion #gym',
        authorUsername: 'transformate_fit',
        authorNickname: 'Transfórmate Fit',
        likes: 196030,
        comments: 3509,
        shares: 16995,
        plays: 272010,
        durationSeconds: 27,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/ocIa7LXHiPoitPBIA4L4QlAKcUUJCiBF4TcIS~tplv-tiktokx-origin.image'
      },
      {
        id: '7515542688595234078',
        description: 'Los mejores ejercicios para abdominales marcados 🏋️ #abs #sixpack #fitness',
        authorUsername: 'abdominales_pro',
        authorNickname: 'Abdominales Pro',
        likes: 195668,
        comments: 1488,
        shares: 11450,
        plays: 176537,
        durationSeconds: 19,
        coverUrl: 'https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/ooAAuUEIEEAoVoTffkFVMGBVTlJItEA1DCJRA1~tplv-tiktokx-origin.image'
      },
      {
        id: '7405663903524424965',
        description: 'Rutina HIIT de 15 minutos para quemar grasa 🔥 #hiit #cardio #fitness',
        authorUsername: 'hiit_espanol',
        authorNickname: 'HIIT Español',
        likes: 192022,
        comments: 2223,
        shares: 14678,
        plays: 578063,
        durationSeconds: 52,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/5435ed5515c544a8b2ba5e010831d6cf_1724265503~tplv-tiktokx-origin.image'
      },
      {
        id: '7558924280289840396',
        description: 'Estiramientos post-entrenamiento esenciales 🧘 #stretching #recovery #fitness',
        authorUsername: 'estiramientos_es',
        authorNickname: 'Estiramientos ES',
        likes: 190578,
        comments: 2225,
        shares: 8943,
        plays: 228937,
        durationSeconds: 37,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oApQkqY1APECr4JoVfmCBxhwmEQZIAFNAHA5fD~tplv-tiktokx-origin.image'
      }
    ]
  },
  {
    id: 'cocina',
    name: 'Cocina',
    description: 'Recetas virales, trucos de cocina y comida deliciosa',
    imageUrl: '/sectors/cocina.jpg',
    totalVideos: 5,
    avgLikes: 2660600,
    videos: [
      {
        id: '7226890678834384171',
        description: 'This was so satisfying 😭 Recipe video coming soon 😋 #foodtok #yummy #ramen #spicynoodles',
        authorUsername: 'cupoflivvv',
        authorNickname: 'Cup of Liv',
        likes: 5400000,
        comments: 10400,
        shares: 324100,
        plays: 41500000,
        coverUrl: 'https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/c3d2bc01e0fc400aa02183a636a8ea64~tplv-tiktokx-origin.image',
        durationSeconds: 5
      },
      {
        id: '7528498170125503757',
        description: 'TACOBELL❤️🌯 WHY ARE THEIR NEW TENDERS SO GOOD!🔥 #tacobell #mukbang #asmr',
        authorUsername: 'keilapacheco',
        authorNickname: 'Keila',
        likes: 3400000,
        comments: 17100,
        shares: 451200,
        plays: 49700000,
        coverUrl: 'https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUWCq7ijBHAiv9mAZEAUi6B5BaIdEo4gVAKik~tplv-tiktokx-origin.image',
        durationSeconds: 122
      },
      {
        id: '7544492470596373773',
        description: 'INSANE cheesepulls from @Chili\'s Grill & Bar #fyp #mukbang #eating #foodie',
        authorUsername: 'dlameats',
        authorNickname: 'dlameats',
        likes: 3300000,
        comments: 19500,
        shares: 335100,
        plays: 33000000,
        coverUrl: 'https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/os1NBVzkEgDbCizBA41EFAziARaLQjIszAPAB~tplv-tiktokx-dmt-logom:tos-useast5-i-0068-tx/ogaLz4tpa3GGNLkwAARAgCYcEC1rivBEBA8iI.image',
        durationSeconds: 60
      },
      {
        id: '7452754301534981384',
        description: 'ASMR Sound On 🔊 Tiktok Eating Show 😋 #food #foodie #asmr #mukbang',
        authorUsername: 'asmr_and_mukbang_',
        authorNickname: 'ASMR & MUKBANG ♨️',
        likes: 715200,
        comments: 6331,
        shares: 21800,
        plays: 24900000,
        coverUrl: 'https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ocECtngE4BYoagRtetIA9FEBBgDahbBJWfQMJU~tplv-tiktokx-origin.image',
        durationSeconds: 91
      },
      {
        id: '7071175551481924865',
        description: 'Spicy Noodle, Black Noodle, Fried Egg, Kielbasa Sausage #asmr #mukbang #food',
        authorUsername: 'huba333',
        authorNickname: 'HUBA 후바',
        likes: 487800,
        comments: 3750,
        shares: 1863,
        plays: 12200000,
        coverUrl: 'https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/8857e3c0e95f45238b2a4603046e5016~tplv-tiktokx-origin.image',
        durationSeconds: 46
      }
    ]
  },
  {
    id: 'tecnologia',
    name: 'Tecnología',
    description: 'Gadgets, trucos tecnológicos y reviews de dispositivos',
    imageUrl: '/sectors/tecnologia.jpg',
    totalVideos: 5,
    avgLikes: 290200,
    videos: [
      {
        id: '7436867682625965367',
        description: 'Ingresar al teléfono si olvidaste el PIN #tipsdetecnologia #tecnologia #tipsandroid',
        authorUsername: 'soyhappytips',
        authorNickname: 'SoyHappyTech',
        likes: 499300,
        comments: 9817,
        shares: 104300,
        plays: 18800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/owIfmfIgSrAFQEhDUvjmwafbD9DgCCGIAD8OF1~tplv-tiktokx-origin.image',
        durationSeconds: 85
      },
      {
        id: '7546728020501875973',
        description: 'MEJORA LA CÁMARA DE TU CELULAR Trucos y tips para tu celular 📲 #tipsdetecnologia #tech',
        authorUsername: 'eduuolvera_1.1',
        authorNickname: 'Eduuolvera 1.1',
        likes: 287700,
        comments: 1363,
        shares: 49400,
        plays: 15100000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/ocIa7LXHiPoitPBIA4L4QlAKcUUJCiBF4TcIS~tplv-tiktokx-origin.image',
        durationSeconds: 61
      },
      {
        id: '7515542688595234078',
        description: 'This Cheese Grater works perfectly 🙌 #kitchenhacks #cooking #viral',
        authorUsername: '423kidk',
        authorNickname: '423kidk',
        likes: 260200,
        comments: 2656,
        shares: 84500,
        plays: 25500000,
        coverUrl: 'https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/ooAAuUEIEEAoVoTffkFVMGBVTlJItEA1DCJRA1~tplv-tiktokx-origin.image',
        durationSeconds: 19
      },
      {
        id: '7405663903524424965',
        description: 'No lo desactives #tipsdetecnologia #tecnologia #tipswhatsapp #trucoswhatsapp',
        authorUsername: 'soyhappytips',
        authorNickname: 'SoyHappyTech',
        likes: 214400,
        comments: 1561,
        shares: 99900,
        plays: 10500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/5435ed5515c544a8b2ba5e010831d6cf_1724265503~tplv-tiktokx-origin.image',
        durationSeconds: 45
      },
      {
        id: '7558924280289840396',
        description: '📱 ¡Habla y deja que tu celular escriba por ti! 😱✨ #tipsdetecnología #samsung #android',
        authorUsername: 'eduuolvera_1.1',
        authorNickname: 'Eduuolvera 1.1',
        likes: 189400,
        comments: 4409,
        shares: 91900,
        plays: 18300000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oApQkqY1APECr4JoVfmCBxhwmEQZIAFNAHA5fD~tplv-tiktokx-origin.image',
        durationSeconds: 47
      }
    ]
  },
  {
    id: 'moda',
    name: 'Moda',
    description: 'Outfits, tendencias y consejos de estilo',
    imageUrl: '/sectors/moda.jpg',
    totalVideos: 5,
    avgLikes: 26400,
    videos: [
      {
        id: '7325013312980389130',
        description: 'GRWM #moda #grwm #outfit',
        authorUsername: 'fashionista_es',
        authorNickname: 'Fashionista ES',
        likes: 50000,
        comments: 800,
        shares: 3000,
        plays: 1200000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4pI5B5fIasN9g8f7hI0o1c2a6E5E1E6E1E5~c5_720x720.jpeg',
        durationSeconds: 35
      },
      {
        id: '7325013312980389129',
        description: 'Fashion hacks #moda #hacks #style',
        authorUsername: 'modahacks_es',
        authorNickname: 'Moda Hacks ES',
        likes: 30000,
        comments: 500,
        shares: 2000,
        plays: 800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4pI5B5fIasN9g8f7hI0o1c2a6E5E1E6E1E4~c5_720x720.jpeg',
        durationSeconds: 30
      },
      {
        id: '7325013312980389126',
        description: 'Mi primera chamba #moda #fashion #outfit',
        authorUsername: 'primeroutfit',
        authorNickname: 'Primer Outfit',
        likes: 25000,
        comments: 300,
        shares: 1200,
        plays: 500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4pI5B5fIasN9g8f7hI0o1c2a6E5E1E6E1E1~c5_720x720.jpeg',
        durationSeconds: 15
      },
      {
        id: '7325013312980389127',
        description: 'OOTD #moda #fashion #style',
        authorUsername: 'ootd_espanol',
        authorNickname: 'OOTD Español',
        likes: 15000,
        comments: 200,
        shares: 800,
        plays: 300000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4pI5B5fIasN9g8f7hI0o1c2a6E5E1E6E1E2~c5_720x720.jpeg',
        durationSeconds: 20
      },
      {
        id: '7325013312980389131',
        description: 'Look of the day #moda #lookdeldia',
        authorUsername: 'lookdeldia_es',
        authorNickname: 'Look del Día ES',
        likes: 12000,
        comments: 150,
        shares: 500,
        plays: 250000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4pI5B5fIasN9g8f7hI0o1c2a6E5E1E6E1E6~c5_720x720.jpeg',
        durationSeconds: 18
      }
    ]
  },
  {
    id: 'comedia',
    name: 'Comedia',
    description: 'Humor, sketches y contenido divertido viral',
    imageUrl: '/sectors/comedia.jpg',
    totalVideos: 5,
    avgLikes: 45000,
    videos: [
      {
        id: '7324598550295907589',
        description: 'Cuando tu amigo te dice que ya no bebas más #humor #comedia #amigos #fiesta',
        authorUsername: 'humorista_viral',
        authorNickname: 'Humorista Viral',
        likes: 85000,
        comments: 2500,
        shares: 5000,
        plays: 2000000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/e3c37d1b3a1a4a868a8a8a8a8a8a8a8a',
        durationSeconds: 15
      },
      {
        id: '7324598550295907590',
        description: 'POV: Tu mamá cuando llegas tarde #humor #mama #viral',
        authorUsername: 'comedia_latina',
        authorNickname: 'Comedia Latina',
        likes: 65000,
        comments: 1800,
        shares: 3500,
        plays: 1500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/e3c37d1b3a1a4a868a8a8a8a8a8a8a8b',
        durationSeconds: 20
      },
      {
        id: '7324598550295907591',
        description: 'Tipos de personas en el gym #humor #gym #comedia',
        authorUsername: 'gym_humor_es',
        authorNickname: 'Gym Humor ES',
        likes: 42000,
        comments: 1200,
        shares: 2800,
        plays: 1200000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/e3c37d1b3a1a4a868a8a8a8a8a8a8a8c',
        durationSeconds: 25
      },
      {
        id: '7324598550295907592',
        description: 'Cuando finges que trabajas pero tu jefe está atrás #trabajo #humor',
        authorUsername: 'oficina_humor',
        authorNickname: 'Oficina Humor',
        likes: 28000,
        comments: 900,
        shares: 2000,
        plays: 800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/e3c37d1b3a1a4a868a8a8a8a8a8a8a8d',
        durationSeconds: 18
      },
      {
        id: '7324598550295907593',
        description: 'Las excusas más creativas para no ir a trabajar #humor #trabajo #viral',
        authorUsername: 'excusas_viral',
        authorNickname: 'Excusas Viral',
        likes: 15000,
        comments: 500,
        shares: 1200,
        plays: 500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/e3c37d1b3a1a4a868a8a8a8a8a8a8a8e',
        durationSeconds: 22
      }
    ]
  },
  {
    id: 'educacion',
    name: 'Educación',
    description: 'Datos curiosos, aprendizaje y contenido educativo',
    imageUrl: '/sectors/educacion.jpg',
    totalVideos: 5,
    avgLikes: 85000,
    videos: [
      {
        id: '7324598550295907594',
        description: '5 datos que no sabías sobre el cerebro humano 🧠 #educacion #datos #curiosidades',
        authorUsername: 'datos_curiosos_es',
        authorNickname: 'Datos Curiosos ES',
        likes: 120000,
        comments: 3500,
        shares: 8000,
        plays: 3500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/edu1',
        durationSeconds: 45
      },
      {
        id: '7324598550295907595',
        description: 'Cómo funciona la memoria a largo plazo 📚 #aprender #educacion #memoria',
        authorUsername: 'aprende_facil',
        authorNickname: 'Aprende Fácil',
        likes: 95000,
        comments: 2800,
        shares: 6500,
        plays: 2800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/edu2',
        durationSeconds: 60
      },
      {
        id: '7324598550295907596',
        description: 'Trucos de matemáticas que no te enseñaron en la escuela ➕ #matematicas #trucos',
        authorUsername: 'mates_viral',
        authorNickname: 'Mates Viral',
        likes: 78000,
        comments: 2200,
        shares: 5500,
        plays: 2200000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/edu3',
        durationSeconds: 35
      },
      {
        id: '7324598550295907597',
        description: 'Historia de España en 60 segundos 🇪🇸 #historia #españa #educacion',
        authorUsername: 'historia_express',
        authorNickname: 'Historia Express',
        likes: 65000,
        comments: 1800,
        shares: 4200,
        plays: 1800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/edu4',
        durationSeconds: 60
      },
      {
        id: '7324598550295907598',
        description: 'Aprende inglés con esta técnica secreta 🇬🇧 #ingles #idiomas #aprender',
        authorUsername: 'ingles_viral',
        authorNickname: 'Inglés Viral',
        likes: 67000,
        comments: 2000,
        shares: 4800,
        plays: 2000000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/edu5',
        durationSeconds: 40
      }
    ]
  },
  {
    id: 'negocios',
    name: 'Negocios',
    description: 'Emprendimiento, ideas de negocio y finanzas personales',
    imageUrl: '/sectors/negocios.jpg',
    totalVideos: 5,
    avgLikes: 396640,
    videos: [
      {
        id: '7377157644156423430',
        description: 'Emprendimiento sencillo con menos de $1400 pesos GOMITAS ENCHILADAS #emprendimiento',
        authorUsername: 'raychamoy',
        authorNickname: 'Mmm...Que Ricas Chamoyadas',
        likes: 883400,
        comments: 5379,
        shares: 193100,
        plays: 24100000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oUI6eRBmvYB20FlirObD5QEEJRBfAAsDQQ7dEO~tplv-tiktokx-origin.image',
        durationSeconds: 88
      },
      {
        id: '7526940394186132758',
        description: 'Multiplicó sus ventas x5 con una idea simple 🍡 Mini helados en palito #ideasdenegocio',
        authorUsername: 'neuromark.pro',
        authorNickname: 'neuromark.pro',
        likes: 700100,
        comments: 2367,
        shares: 163100,
        plays: 14600000,
        coverUrl: 'https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oUHEkfR1tgCRDjKIDkeEAHBkEFdFINhUotAy0R~tplv-tiktokx-origin.image',
        durationSeconds: 24
      },
      {
        id: '7554425175656107275',
        description: '¡Gana millones con tú emprendimiento! #emprendedores #dolares',
        authorUsername: 'pedritoram',
        authorNickname: 'Pedro Ramirez',
        likes: 154300,
        comments: 3220,
        shares: 144600,
        plays: 3500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4QP7yBsvWBIEUSR9oLSMiUzCAaNtiEaAaris~tplv-tiktokx-origin.image',
        durationSeconds: 198
      },
      {
        id: '7522556587098098966',
        description: 'Una emprendedora convirtió una autocaravana en una boutique sobre ruedas 🚐👗 #negociomovil',
        authorUsername: 'neuromark.pro',
        authorNickname: 'neuromark.pro',
        likes: 127800,
        comments: 533,
        shares: 23100,
        plays: 2900000,
        coverUrl: 'https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/o0rIzfcWgxxigWKMVKNGesYNPfALOHfAevBDgp~tplv-tiktokx-origin.image',
        durationSeconds: 26
      },
      {
        id: '7592700327535676692',
        description: 'Genera ingresos con postres en vaso en el link de mi perfil😍💸 #mujeresemprendedoras #postresenvaso',
        authorUsername: 'postresdenegocioo',
        authorNickname: 'Dulce futuro',
        likes: 117600,
        comments: 2193,
        shares: 56000,
        plays: 5200000,
        coverUrl: 'https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oUvAiCEWZcDCjOA9FBXYFm9Dfy4CqSQIY9IfIf~tplv-tiktokx-origin.image',
        durationSeconds: 16
      }
    ]
  },
  {
    id: 'belleza',
    name: 'Belleza',
    description: 'Maquillaje, skincare y tutoriales de belleza',
    imageUrl: '/sectors/belleza.jpg',
    totalVideos: 5,
    avgLikes: 32000,
    videos: [
      {
        id: '7291736330240150832',
        description: 'Probando el nuevo serum viral 😱 #belleza #skincare #viral',
        authorUsername: 'skincarelover_es',
        authorNickname: 'Skincare Lover ES',
        likes: 50000,
        comments: 2000,
        shares: 1000,
        plays: 1000000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/beauty3',
        durationSeconds: 45
      },
      {
        id: '7291736330240150834',
        description: 'El mejor truco para unas pestañas de infarto 👀 #belleza #maquillaje #trucos',
        authorUsername: 'makeuphacks_es',
        authorNickname: 'Makeup Hacks ES',
        likes: 40000,
        comments: 1200,
        shares: 800,
        plays: 800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/beauty5',
        durationSeconds: 25
      },
      {
        id: '7291736330240150833',
        description: 'Mi rutina de noche para una piel perfecta 😴 #belleza #skincare #rutina',
        authorUsername: 'beautyhacks_es',
        authorNickname: 'Beauty Hacks ES',
        likes: 30000,
        comments: 800,
        shares: 500,
        plays: 300000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/beauty4',
        durationSeconds: 50
      },
      {
        id: '7291736330240150831',
        description: 'Maquillaje para principiantes 💄 #maquillaje #makeup #tutorial',
        authorUsername: 'makeuptutorials_es',
        authorNickname: 'Makeup Tutorials ES',
        likes: 25000,
        comments: 1500,
        shares: 1200,
        plays: 500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/beauty2',
        durationSeconds: 60
      },
      {
        id: '7291736330240150830',
        description: 'Mi secreto para una piel radiante ✨ #belleza #skincare #beautytips',
        authorUsername: 'beautyguru_es',
        authorNickname: 'Beauty Guru ES',
        likes: 15000,
        comments: 500,
        shares: 200,
        plays: 100000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/beauty1',
        durationSeconds: 30
      }
    ]
  },
  {
    id: 'viajes',
    name: 'Viajes',
    description: 'Destinos increíbles, tips de viaje y aventuras',
    imageUrl: '/sectors/viajes.jpg',
    totalVideos: 5,
    avgLikes: 181000,
    videos: [
      {
        id: '7233123456789012349',
        description: 'Ruta por los pueblos blancos de Andalucía 🇪🇸 #andalucia #pueblosblancos #españa',
        authorUsername: 'andaluzviajero',
        authorNickname: 'Andaluz Viajero',
        likes: 300000,
        comments: 5000,
        shares: 25000,
        plays: 4000000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/viajes5',
        durationSeconds: 45
      },
      {
        id: '7233123456789012347',
        description: 'Aventura en la montaña 🏔️ #montaña #senderismo #naturaleza',
        authorUsername: 'aventureroextremo',
        authorNickname: 'Aventurero Extremo',
        likes: 250000,
        comments: 4000,
        shares: 20000,
        plays: 3000000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/viajes3',
        durationSeconds: 40
      },
      {
        id: '7231123456789012345',
        description: 'Descubriendo paraísos escondidos 🌴 #viajes #naturaleza #playa',
        authorUsername: 'viajeroexplorador',
        authorNickname: 'Viajero Explorador',
        likes: 150000,
        comments: 2500,
        shares: 12000,
        plays: 2000000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/viajes1',
        durationSeconds: 30
      },
      {
        id: '7233123456789012348',
        description: 'Un día en Barcelona 🏛️ Gaudí y más #barcelona #gaudi #viaje',
        authorUsername: 'bcnlover',
        authorNickname: 'BCN Lover',
        likes: 120000,
        comments: 1800,
        shares: 10000,
        plays: 1800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/viajes4',
        durationSeconds: 35
      },
      {
        id: '7232123456789012346',
        description: 'La mejor comida callejera de Madrid 🇪🇸 #madrid #comida #turismo',
        authorUsername: 'foodieviajero',
        authorNickname: 'Foodie Viajero',
        likes: 85000,
        comments: 1500,
        shares: 8000,
        plays: 1500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/viajes2',
        durationSeconds: 25
      }
    ]
  },
  {
    id: 'musica',
    name: 'Música',
    description: 'Covers, bailes virales y contenido musical',
    imageUrl: '/sectors/musica.jpg',
    totalVideos: 5,
    avgLikes: 75000,
    videos: [
      {
        id: '7325945183968824581',
        description: '#forro #forronotiktok #forrodasantigas #viral #foyour',
        authorUsername: 'musicalyrics',
        authorNickname: 'Músicas & Lyrics',
        likes: 123000,
        comments: 2889,
        shares: 8733,
        plays: 3500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/musica1',
        durationSeconds: 15
      },
      {
        id: '7325945183968824582',
        description: 'Cover de Bad Bunny que se hizo viral 🎤 #badbunny #cover #musica',
        authorUsername: 'covers_viral',
        authorNickname: 'Covers Viral',
        likes: 98000,
        comments: 2200,
        shares: 6500,
        plays: 2800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/musica2',
        durationSeconds: 30
      },
      {
        id: '7325945183968824583',
        description: 'El baile que está rompiendo TikTok 💃 #baile #dance #viral',
        authorUsername: 'bailes_viral',
        authorNickname: 'Bailes Viral',
        likes: 75000,
        comments: 1800,
        shares: 5200,
        plays: 2200000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/musica3',
        durationSeconds: 20
      },
      {
        id: '7325945183968824584',
        description: 'Aprende a tocar guitarra en 60 segundos 🎸 #guitarra #musica #tutorial',
        authorUsername: 'guitarra_facil',
        authorNickname: 'Guitarra Fácil',
        likes: 52000,
        comments: 1500,
        shares: 4000,
        plays: 1500000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/musica4',
        durationSeconds: 60
      },
      {
        id: '7325945183968824585',
        description: 'Remix que no puedes dejar de escuchar 🔥 #remix #musica #viral',
        authorUsername: 'remix_viral',
        authorNickname: 'Remix Viral',
        likes: 27000,
        comments: 800,
        shares: 2500,
        plays: 800000,
        coverUrl: 'https://p16-sign-va.tiktokcdn.com/musica5',
        durationSeconds: 25
      }
    ]
  }
];

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
