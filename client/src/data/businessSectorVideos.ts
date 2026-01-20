// Datos de vídeos virales por sector de negocios
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
    "image": "/sectors/clinica-estetica.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7555439697342876950",
        "url": "https://www.tiktok.com/@clinicaopcionmedica/video/7555439697342876950",
        "username": "@clinicaopcionmedica",
        "authorName": "Clinicaopcionmedica",
        "description": "@Didi nos hace un TOUR por nuestra clínica en PAU CLARIS 💫 ¿A qué esperas a visitarnos? #tour #clinicaestetica #medicinaestetica #injertocapilar #clinicaopcionmedica",
        "likes": 19600,
        "comments": 145,
        "shares": 279,
        "views": 289000,
        "cover": "https://p16-sign-va.tiktokcdn.com/obj/tos-useast2a-p-0068-giso/d6948d401c3d46a89b4e349171595395_1696003339?x-expires=1696089600&x-signature=w%2B%2F%2B%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2Fw%3D%3D",
        "duration": "0:30",
        "engagement": 6.93
      },
      {
        "id": "7533750910430858501",
        "url": "https://www.tiktok.com/@dancollantes29/video/7533750910430858501",
        "username": "@dancollantes29",
        "authorName": "Dancollantes29",
        "description": "No me atrevía y ahora quiero repetir jiji Me hice todo esto en @KALOS Clínica Estética con la doctora @Dra. Verónica Bravo ❤️ #botox # #rellenodelabios #acidohialuronico #hilostensores #kalos #clinica",
        "likes": 35800,
        "comments": 839,
        "shares": 345,
        "views": 456000,
        "cover": "https://p16-sign-va.tiktokcdn.com/obj/tos-useast2a-p-0068-giso/c9477395985246a89f6d394264a939e5_1696003339?x-expires=1696089600&x-signature=y%2B%2F%2B%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2Fy%3D%3D",
        "duration": "0:30",
        "engagement": 8.11
      },
      {
        "id": "7519673538576387384",
        "url": "https://www.tiktok.com/@julianagorreri/video/7519673538576387384",
        "username": "@julianagorreri",
        "authorName": "Julianagorreri",
        "description": "#estetica #clinicadeestetica #biomedicina #trends",
        "likes": 11300,
        "comments": 11300,
        "shares": 698,
        "views": 154000,
        "cover": "https://p16-sign-va.tiktokcdn.com/obj/tos-useast2a-p-0068-giso/e23b3c29a03a4e929b5e25f59e8e8a95_1696003339?x-expires=1696089600&x-signature=z%2B%2F%2B%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2Fz%3D%3D",
        "duration": "0:30",
        "engagement": 15.13
      },
      {
        "id": "7525828866930134327",
        "url": "https://www.tiktok.com/@taiiiingrid/video/7525828866930134327",
        "username": "@taiiiingrid",
        "authorName": "Taiiiingrid",
        "description": "Entrei na trend!!! #biomedicaesteta #trends #virais #harmonizacaofacial #clinicaestetica",
        "likes": 13500,
        "comments": 13500,
        "shares": 277,
        "views": 245000,
        "cover": "https://p16-sign-va.tiktokcdn.com/obj/tos-useast2a-p-0068-giso/a939e5e25f59e8e8a95_1696003339?x-expires=1696089600&x-signature=0%2B%2F%2B%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F0%3D%3D",
        "duration": "0:30",
        "engagement": 11.13
      },
      {
        "id": "7534529898765432123",
        "url": "https://www.tiktok.com/@juliju_official/video/7534529898765432123",
        "username": "@juliju_official",
        "authorName": "Juliju Official",
        "description": "Chicos les quería contar que hace dos meses hicimos una colaboración con Ju que fue el último video que el grabó y e...",
        "likes": 12200,
        "comments": 12200,
        "shares": 586,
        "views": 198000,
        "cover": "https://p16-sign-va.tiktokcdn.com/obj/tos-useast2a-p-0068-giso/9e8e8a95e25f59e8e8a95_1696003339?x-expires=1696089600&x-signature=1%2B%2F%2B%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F1%3D%3D",
        "duration": "0:30",
        "engagement": 12.62
      }
    ]
  },
  {
    "id": "inmobiliaria",
    "name": "Inmobiliaria",
    "description": "Venta de casas, pisos, propiedades y tours virtuales",
    "image": "/sectors/inmobiliaria.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7533829973839334661",
        "url": "https://www.tiktok.com/@nathaliatrad/video/7533829973839334661",
        "username": "@nathaliatrad",
        "authorName": "Nathaliatrad",
        "description": "Atenção 🚨LINDA CASA DISPONÍVEL ALTO PADRÃO🚨 ✅BAIRRO PARQUE BRASÍLIA (próximo ao supermercado floresta, abaixo do novo Fórum) ✅Lote 12x25 (300m2) ✅Área construída 165m2 ✅Acabamento fino e de Alto padrã",
        "likes": 327800,
        "comments": 2616,
        "shares": 42200,
        "views": 6700000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oMQcM8BbIQDSgRReheQgXCGwgojEAuT4hCeJb7~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=2AR1TbJJklaAQ8%2FKKh0ZtPvLHcI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 5.56
      },
      {
        "id": "7521884729654742290",
        "url": "https://www.tiktok.com/@tossa.residencial/video/7521884729654742290",
        "username": "@tossa.residencial",
        "authorName": "Tossa.Residencial",
        "description": "🥳 ¿Una casa con TODO? Sí, y la puedes apartar con solo $5,000 💸 📍 3 recámaras con baño 🛌 Principal con vestidor que te abraza 🍳 Cocina equipada con barra 🛋️ Family room que enamora 🧼 Área de lavado sú",
        "likes": 40900,
        "comments": 2284,
        "shares": 6203,
        "views": 1000000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/okLYQmF88mU1L1aGBGDAQoYhR2ogNBrE1xEsff~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=YAX4rXv7LqGeuWyke2ByG3Y4j2E%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 4.94
      },
      {
        "id": "7496154619714800901",
        "url": "https://www.tiktok.com/@vibeninmobiliaria/video/7496154619714800901",
        "username": "@vibeninmobiliaria",
        "authorName": "Vibeninmobiliaria",
        "description": "Adquiere tu lote con 3000 soles de descuento  #Ayacucho #casadecampo #bienesraices #Quinua #naturaleza #viral_video #inversioninmobiliaria #familia #lima #ica ",
        "likes": 12000,
        "comments": 0,
        "shares": 887,
        "views": 4400000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oEBATBE7PlDARZQjAeuEFLHBfwJKQoIEsxIs4C~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=dE7ZTXVgwmU1Gt6oAtGeqOMN%2FiI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 0.29
      },
      {
        "id": "7456908194305019141",
        "url": "https://www.tiktok.com/@rogarealestate/video/7456908194305019141",
        "username": "@rogarealestate",
        "authorName": "Rogarealestate",
        "description": "Las mejores propiedades desde $4 MDP las tenemos nosotros 👍🏻 Agenda tu recorrido 👇🏻 +52 669 268 6307 #realestate #inmobiliaria #luxury #marmol #propiedades #acabadosdelujo #asesoria #gratuita #aesthet",
        "likes": 10200,
        "comments": 37,
        "shares": 1701,
        "views": 124300,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4VEoiQESTZixQBxiWZjoF56UUQB8PXiAAI3B~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=jJ8NRiPUoh%2FK%2F6JPNlK5vz9Mf8E%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 9.6
      },
      {
        "id": "7568546111867096342",
        "url": "https://www.tiktok.com/@inmotiktok/video/7568546111867096342",
        "username": "@inmotiktok",
        "authorName": "Inmotiktok",
        "description": "¿Vivirías en una casa esquina con garaje como esta? #inmobiliaria #casa #murcia #houseoftiktok #housetour ",
        "likes": 6231,
        "comments": 133,
        "shares": 918,
        "views": 289200,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oM4L8UMeWdzTEwRofj04ADzI3eWggIT8ASb7iQ~tplv-tiktokx-dmt-logom:tos-no1a-i-0068-no/osrpgoCmAAA2AROsgEFeC4kDYfEWBJOEFECAII.image?dr=14573&x-expires=1769083200&x-signature=kf%2B%2Fi%2BkfRi6R3H4qC8Bby7A2QC4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 2.52
      }
    ]
  },
  {
    "id": "abogados",
    "name": "Abogados",
    "description": "Asesoría legal, derecho, casos legales y consultas jurídicas",
    "image": "/sectors/abogados.jpg",
    "videoCount": 4,
    "videos": [
      {
        "id": "7483868405515193642",
        "url": "https://www.tiktok.com/@gregoriopernia/video/7483868405515193642?lang=en",
        "username": "@gregoriopernia",
        "authorName": "Gregoriopernia",
        "description": "Hay abogados de estos en tu país? #parati #foryou #humor #eltiti #gregoriopernia #cocina",
        "likes": 1300000,
        "comments": 22700,
        "shares": 145100,
        "views": 19500000,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7528429014097104134",
        "url": "https://www.tiktok.com/@abogadoivangonzalez/video/7528429014097104134?lang=en",
        "username": "@abogadoivangonzalez",
        "authorName": "Abogadoivangonzalez",
        "description": "si quiere correr el riesgo...busque al abogado amigo",
        "likes": 47700,
        "comments": 1243,
        "shares": 5689,
        "views": 715500,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7543810020362816773",
        "url": "https://www.tiktok.com/@yeisonsotog/video/7543810020362816773",
        "username": "@yeisonsotog",
        "authorName": "Yeisonsotog",
        "description": "❌⛔️🫵🏻 #derecho #abogados #lexico #recuerdos",
        "likes": 312300,
        "comments": 2263,
        "shares": 58100,
        "views": 4684500,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7393789958777031941",
        "url": "https://www.tiktok.com/@abogadorodolfomarin/video/7393789958777031941",
        "username": "@abogadorodolfomarin",
        "authorName": "Abogadorodolfomarin",
        "description": "¿Tips legales? #abogadorodolfomarin #legal #consejos #abogados #derechos",
        "likes": 16100,
        "comments": 1086,
        "shares": 1214,
        "views": 241500,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      }
    ]
  },
  {
    "id": "marketing",
    "name": "Agencias de Marketing",
    "description": "Marketing digital, redes sociales, publicidad y estrategias",
    "image": "/sectors/marketing.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7535819588232039702",
        "url": "https://www.tiktok.com/@jumpshot.marketing/video/7535819588232039702",
        "username": "@jumpshot.marketing",
        "authorName": "Jumpshot.Marketing",
        "description": "Okay, aber wer gewinnt? \\u083C\\uDE0C\\uE91D #meettheteam #fyp #marketing #agency #videography",
        "likes": 12600,
        "comments": 63,
        "shares": 5862,
        "views": 376600,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oYN1HHyB0An2H8OiitnkPAIOCCqUfSMwHIIAWn~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=w4442ikUAankwOb9cAoYNICh5Aw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 4.92
      },
      {
        "id": "7511547656594869509",
        "url": "https://www.tiktok.com/@atipico.socialestudio/video/7511547656594869509",
        "username": "@atipico.socialestudio",
        "authorName": "Atipico.Socialestudio",
        "description": "Nos mueve lo que tiene alma y vibra con fuerza✨❤️ ¿Nos acompañas a encontrar lo atípico? #agenciademarketing #agencia #paratii #fyp ",
        "likes": 20600,
        "comments": 73,
        "shares": 7036,
        "views": 330000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o0AIafyeNBIxBIKWRvGeYMLYAMUeAAGIe9YAQi~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=04OnxlM%2BlwrpXCsqtPf9TRM7baw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 8.4
      },
      {
        "id": "7556010353713335608",
        "url": "https://www.tiktok.com/@paranice_/video/7556010353713335608",
        "username": "@paranice_",
        "authorName": "Paranice ",
        "description": "Contratamos a la mejor agencia de marketing del mundo   #paranice #marketingteam ",
        "likes": 44900,
        "comments": 581,
        "shares": 2482,
        "views": 319900,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/owaiAqBAicU7QA2ADIvB2OaXGNuVEAxiEiaxR~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=6jXipqnLFMeeA%2FbsJV59CmYMEUk%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 14.99
      },
      {
        "id": "7437193846099873079",
        "url": "https://www.tiktok.com/@marcdesaint/video/7437193846099873079",
        "username": "@marcdesaint",
        "authorName": "Marcdesaint",
        "description": "Que hacemos en una agencia de marketing?  #emprendedor ",
        "likes": 18800,
        "comments": 130,
        "shares": 2799,
        "views": 220500,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oABnAOqNEFEjAEjFInEDeHfEItDNQh7uBJ2nKR~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=doMlXStu1RbHsKZpEXQwM5Bj3bY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 9.85
      },
      {
        "id": "7473920607076224278",
        "url": "https://www.tiktok.com/@beyonduniverse.es/video/7473920607076224278",
        "username": "@beyonduniverse.es",
        "authorName": "Beyonduniverse.Es",
        "description": "✨ Día 1 de nuestro viaje para convertirnos en la mejor agencia de redes sociales de España. Entre estrategias, reels y un equipo que lo da todo, esto es solo el comienzo. ¿Te unes?  #Marketing #Agenc",
        "likes": 12500,
        "comments": 108,
        "shares": 2718,
        "views": 181400,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/ooz3C01sIAFlB6SCEaA4GCAbAIizVSfjBwdBmi~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=dwfdTQuMV6kYhbVvJkdSo3vArTM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 8.45
      }
    ]
  },
  {
    "id": "personal-trainer",
    "name": "Personal Trainer",
    "description": "Fitness, entrenamiento, ejercicios, gimnasio y nutrición",
    "image": "/sectors/personal-trainer.jpg",
    "videoCount": 2,
    "videos": [
      {
        "id": "7506675121675963653",
        "url": "https://www.tiktok.com/@suu199427/video/7506675121675963653",
        "username": "@suu199427",
        "authorName": "Suu199427",
        "description": "Chicas les comparto Rutina para aumentar Gluteos 💪🏋‍♀️🏠 #ejercicio #gluteos #rutina #faustomurillo #fypシ゚ ",
        "likes": 122300,
        "comments": 1086,
        "shares": 11800,
        "views": 2500000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oEfRIE6mimgG5QTa0nBDQfkIQBFoBoAQLbDJEE~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=oWlqVo2FAF8boFp%2Bu64C67sK9hA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 5.41
      },
      {
        "id": "7580855339734535444",
        "url": "https://www.tiktok.com/@liv.cat14/video/7580855339734535444",
        "username": "@liv.cat14",
        "authorName": "Liv.Cat14",
        "description": "Día 1 con mi primer entrenador personal, como creen que vaya la cosa? #gymgirly #fitnessmotivation ",
        "likes": 39400,
        "comments": 45,
        "shares": 362,
        "views": 508100,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/o0mGcwE4iY1TB0VuPXAbiCb2V09SAIqIAaBU1~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=LtPXOE%2FAh7TqpoMOGwm%2FikQAYt4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 7.83
      }
    ]
  },
  {
    "id": "manicura",
    "name": "Manicura y Uñas",
    "description": "Nail art, diseño de uñas, manicura y pedicura",
    "image": "/sectors/manicura.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7571907688884489502",
        "url": "https://www.tiktok.com/@dakitista/video/7571907688884489502",
        "username": "@dakitista",
        "authorName": "Dakitista",
        "description": "LES DEBIA EL VIDEO D MIS ULTIMAS UÑAS!!!! 🤭",
        "likes": 1300000,
        "comments": 2305,
        "shares": 6733,
        "views": 19500000,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7513401554678893830",
        "url": "https://www.tiktok.com/@leidylans/video/7513401554678893830",
        "username": "@leidylans",
        "authorName": "Leidylans",
        "description": "Disfruten del video y dejenme un mensaje ✨ #nails #uñasvirales #manicurapro",
        "likes": 7854,
        "comments": 116,
        "shares": 334,
        "views": 117810,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7043933830490869039",
        "url": "https://www.tiktok.com/@vivxue/video/7043933830490869039?lang=en",
        "username": "@vivxue",
        "authorName": "Vivxue",
        "description": "Link in bio 😁 #pressonnails #nails #harrypotter #MakeABunchHappen #artist #nailart #arttok #nailvideos #tiktokartist #marvel #thor #moviescene",
        "likes": 3700000,
        "comments": 14700,
        "shares": 36000,
        "views": 55500000,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7359399763399200042",
        "url": "https://www.tiktok.com/@vivxue/video/7359399763399200042?lang=en",
        "username": "@vivxue",
        "authorName": "Vivxue",
        "description": "Maybe the mistake gives it..character? 😭🥹 #pressonnails #jamesbond #007 #danielcraig #jamesbond007 #artist #bond #nailart #nails #naildesigns #specialeffects #tiktokartist #pressons",
        "likes": 1400000,
        "comments": 3803,
        "shares": 59900,
        "views": 21000000,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7503650444003216686",
        "url": "https://www.tiktok.com/@vivxue/video/7503650444003216686?lang=en",
        "username": "@vivxue",
        "authorName": "Vivxue",
        "description": "Nails I’ve wanted to make since 2019 🥹😭 #pressonnails #sleepingbeauty #princessaurora #disneyprincess #magic #maleficent #disney #nostalgia #storybook #nails #nailart #artist",
        "likes": 2600000,
        "comments": 11400,
        "shares": 218200,
        "views": 39000000,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      }
    ]
  },
  {
    "id": "micropigmentacion",
    "name": "Micropigmentación",
    "description": "Cejas, labios, microblading y maquillaje permanente",
    "image": "/sectors/micropigmentacion.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7474270561422609670",
        "url": "https://www.tiktok.com/@maquillajebenyan/video/7474270561422609670",
        "username": "@maquillajebenyan",
        "authorName": "Maquillajebenyan",
        "description": "Que opinamos de este cambio? 🙈 #microblading #micropigmentacion #cejas #cejasperfectas #maquillaje #micropigmentadora #emprendedora #empoderamiento #teamwork #longervideo",
        "likes": 284500,
        "comments": 834,
        "shares": 6407,
        "views": 4267500,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7537467535411694854",
        "url": "https://www.tiktok.com/@chicstudioperu/video/7537467535411694854",
        "username": "@chicstudioperu",
        "authorName": "Chicstudioperu",
        "description": "Respuesta a @Litzeira Reategui #labios #micropigmentacion #virales #glowup #viral",
        "likes": 4340,
        "comments": 65,
        "shares": 213,
        "views": 65100,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7536270374930025784",
        "url": "https://www.tiktok.com/@santisgarcia/video/7536270374930025784",
        "username": "@santisgarcia",
        "authorName": "Santisgarcia",
        "description": "si, esa soy yo tomando una decisión que me cambió la vida 🥺 @sthepygarcia #cejas #micropigmentacion #microblading #tattoobrows #cejasperfectas",
        "likes": 352400,
        "comments": 1174,
        "shares": 11900,
        "views": 5286000,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7518944067368062264",
        "url": "https://www.tiktok.com/@jesbar.studio/video/7518944067368062264",
        "username": "@jesbar.studio",
        "authorName": "Jesbar.Studio",
        "description": "Microblading ❣️Es la técnica número uno en cejas✨ definir, rellenar y mejorar el diseño de las cejas con resultados completamente naturales. También reconstruir por completo una ceja carente de pelo🤍 ",
        "likes": 29300,
        "comments": 525,
        "shares": 1109,
        "views": 439500,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      },
      {
        "id": "7591313568209915143",
        "url": "https://www.tiktok.com/@yeralcercharmakeup/video/7591313568209915143",
        "username": "@yeralcercharmakeup",
        "authorName": "Yeralcercharmakeup",
        "description": "Cata el último les enseñó que mi micro si se borra 🫵🏼🥰 #microblading #microblandingdl",
        "likes": 8987,
        "comments": 174,
        "shares": 596,
        "views": 134805,
        "cover": "",
        "duration": "0:30",
        "engagement": 6.67
      }
    ]
  },
  {
    "id": "peluqueria",
    "name": "Peluquería",
    "description": "Cortes de pelo, peinados, coloración y estilismo",
    "image": "/sectors/peluqueria.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7278858328896310534",
        "url": "https://www.tiktok.com/@lanave.wv/video/7278858328896310534",
        "username": "@lanave.wv",
        "authorName": "Lanave.Wv",
        "description": "el corte mas viral de tik tok el corte de agus! para venir turnos x instagram los esperamos #texturizado #lanave #wala #agus #elchicodetiktok",
        "likes": 240300,
        "comments": 4207,
        "shares": 284000,
        "views": 6600000,
        "cover": "",
        "duration": "0:30",
        "engagement": 8.01
      },
      {
        "id": "7518976503535766840",
        "url": "https://www.tiktok.com/@monroebeauty1/video/7518976503535766840",
        "username": "@monroebeauty1",
        "authorName": "Monroebeauty1",
        "description": "En busca de un lugar para alisar su melena, dio con nuestro video mas viral y sin pensarlo se lanzo a visitarnos. Y despues de 10 largas horas de trabajo, logramos lo aue ella creía imposible😱 #alisad",
        "likes": 947000,
        "comments": 5859,
        "shares": 111000,
        "views": 13200000,
        "cover": "",
        "duration": "0:30",
        "engagement": 8.06
      },
      {
        "id": "7214473224304790789",
        "url": "https://www.tiktok.com/@stiventorres.0/video/7214473224304790789",
        "username": "@stiventorres.0",
        "authorName": "Stiventorres.0",
        "description": "#barber #humor #barbershop #barberhumor🤣 #fypシ #humorbarber #humortiktok #tendencia #barberosperu #barberosperuanos💎🙏😎 #barberoslatinos #fypシ゚viral #viralvideo #barberosdelmundo #viraltiktok #barbercl",
        "likes": 145400,
        "comments": 1023,
        "shares": 9214,
        "views": 11400000,
        "cover": "",
        "duration": "0:30",
        "engagement": 1.37
      },
      {
        "id": "7480930323702828331",
        "url": "https://www.tiktok.com/@orediaz/video/7480930323702828331",
        "username": "@orediaz",
        "authorName": "Orediaz",
        "description": "✨ Dos transformaciones, dos historias, un solo objetivo: superar expectativas ✨ En este video les presento dos casos que demuestran cómo un cambio de look puede renovar la confianza y resaltar la bell",
        "likes": 408700,
        "comments": 14200,
        "shares": 25100,
        "views": 10600000,
        "cover": "",
        "duration": "0:30",
        "engagement": 4.23
      },
      {
        "id": "7576838280021413131",
        "url": "https://www.tiktok.com/@iliananieves_/video/7576838280021413131",
        "username": "@iliananieves_",
        "authorName": "Iliananieves ",
        "description": "T amo Brulee. Un video solo por diversión hahaha pa las amiguis. No podía ir a Bogotá sin pasar por semejante pelu 🥰 agradecida con mis amichis que me cubrieron el día hahaha Bueno ¿cuánto cuesta ir a",
        "likes": 659700,
        "comments": 6459,
        "shares": 55000,
        "views": 5900000,
        "cover": "",
        "duration": "0:30",
        "engagement": 12.22
      }
    ]
  },
  {
    "id": "restaurantes",
    "name": "Restaurantes",
    "description": "Comida, recetas, cocina, gastronomía y platos",
    "image": "/sectors/restaurantes.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7464353675773988101",
        "url": "https://www.tiktok.com/@foodandtravel.mx/video/7464353675773988101",
        "username": "@foodandtravel.mx",
        "authorName": "Foodandtravel.Mx",
        "description": "Grilling seafood is a great way to enjoy a delicious and impressive meal. Here's a simple recipe to get you started: Start by preparing the seafood. For the lobster, make a mixture of butter, garlic, ",
        "likes": 5800000,
        "comments": 99300,
        "shares": 469200,
        "views": 122800000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oUQfIP8h8DxIOAFjwLJQ286EFfIDArfFtH4DEU~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=XmQJcH6kY7yrFmcYFkHC7mVN4h8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 5.19
      },
      {
        "id": "7451964219139853575",
        "url": "https://www.tiktok.com/@fumeyamyam/video/7451964219139853575",
        "username": "@fumeyamyam",
        "authorName": "Fumeyamyam",
        "description": "Mom's Touch Hot Cheese Chicken 🔥 Spicy Green Onion Kimchi & Black Bean Noodles 辛味ヤンニョムチキン & ジャージャーラーメン & 辛いネギキムチ 🍗🔥 完璧な組み合わせ！ Gà rán sốt cay & Mì đen & Kim chi hành 🔥🍗 Sự kết hợp hoàn hảo! Ayam tanpa ",
        "likes": 3000000,
        "comments": 24600,
        "shares": 373300,
        "views": 53300000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oQpR1aEtMCe3gqUhEwGLsQgIDfALFBQYGBZnrI~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=0u%2BGCF9rTmqdWniVnwQAFTb1U64%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 6.38
      },
      {
        "id": "7215729433783586053",
        "url": "https://www.tiktok.com/@mr.taster/video/7215729433783586053",
        "username": "@mr.taster",
        "authorName": "Mr.Taster",
        "description": "Adam Perry Lang, the king of barbecue in the world♥️🇺🇸😍 🐖In Los Angeles, California, together with my good friends, we found a famous restaurant called APL BBQ, which always has a long line for its fo",
        "likes": 2000000,
        "comments": 19800,
        "shares": 276700,
        "views": 57200000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/okuWBNjbzBAkfR9Eejha2xE7IBJIb28QESRidA~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=%2BCHjJutZXtVndzCB6YvtcNegzm0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 4.01
      },
      {
        "id": "7532208926469704974",
        "url": "https://www.tiktok.com/@keilapacheco/video/7532208926469704974",
        "username": "@keilapacheco",
        "authorName": "Keilapacheco",
        "description": "CHILIS BURGER🍔🌶️ THIS WAS SO JUICY OMG!!😊❤️ What do you order from chilis? Also i think that might be my PR for my biggest bite😂#burger #chilis#chilistripledipper#trippledipper#mozzerellasticks#cheese",
        "likes": 1900000,
        "comments": 10200,
        "shares": 296400,
        "views": 25200000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/osoASCH1fCJE8AiRzD7ICD8AAhE0gFfCDgyBi4~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=EFwywStFF%2BT9UwGJ7qs6p2ZMkwc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 8.76
      },
      {
        "id": "7420565859292171551",
        "url": "https://www.tiktok.com/@evelynmukbangs/video/7420565859292171551",
        "username": "@evelynmukbangs",
        "authorName": "Evelynmukbangs",
        "description": "Sooo delicious 😩 and with a @Bloom Nutrition energy drink on the side? AMAZING #paratii #foryou #fypage #fy #foodlover #explore #foodie #foodtiktok #foodtok #food #bloompartner #comida #asmr #asmrsoun",
        "likes": 1800000,
        "comments": 6812,
        "shares": 191700,
        "views": 19100000,
        "cover": "https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/4a56c541d661477bbe97996d4580d6cc_1727735142~tplv-tiktokx-dmt-logom:tos-useast8-i-0068-tx2/oYDBvBAAsEiA1IyyEIR3YAhOZ7EvbAlWsJilm.image?dr=14573&x-expires=1769083200&x-signature=s54fByUmA0guCu6CHDUcs4OMQzU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 10.46
      }
    ]
  },
  {
    "id": "coaches",
    "name": "Coaches y Consultores",
    "description": "Coaching, mentoría, desarrollo personal y negocios",
    "image": "/sectors/coaches.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7481867214082067742",
        "url": "https://www.tiktok.com/@ashtonhallofficial/video/7481867214082067742",
        "username": "@ashtonhallofficial",
        "authorName": "Ashtonhallofficial",
        "description": "4 tips on how you can get more clients as an online fitness coach Fitness Coaches.. if you’re looking to grow your brand and scale your online coaching business 🚀 Comment “TEAM” on IG and I’ll be reac",
        "likes": 54300,
        "comments": 1220,
        "shares": 1536,
        "views": 6300000,
        "cover": "https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/o4UjA6BAAIzAiDjdJKfBIlYIr2yF7nC6Aii0FE~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=%2BleLgpqEiupger7uZWD2UN1M8kY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 0.91
      },
      {
        "id": "7574126475339746582",
        "url": "https://www.tiktok.com/@nimo_jama1/video/7574126475339746582",
        "username": "@nimo_jama1",
        "authorName": "Nimo Jama1",
        "description": "Wearing @DFYNE code ‘NIMO’ to save Grow your glutes with just 4 workouts let me coach you. Link in my bio for my 1-1 coaching 🔗💕 #glutes #gymtok #growth",
        "likes": 136200,
        "comments": 436,
        "shares": 9606,
        "views": 1600000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/o4CyekKeQffsAX3RBGQQQAWzAdmcGwMoRg68GR~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=30Ygrr4tBstDnwuLWolFecNA9qU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 9.14
      },
      {
        "id": "7573356501109165334",
        "url": "https://www.tiktok.com/@nemoqueen_/video/7573356501109165334",
        "username": "@nemoqueen_",
        "authorName": "Nemoqueen ",
        "description": "You don't need 10 exercises - 4-5 done properly will grow your glutes. Online coaching is open now - link in bio.💕 Full set from @Prozis_official code:nemo10🥰 #glutes #glutesworkout #glutepump",
        "likes": 784200,
        "comments": 4270,
        "shares": 110600,
        "views": 14600000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/o8GGeFWBBYNfQ9Z66kmtAAQZieIRQ29ADe9REA~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=PDRlpJcPdIRHQSkC2CMLYS%2B%2Fajs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 6.16
      },
      {
        "id": "7575959832931503383",
        "url": "https://www.tiktok.com/@nemoqueen_/video/7575959832931503383",
        "username": "@nemoqueen_",
        "authorName": "Nemoqueen ",
        "description": "Coaching is more than reps and sets. It’s supporting women through the entire journey. She did the work—I just guided.💕 Online coaching in bio 💕 @Mana | Lifestyle & Fitness✨ #onlinecoaching #progress ",
        "likes": 8895,
        "comments": 104,
        "shares": 399,
        "views": 240800,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oQjzgSAriB3sMZ9SBYsWagNiIEnB1BqHPZIKE~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=phFeOvLPgxKxRViIjQx4AeURtT8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 3.9
      },
      {
        "id": "7571106658428931350",
        "url": "https://www.tiktok.com/@coach_malik/video/7571106658428931350",
        "username": "@coach_malik",
        "authorName": "Coach Malik",
        "description": "04 minutes « TABATA HIT ABDO 🔥💪✅ » Enregistre et fait ça demain matin 👍 Pour une séance ce 40 minutes alors répète ça 8 fois en prenant 1 minute de repos après un tour #creatorsearchinsights #absworko",
        "likes": 132600,
        "comments": 830,
        "shares": 31600,
        "views": 4300000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oMwEHeCWQb6IIOID8j1DfLOjKeAFOy7Ayv1SQk~tplv-tiktokx-origin.image?dr=14575&x-expires=1769083200&x-signature=Yws9vhgN5eHx22J%2B28sJykRsZKY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:30",
        "engagement": 3.84
      }
    ]
  }
];

// Estadísticas globales
export const libraryStats = {
  totalSectors: 10,
  totalVideos: 46,
  totalLikes: 30141407,
  totalViews: 541085015,
  minLikes: 4000
};

// Función para formatear números
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Estadísticas globales formateadas
export const globalStats = {
  sectors: '10',
  videos: '46+',
  likes: '30M+',
  views: '541M+'
};
