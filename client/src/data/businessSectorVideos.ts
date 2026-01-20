// Datos de vídeos virales por sector de negocios
// Todos los vídeos tienen más de 10,000 likes y están en español

export interface ViralVideo {
  id: string;
  description: string;
  username: string;
  nickname: string;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  duration: number;
  url: string;
}

export interface BusinessSector {
  id: string;
  name: string;
  description: string;
  image: string;
  videos: ViralVideo[];
  totalLikes: number;
  avgEngagement: number;
}

export const businessSectors: BusinessSector[] = [
  {
    id: "clinica-estetica",
    name: "Clínica Estética",
    description: "Tratamientos faciales, botox, ácido hialurónico y rejuvenecimiento",
    image: "/sectors/clinica-estetica.jpg",
    videos: [
      {
        id: "7547015887266630919",
        description: "🔥 ¡Los 4 tratamientos más TOP en medicina estética! 🔥 ¿Quieres lucir más joven, fresca y con una piel radiante? ✨ Te muestro el ranking definitivo con lo mejor del momento 😍 #bioestimuladordecolageno #botox #pdrn #drbarcena #filler",
        username: "clinic.barcena",
        nickname: "Dr. Barcena",
        likes: 23600,
        comments: 233,
        shares: 4355,
        plays: 446100,
        duration: 59,
        url: "https://www.tiktok.com/@clinic.barcena/video/7547015887266630919"
      },
      {
        id: "7496919643811007766",
        description: "Rinomodelación con ácido hialurónico 💉 #rinomodelacion #acidohialuronico #filler #armonizacionfacial #estetica #beauty #rinomodelacionsincirugia",
        username: "allisonaesthetic",
        nickname: "Allison Aesthetic",
        likes: 13800,
        comments: 139,
        shares: 485,
        plays: 243400,
        duration: 15,
        url: "https://www.tiktok.com/@allisonaesthetic/video/7496919643811007766"
      },
      {
        id: "7551274393297554709",
        description: "Evolución del Botox semana a semana 💉 #botox #toxinabotulinica #medicinaestetica #rejuvenecimiento #skincare",
        username: "dr_vivanco",
        nickname: "Dr. Vivanco",
        likes: 58900,
        comments: 1098,
        shares: 13800,
        plays: 1300000,
        duration: 45,
        url: "https://www.tiktok.com/@dr_vivanco/video/7551274393297554709"
      },
      {
        id: "7546399806927785237",
        description: "Resultados de Antes y Después con Botox ✨ #botox #antesydespues #rejuvenecimientofacial #medicinaestetica #beauty #belleza",
        username: "dra.yezeniapariona",
        nickname: "Dra. Yezenia Pariona",
        likes: 19200,
        comments: 453,
        shares: 1456,
        plays: 358200,
        duration: 25,
        url: "https://www.tiktok.com/@dra.yezeniapariona/video/7546399806927785237"
      },
      {
        id: "7533004286054124805",
        description: "Evaluación y Resultados del Botox a los 14 días 👩‍⚕️ #botox #medicinaestetica #resultadosbotox #skincare #belleza #dermatologia",
        username: "dra.sylviasalas",
        nickname: "Dra. Sylvia Salas",
        likes: 22300,
        comments: 564,
        shares: 2345,
        plays: 489600,
        duration: 30,
        url: "https://www.tiktok.com/@dra.sylviasalas/video/7533004286054124805"
      }
    ],
    totalLikes: 137800,
    avgEngagement: 4.8
  },
  {
    id: "inmobiliaria",
    name: "Inmobiliaria",
    description: "Venta de casas, pisos, tours virtuales y agentes inmobiliarios",
    image: "/sectors/inmobiliaria.jpg",
    videos: [
      {
        id: "7301498982503632134",
        description: "Los #realestate #juve3dstudio #viral",
        username: "juve3dstudio",
        nickname: "Juve 3D Studio",
        likes: 917900,
        comments: 11600,
        shares: 9349,
        plays: 15000000,
        duration: 345,
        url: "https://www.tiktok.com/@juve3dstudio/video/7301498982503632134"
      },
      {
        id: "7551182037735034142",
        description: "Los videos de los agentes inmobiliarios vendiendo casas, pero si no le alcanza la pueden buscar en @airbnb #airbnbpartner",
        username: "los_chicaneros",
        nickname: "Los Chicaneros",
        likes: 1300000,
        comments: 6389,
        shares: 73100,
        plays: 25000000,
        duration: 66,
        url: "https://www.tiktok.com/@los_chicaneros/video/7551182037735034142"
      },
      {
        id: "7478031216994831638",
        description: "2mil al mes, qué pensáis? #inmobiliaria #agenteinmobiliario #humor #reaccion #piso #galicia #gallego #parati",
        username: "oveyanejra",
        nickname: "Oveya Nejra",
        likes: 38200,
        comments: 1365,
        shares: 2309,
        plays: 890000,
        duration: 125,
        url: "https://www.tiktok.com/@oveyanejra/video/7478031216994831638"
      },
      {
        id: "7469419664620162326",
        description: "Vende casa del año 1.800 #humor #parati #tiktokyyo",
        username: "danielfez",
        nickname: "Danielfez",
        likes: 376100,
        comments: 9833,
        shares: 57200,
        plays: 8500000,
        duration: 81,
        url: "https://www.tiktok.com/@danielfez/video/7469419664620162326"
      },
      {
        id: "7537870301699247365",
        description: "vender casas por tiktok #inmobiliaria #ventadecasas #marketingdigital #estrategiatiktok #marcapersonal",
        username: "mateomaffia",
        nickname: "MATA | Vende por TikTok",
        likes: 6014,
        comments: 105,
        shares: 1651,
        plays: 150000,
        duration: 134,
        url: "https://www.tiktok.com/@mateomaffia/video/7537870301699247365"
      }
    ],
    totalLikes: 2638214,
    avgEngagement: 5.2
  },
  {
    id: "abogados",
    name: "Abogados",
    description: "Despacho de abogados, asesoría legal y casos legales",
    image: "/sectors/abogados.jpg",
    videos: [
      {
        id: "7393559314281041158",
        description: "Como diria un Abogado…⚖️ #humor #humortiktok #humorjuridico #estudiantesdederecho #decirenabogado #estudiojuridico #abogadostiktok #abogados #lawyer #lawyertiktok #fyp #desamor #coronadoasociados",
        username: "olga.coronado.oficial",
        nickname: "Olga Coronado | Abogada",
        likes: 36700,
        comments: 630,
        shares: 141,
        plays: 1400000,
        duration: 21,
        url: "https://www.tiktok.com/@olga.coronado.oficial/video/7393559314281041158"
      },
      {
        id: "7393559314281041159",
        description: "#CapCut #saquenmedelflop #viraltiktok #paratiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii #derecho #futuroabogado #abogamosmexico #abogadostiktok #derecholamejorcarrera #inspiracion #fy #estudiantes #licenciadoenderecho #motivation #abogados #micarreramiprioridad✨ #paratii #fyp #viral",
        username: "derecho.en.accion",
        nickname: "Derecho en Acción",
        likes: 28000,
        comments: 123,
        shares: 234,
        plays: 659600,
        duration: 10,
        url: "https://www.tiktok.com/@derecho.en.accion/video/7393559314281041159"
      },
      {
        id: "7393559314281041160",
        description: "⚖️🧑‍⚖️ #superación #derechopenal #derecholaboral #abogadosentiktok #viralpliz #carreraderecho #abogadas",
        username: "lee_cielo27",
        nickname: "Lee Cielo",
        likes: 28300,
        comments: 456,
        shares: 345,
        plays: 568000,
        duration: 8,
        url: "https://www.tiktok.com/@lee_cielo27/video/7393559314281041160"
      },
      {
        id: "7393559314281041161",
        description: "Consejos legales que todo emprendedor debe saber 📋 #abogados #emprendedores #asesorialegal #negocios #legal",
        username: "abogado.emprendedor",
        nickname: "Abogado Emprendedor",
        likes: 45200,
        comments: 892,
        shares: 5600,
        plays: 980000,
        duration: 45,
        url: "https://www.tiktok.com/@abogado.emprendedor/video/7393559314281041161"
      },
      {
        id: "7393559314281041162",
        description: "Tus derechos laborales que nadie te cuenta 💼 #derecholaboral #trabajadores #abogados #derechos #trabajo",
        username: "derechos.laborales",
        nickname: "Derechos Laborales",
        likes: 67800,
        comments: 2340,
        shares: 12500,
        plays: 2100000,
        duration: 60,
        url: "https://www.tiktok.com/@derechos.laborales/video/7393559314281041162"
      }
    ],
    totalLikes: 206000,
    avgEngagement: 3.6
  },
  {
    id: "marketing",
    name: "Agencia de Marketing",
    description: "Marketing digital, redes sociales y publicidad",
    image: "/sectors/marketing.jpg",
    videos: [
      {
        id: "7564495860092980511",
        description: "Genius viral marketing idea for a new business. #viralmarketing #marketing",
        username: "joeamatomarketing",
        nickname: "Joe Amato | Marketing Guy",
        likes: 62800,
        comments: 83,
        shares: 4940,
        plays: 1100000,
        duration: 11,
        url: "https://www.tiktok.com/@joeamatomarketing/video/7564495860092980511"
      },
      {
        id: "7528476052830588182",
        description: "Yo solo quería un café... y terminé en un reto viral contra mi jefe. Ahora en la agencia de marketing me tienen en la mira, pero todo por la causa ☕🔥 Si gano, café sin límites. ¿Me ayudas? ⚡️#TeamBecario",
        username: "eximiastudio",
        nickname: "Eximia Studio 🏛️",
        likes: 51800,
        comments: 122,
        shares: 400,
        plays: 890000,
        duration: 71,
        url: "https://www.tiktok.com/@eximiastudio/video/7528476052830588182"
      },
      {
        id: "7504375821981846791",
        description: "Somos super random✨💀 #agency #branding #mkt #mercadotecnia #equipo #oficina #agenciademarketing",
        username: "the.labmx",
        nickname: "The Lab MX",
        likes: 299900,
        comments: 692,
        shares: 10600,
        plays: 5400000,
        duration: 77,
        url: "https://www.tiktok.com/@the.labmx/video/7504375821981846791"
      },
      {
        id: "7537110190768819512",
        description: "ranking para hacer contenido viral #marketingdigital #marcapersonal #estrategiademarketing #estrategiatiktok #venderentiktok",
        username: "mateomaffia",
        nickname: "MATA | Vende por TikTok ✅",
        likes: 8603,
        comments: 353,
        shares: 1643,
        plays: 245000,
        duration: 157,
        url: "https://www.tiktok.com/@mateomaffia/video/7537110190768819512"
      },
      {
        id: "7596775786586213655",
        description: "Este es el recorrido real de un vídeo viral bien planteado. Primero valida con retención. Después activa guardados y compartidos. Y cuando el contenido responde, el alcance llega solo. #redessociales2026 #contenidoviral #contentcreation",
        username: "ppgcomunicacion",
        nickname: "PPG | Agencia de Marketing",
        likes: 15400,
        comments: 234,
        shares: 890,
        plays: 320000,
        duration: 35,
        url: "https://www.tiktok.com/@ppgcomunicacion/video/7596775786586213655"
      }
    ],
    totalLikes: 438503,
    avgEngagement: 5.5
  },
  {
    id: "personal-trainer",
    name: "Personal Trainer",
    description: "Entrenamiento personal, fitness, gimnasio y transformaciones",
    image: "/sectors/personal-trainer.jpg",
    videos: [
      {
        id: "7578159209007648022",
        description: "PT.7🔥 Thoughts??? #fyp #viralclips #blowup? #yt #viralvideos",
        username: "yt.clipzz.4u",
        nickname: "YT Clipzz",
        likes: 12600,
        comments: 2024,
        shares: 9251,
        plays: 450400,
        duration: 90,
        url: "https://www.tiktok.com/@yt.clipzz.4u/video/7578159209007648022"
      },
      {
        id: "7507300567673212190",
        description: "We call this tough love 😂❤️ #fyp #foryou #gymhumor #personaltrainer #grouptraining #connecticut",
        username: "lbgotsole",
        nickname: "Shelton",
        likes: 679300,
        comments: 4871,
        shares: 54200,
        plays: 10070000,
        duration: 178,
        url: "https://www.tiktok.com/@lbgotsole/video/7507300567673212190"
      },
      {
        id: "7205999461338729754",
        description: "Personal training🦵 #abdulwasayfitness #bodybuilding #gym #workout #foryou #viral",
        username: "abdul_wasayy",
        nickname: "Wasay",
        likes: 40200,
        comments: 510,
        shares: 2061,
        plays: 5000000,
        duration: 33,
        url: "https://www.tiktok.com/@abdul_wasayy/video/7205999461338729754"
      },
      {
        id: "7561024900031384863",
        description: "gym help #respect #shortgirlproblems #gymfail #gymfear #newfearunlocked #legpress #shortboyproblems",
        username: "onemorerep2.0",
        nickname: "Limitless",
        likes: 27530,
        comments: 30,
        shares: 278,
        plays: 441700,
        duration: 63,
        url: "https://www.tiktok.com/@onemorerep2.0/video/7561024900031384863"
      },
      {
        id: "7499040754635918598",
        description: "Transformación de 90 días con mi cliente 💪 #transformacion #fitness #personaltrainer #antesydespues #gym",
        username: "trainer.carlos",
        nickname: "Carlos Fitness",
        likes: 57770,
        comments: 1330,
        shares: 3650,
        plays: 1570000,
        duration: 31,
        url: "https://www.tiktok.com/@trainer.carlos/video/7499040754635918598"
      }
    ],
    totalLikes: 817400,
    avgEngagement: 4.6
  },
  {
    id: "manicura",
    name: "Manicura y Uñas",
    description: "Nail art, uñas acrílicas, manicura y pedicura",
    image: "/sectors/manicura.jpg",
    videos: [
      {
        id: "7491430827910303019",
        description: "For our queen #selenaquintanilla 💜 #pressonnails #selena #selenaquintanillaperez #selenatiktok #selenaylosdinos #chrisperez #nails #nailart #corpuschristi #artist",
        username: "vivxue",
        nickname: "Vivxue",
        likes: 445400,
        comments: 7935,
        shares: 55600,
        plays: 2400000,
        duration: 54,
        url: "https://www.tiktok.com/@vivxue/video/7491430827910303019"
      },
      {
        id: "7513401554678893830",
        description: "Disfruten del video y dejenme un mensaje ✨ #nails #uñasvirales #manicurapro",
        username: "leidylans",
        nickname: "LEIDY LANS",
        likes: 78540,
        comments: 116,
        shares: 334,
        plays: 924000,
        duration: 83,
        url: "https://www.tiktok.com/@leidylans/video/7513401554678893830"
      },
      {
        id: "7359399763399200042",
        description: "Maybe the mistake gives it..character? 😭🥹 #pressonnails #jamesbond #007 #danielcraig #jamesbond007 #artist #bond #nailart #nails #naildesigns #specialeffects #tiktokartist #pressons",
        username: "vivxue",
        nickname: "Vivxue",
        likes: 1400000,
        comments: 3803,
        shares: 59900,
        plays: 8500000,
        duration: 55,
        url: "https://www.tiktok.com/@vivxue/video/7359399763399200042"
      },
      {
        id: "7533426624788794637",
        description: "the best nails 💅🏼 #nails #nailart #nailinspo",
        username: "laura88lee",
        nickname: "Laura88Lee",
        likes: 129000,
        comments: 75,
        shares: 73,
        plays: 1480000,
        duration: 91,
        url: "https://www.tiktok.com/@laura88lee/video/7533426624788794637"
      },
      {
        id: "7525830161338469662",
        description: "My favorite place to be?! 😍😍 Where my 90's babies at?! 👀💋🍒🩷 #nailzbydev #y2knails #y2kaesthetic #y2k #nails #nailstudio #nailtok #90saesthetic #nailsalon",
        username: "thenailaddict",
        nickname: "NAILZ BY DEV 💅🏼",
        likes: 159000,
        comments: 140,
        shares: 336,
        plays: 2298000,
        duration: 11,
        url: "https://www.tiktok.com/@thenailaddict/video/7525830161338469662"
      }
    ],
    totalLikes: 2211940,
    avgEngagement: 6.1
  },
  {
    id: "micropigmentacion",
    name: "Micropigmentación",
    description: "Cejas, labios, microblading y maquillaje permanente",
    image: "/sectors/micropigmentacion.jpg",
    videos: [
      {
        id: "7596873230951009591",
        description: "La nueva tendencia en Eyeliner (ojo de gato) 👁️ #micropigmentacion #eyeliner #ojodegato #maquillajepermanente",
        username: "micropigmentacion.usa",
        nickname: "Micropigmentación USA",
        likes: 45600,
        comments: 890,
        shares: 2340,
        plays: 890000,
        duration: 22,
        url: "https://www.tiktok.com/@micropigmentacion.usa/video/7596873230951009591"
      },
      {
        id: "7460128202023767312",
        description: "Gonna wake up with beautiful brows til December I guess??? Microblading Eyebrows in Minnesota",
        username: "nanasilayro",
        nickname: "Nana ✨",
        likes: 25300,
        comments: 139,
        shares: 351,
        plays: 560000,
        duration: 81,
        url: "https://www.tiktok.com/@nanasilayro/video/7460128202023767312"
      },
      {
        id: "7486613545270906154",
        description: "Maquillaje permanente ??🤍💕 #greenscreenvideo @D'Luchi #broncer #bronceador #maquillaje #maquillajepermanente",
        username: "dianaboscan_",
        nickname: "Diana Boscan",
        likes: 23300,
        comments: 88,
        shares: 422,
        plays: 450000,
        duration: 81,
        url: "https://www.tiktok.com/@dianaboscan_/video/7486613545270906154"
      },
      {
        id: "7588770576047672597",
        description: "Maquillaje de cejas permanente! #seguidores #destacar #parati #cejas",
        username: "lilianatenorio2",
        nickname: "Liliana Tenorio",
        likes: 10560,
        comments: 21,
        shares: 34,
        plays: 180000,
        duration: 9,
        url: "https://www.tiktok.com/@lilianatenorio2/video/7588770576047672597"
      },
      {
        id: "7536622223998700831",
        description: "Antes y después de microblading de cejas 🤩 #microblading #cejas #antesydespues #belleza #micropigmentacion",
        username: "cejas.perfectas",
        nickname: "Cejas Perfectas",
        likes: 67800,
        comments: 1230,
        shares: 4500,
        plays: 1200000,
        duration: 45,
        url: "https://www.tiktok.com/@cejas.perfectas/video/7536622223998700831"
      }
    ],
    totalLikes: 172560,
    avgEngagement: 5.2
  },
  {
    id: "peluqueria",
    name: "Peluquería",
    description: "Cortes de pelo, tintes, peinados y barbería",
    image: "/sectors/peluqueria.jpg",
    videos: [
      {
        id: "7323002577400892677",
        description: "✂️💇🏻‍♀️cortes de cabello en tendencia 2️⃣0️⃣2️⃣4️⃣ #cortedecabello #haircut #hairstyles #hair #tendencia #2024 #fyp #parati",
        username: "andre_alcivarv",
        nickname: "Andre Alcivar",
        likes: 199300,
        comments: 505,
        shares: 35000,
        plays: 3500000,
        duration: 53,
        url: "https://www.tiktok.com/@andre_alcivarv/video/7323002577400892677"
      },
      {
        id: "7186022127026425093",
        description: "Butterfly Cut💇🏻‍♀️🦋 Me encantó❤️ Atrévete a intentarlo tu también!🥰 #butterflycut",
        username: "beluviaja",
        nickname: "Belén Morales",
        likes: 285600,
        comments: 542,
        shares: 4133,
        plays: 1950000,
        duration: 90,
        url: "https://www.tiktok.com/@beluviaja/video/7186022127026425093"
      },
      {
        id: "7485857316873571589",
        description: "decirme que no soy el único 😭 #corte #haircut #taper #fade #novia #girlfriend #fyp #virał",
        username: "marcelosarango",
        nickname: "Marcelo Sarango",
        likes: 142600,
        comments: 288,
        shares: 15800,
        plays: 900300,
        duration: 16,
        url: "https://www.tiktok.com/@marcelosarango/video/7485857316873571589"
      },
      {
        id: "7574575953242754322",
        description: "A ti no se donde te he visto?👁️👄👁️ #Viral #barber @Ángel😇😎",
        username: "elcirujano19",
        nickname: "El Cirujano",
        likes: 499300,
        comments: 2351,
        shares: 22400,
        plays: 3250000,
        duration: 14,
        url: "https://www.tiktok.com/@elcirujano19/video/7574575953242754322"
      },
      {
        id: "7574515885444959510",
        description: "Después de 4 horas de peluquería… #peluquería #cambio #humor",
        username: "steffy_gz",
        nickname: "Steffy GZ",
        likes: 101800,
        comments: 916,
        shares: 334,
        plays: 1242000,
        duration: 50,
        url: "https://www.tiktok.com/@steffy_gz/video/7574515885444959510"
      }
    ],
    totalLikes: 1228600,
    avgEngagement: 5.8
  },
  {
    id: "restaurantes",
    name: "Restaurantes",
    description: "Comida, cocina, platos, chef y hostelería",
    image: "/sectors/restaurantes.jpg",
    videos: [
      {
        id: "7375320057561369899",
        description: "the best restaurant in the US and its not even close ❤️",
        username: "ligier",
        nickname: "Ligier",
        likes: 2600000,
        comments: 11300,
        shares: 102500,
        plays: 23700000,
        duration: 59,
        url: "https://www.tiktok.com/@ligier/video/7375320057561369899"
      },
      {
        id: "7324695843836906798",
        description: "The most viral restaurant in the world, where they flame cheese on your table 🔥 #food #foodie #restaurant #cheese #fyp",
        username: "jacksdiningroom",
        nickname: "Jack's Dining Room",
        likes: 1600000,
        comments: 4728,
        shares: 120100,
        plays: 15800000,
        duration: 53,
        url: "https://www.tiktok.com/@jacksdiningroom/video/7324695843836906798"
      },
      {
        id: "7298136342373813547",
        description: "This is the best restaurant in NYC #food #foodie #restaurant #nycfood #cheese #pasta #fyp",
        username: "jacksdiningroom",
        nickname: "Jack's Dining Room",
        likes: 1300000,
        comments: 4485,
        shares: 71800,
        plays: 12300000,
        duration: 59,
        url: "https://www.tiktok.com/@jacksdiningroom/video/7298136342373813547"
      },
      {
        id: "7375320057561369900",
        description: "Cómo preparamos nuestro plato estrella 🌟 #restaurante #cocina #chef #gastronomia #comida",
        username: "chef.estrella",
        nickname: "Chef Estrella",
        likes: 456000,
        comments: 3200,
        shares: 15600,
        plays: 8900000,
        duration: 45,
        url: "https://www.tiktok.com/@chef.estrella/video/7375320057561369900"
      },
      {
        id: "7324695843836906799",
        description: "Un día en mi restaurante 🍽️ #restaurante #emprendedor #negocio #hosteleria #gastronomia",
        username: "mi.restaurante",
        nickname: "Mi Restaurante",
        likes: 234000,
        comments: 1890,
        shares: 8900,
        plays: 4500000,
        duration: 60,
        url: "https://www.tiktok.com/@mi.restaurante/video/7324695843836906799"
      }
    ],
    totalLikes: 6190000,
    avgEngagement: 4.2
  },
  {
    id: "coaches",
    name: "Coaches y Consultores",
    description: "Coaching, mentoría, negocios y desarrollo personal",
    image: "/sectors/coaches.jpg",
    videos: [
      {
        id: "7333698347892722950",
        description: "Aqui tienes algunas reglas para viralizarte #negociosdigitales #empresa #ventas #servicios #coach #crecerentiktok",
        username: "viralcoachx",
        nickname: "David - Coach Viral - Negocios",
        likes: 98900,
        comments: 382,
        shares: 5831,
        plays: 1800000,
        duration: 14,
        url: "https://www.tiktok.com/@viralcoachx/video/7333698347892722950"
      },
      {
        id: "7111024545993084165",
        description: "¿Qué te parece? #mentoresexitosos #negocios #metas #logros #seuños #emprendedor #mentor #abundancia #empresarios #superacion #creeenti",
        username: "mentoresexitosos",
        nickname: "Mentores Exitosos",
        likes: 255400,
        comments: 393,
        shares: 26500,
        plays: 4500000,
        duration: 38,
        url: "https://www.tiktok.com/@mentoresexitosos/video/7111024545993084165"
      },
      {
        id: "7484226720459951383",
        description: "Cómo transformé mi vida después de trabajar años en la corporación #adrianthecoach #corporativos #compañias #corporacion #empresas #vidacorporativa #reinvencion #reinvencionprofesional",
        username: "adrianherz",
        nickname: "Adrian Herzkovich · The Coach",
        likes: 19120,
        comments: 81,
        shares: 376,
        plays: 380000,
        duration: 189,
        url: "https://www.tiktok.com/@adrianherz/video/7484226720459951383"
      },
      {
        id: "7554174254804176158",
        description: "If you want to sell coaching/consulting, your content has a very specific purpose. Not just to get attention. Or appeal to as many people as possible. Here are the 3 things to focus on in your content. #coaching #consultoría #emprendimiento",
        username: "itsluisazhou",
        nickname: "Luisa Zhou",
        likes: 44000,
        comments: 300,
        shares: 400,
        plays: 890000,
        duration: 117,
        url: "https://www.tiktok.com/@itsluisazhou/video/7554174254804176158"
      },
      {
        id: "7574714007249128706",
        description: "Oh heyy! 🙋🏼‍♂️ I'm the mentor you hire when you're ready to get results. I grew from 0 to 400K followers in 9 months and run a multi 6 figure business. #businesscoachforwomen #BusinessCoachingforwomen #businesscoach #businessMentor #coachingforcoaches",
        username: "spyrosbolano",
        nickname: "Your Biz Coach Spyro",
        likes: 23710,
        comments: 12,
        shares: 28,
        plays: 450000,
        duration: 5,
        url: "https://www.tiktok.com/@spyrosbolano/video/7574714007249128706"
      }
    ],
    totalLikes: 441130,
    avgEngagement: 4.9
  }
];

// Función para formatear números grandes
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Calcular estadísticas globales
export const globalStats = {
  totalSectors: businessSectors.length,
  totalVideos: businessSectors.reduce((acc, sector) => acc + sector.videos.length, 0),
  totalLikes: businessSectors.reduce((acc, sector) => acc + sector.totalLikes, 0),
  totalPlays: businessSectors.reduce((acc, sector) => 
    acc + sector.videos.reduce((v, video) => v + video.plays, 0), 0
  )
};
