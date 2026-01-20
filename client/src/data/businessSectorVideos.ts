// Biblioteca de Vídeos Virales por Sector de Negocios
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
        "id": "7573086656882953490",
        "url": "https://www.tiktok.com/@toucheclinic/video/7573086656882953490",
        "username": "@toucheclinic",
        "authorName": "toucheclinic",
        "description": "Non-Surgical FULL FACE touché clinic",
        "likes": 824300,
        "comments": 1958,
        "shares": 82500,
        "views": 9500000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oUCpCHIRAAA8ARJegIFkGBcDwfauqGQEBECAyQ~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=txRCb3FI25g6Hx1Gb8MXtaNGHzc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:21",
        "engagement": 9.57
      },
      {
        "id": "7553825631440522507",
        "url": "https://www.tiktok.com/@dra.jessicacastaneda/video/7553825631440522507",
        "username": "@dra.jessicacastaneda",
        "authorName": "Dra Jessica Medicina Estética",
        "description": "⚠️ ¡Estos errores silenciosos están dañando tu piel y ni te imaginas! 🧴 Como médica estética los veo todos los días… y sí, muchos podrían evitarse con cambios súper simples. Guarda este video y sígueme para aprender a cuidar tu piel 😍 #medicinaestetica #erroresdelcuidadodelapiel #habitosquedañan #cuidadofacial #esteticaresponsable ",
        "likes": 78300,
        "comments": 311,
        "shares": 24600,
        "views": 2400000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/osnBNBACKHi8XIzqEBQC9rMvaUIvCUSHSliS7~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=o41BV4lEgKmhh158%2FbMyoYmQhSc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:32",
        "engagement": 4.3
      },
      {
        "id": "7561287596375313671",
        "url": "https://www.tiktok.com/@dr.ivan.patio.med/video/7561287596375313671",
        "username": "@dr.ivan.patio.med",
        "authorName": "Dr.Ivan Patiño | Med Estética",
        "description": "La medicina estética ha evolucionado ✨ Hoy en día, ya no se trata de cambiar quién eres, sino de resaltar tu belleza natural y buscar la mejor versión de ti mism@. La tendencia actual es armonizar el rostro y el cuerpo, logrando resultados sutiles, equilibrados y totalmente naturales. 🌿 Cada tratamiento está pensado para que te veas fresc@, rejuvenecid@ y con esa confianza que nace al sentirte bien contigo mism@. Porque la verdadera estética no transforma, realza lo mejor de ti. 💫",
        "likes": 65000,
        "comments": 530,
        "shares": 24300,
        "views": 585200,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oAgvRxFHoIUbEyB5FB7ioHbiIdBBDmAIfgfCwt~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=Vxjl8aLRAcy9UbfyqRFt8vxP4HY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:19",
        "engagement": 15.35
      },
      {
        "id": "7581992134803344658",
        "url": "https://www.tiktok.com/@dra.jessicacastaneda/video/7581992134803344658",
        "username": "@dra.jessicacastaneda",
        "authorName": "Dra Jessica Medicina Estética",
        "description": "❔Preguntas que me hacen constantemente como médica estética  En este video respondo algunas de las más comunes! #rejuvenecimiento #medicinaestetica #procedimientosesteticos ",
        "likes": 22500,
        "comments": 81,
        "shares": 4294,
        "views": 1500000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ostViVpIicTtTA4DYEABwMaxiBIvPdT4nIbkT~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=PddbuEXMSBggaCD6pQu7S8VOEHk%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:11",
        "engagement": 1.79
      },
      {
        "id": "7531275539823332621",
        "url": "https://www.tiktok.com/@jeannieinjects/video/7531275539823332621",
        "username": "@jeannieinjects",
        "authorName": "jeannieinjects",
        "description": "✨ Masseter Slimming ✨ #dallasmedspa #dallasinjector #explorepage #dallasbotox #dfwinjector #dallasfacialbalancing #masseterbotox #fyp #masseter ",
        "likes": 20500,
        "comments": 181,
        "shares": 2784,
        "views": 678100,
        "cover": "https://p19-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ooNolfjQRASlCVgcgIFknsSDjfaw1ctEDCBc9Q~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=sCxsLkRtDDfrJ2x0yvbMHqzm8xM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:10",
        "engagement": 3.46
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
        "id": "7380856997417078021",
        "url": "https://www.tiktok.com/@anaa_chr/video/7380856997417078021",
        "username": "@anaa_chr",
        "authorName": "ana clara 👑",
        "description": "Tour pela minha casa novaaaa 🤩🤩🤩",
        "likes": 464600,
        "comments": 3009,
        "shares": 5013,
        "views": 4200000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/okbAoBEhlmDjRbQKB9WUFruBfeJCNmIEEcE0kr~tplv-tiktokx-dmt-logom:tos-useast2a-v-0068/okCURADEbBhfJAg8ubixJgYEAW9FEEmdBIQAlf.image?dr=14573&x-expires=1769086800&x-signature=Q3MlarRAyspK%2Ff6v839FdqwTg7Q%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3",
        "duration": "6:07",
        "engagement": 11.25
      },
      {
        "id": "7509790224541650232",
        "url": "https://www.tiktok.com/@gvsimoveis1/video/7509790224541650232",
        "username": "@gvsimoveis1",
        "authorName": "gvsimoveis1",
        "description": "📣Atenção 🔴LINDA CASA DISPONÍVEL ALTO PADRÃO🔴 ✅BAIRRO PARQUE BRASÍLIA (próximo ao supermercado floresta, abaixo do novo Fórum) ✅Lote 12x25 (300m2) ✅Área construída 165m2 ✅Acabamento fino e de Alto padrão  ✅Piscina na pastilha, aquecida, com cascata, hidromassagem e no deck de madeira, ducha. ✅3 Suítes, sendo 1 suíte master com closet  ✅Sala pé-direito alto ✅Cozinha com ilha ✅Corredor de circulação em todo imóvel  ✅Gás canalizado ✅Torneiras premium  ✅Lavanderia externa ✅Toda rebaixada no gesso iluminação perfil led  ✅Janelas  na esquadria de alumínio e porta de entrada no lambril ripado ✅Porta pivotante da entrada com fechadura eletrônica  ✅Portão eletrônico, cerca elétrica e interfone  ✅Garagem para 2 carros cobertos ✅Paisagismo  ✅Valor R$ 970.000,00 (Novecentos e setenta mil reais) Aceita financiamento  . . . . . #imoveis #vendas #negocios #engenhariacivil #investimento #oportunidade #condominio #imoveis #casas #decora #imobiliaria #venda #imoveisdeluxo #casanova #construcao #anápolis #goiania #fachadasincriveis #goiânia #goiás #casamoderna #casaaltopadrao #casaavenda #venda #imovel #imoveldeluxo #brasília #riograndedosul #vendadeimoveis",
        "likes": 327800,
        "comments": 2616,
        "shares": 42200,
        "views": 6700000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oMQcM8BbIQDSgRReheQgXCGwgojEAuT4hCeJb7~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=15oRmipiTw8rPKtKrJ5yQbcfW%2B8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "1:07",
        "engagement": 5.56
      },
      {
        "id": "7493147343227866374",
        "url": "https://www.tiktok.com/@guntherimoveis/video/7493147343227866374",
        "username": "@guntherimoveis",
        "authorName": "Gunther Imóveis",
        "description": "A casa mais linda do Instagram voltou! Ela conquistou corações, viralizou com seu estilo único e já ganhou o apelido carinhoso de “casa com cara de casa” 🏡✨ Hoje eu te mostro a fachada desse verdadeiro refúgio — a casa mais verde de todo o planeta 🌿🌎 Simplesmente apaixonante desde o primeiro olhar… porque quando a arquitetura abraça a natureza, o resultado encanta o mundo inteiro! Prepare-se para se apaixonar novamente! A beleza começa do lado de fora… mas te convida a entrar e nunca mais querer sair ❤️ Curta, comente e marque quem merece morar nesse paraíso! 🏠🔑 Gunther Dias  Corretor de imóveis  CRECI: 8000/MS 📲 Contato: 67 9 9640-0505 🏡💼 Gostou❓ Quer tornar o sonho da casa em condomínio fechado uma realidade⭐️🏠🔑 ❓ Vamos juntos encontrar o imóvel perfeito para você‼️ Siga @guntherimoveis para mais vídeos e dicas incríveis como essa‼️ ⚜️ @guntherimoveis  ⚜️ @guntherimoveis  ⚜️ @guntherimoveis  #imove#imoveise#imoveisdeluxop#altopadraore#corretordeimoveise#corretoradeimoveisi#imobiliariaominiofechado",
        "likes": 233000,
        "comments": 1309,
        "shares": 32900,
        "views": 2100000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oodBEFFVAMSVle39CADAIHftjWPgAEDIAQEtfu~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=RqAh1gGDhFBKpf9jTE5ExB%2F3Lt4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3",
        "duration": "0:43",
        "engagement": 12.72
      },
      {
        "id": "7565586117693656328",
        "url": "https://www.tiktok.com/@vanuzasarmento98/video/7565586117693656328",
        "username": "@vanuzasarmento98",
        "authorName": "vanuzasarmento98",
        "description": "A casa mais linda do mundo 🥹❤️❤️ #viralizarnotiktok #casadeboneca #monetizartiktok🤑 #vaiprofy #tourpelaminhacasa ",
        "likes": 158700,
        "comments": 717,
        "shares": 10300,
        "views": 3100000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oUCtdOBeIIIGJkwGLXjReGIFfQxkQrbeAAZLHG~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=OVnoAdUdzcfkVZZG%2FxPI3QbhxSE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3",
        "duration": "0:18",
        "engagement": 5.47
      },
      {
        "id": "7595266536529546514",
        "url": "https://www.tiktok.com/@jose.ramones/video/7595266536529546514",
        "username": "@jose.ramones",
        "authorName": "jose.ramones",
        "description": "Tu agente inmobiliario 🤷🏽‍♂️😂 #comedia #comedy #humor",
        "likes": 141000,
        "comments": 2281,
        "shares": 18800,
        "views": 1300000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oAwfGz5flBwPR0GnOFnuosmgAHYjseA6vA4Fsf~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=FoWkX7wqoomCp%2FUyvYPbcNE%2Byxc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:44",
        "engagement": 12.47
      }
    ]
  },
  {
    "id": "abogados",
    "name": "Abogados",
    "description": "Asesoría legal, derecho, casos legales y consultas jurídicas",
    "image": "/sectors/abogados.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7538608850304290055",
        "url": "https://www.tiktok.com/@karolqp09/video/7538608850304290055",
        "username": "@karolqp09",
        "authorName": "LA QP👩🏻‍⚖️🏋️‍♀️♥️",
        "description": "#paratiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii #viraltiktok #derecho #derechoshumanos #abogado ",
        "likes": 112500,
        "comments": 159,
        "shares": 10600,
        "views": 866500,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oAvMMeEQeofG9KVhALgNgeItLiAN0FecdwwTSQ~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=nCDx4F3YauB6CJ%2BZ4aQ5q%2F2JMtM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:14",
        "engagement": 14.22
      },
      {
        "id": "7589948478684613909",
        "url": "https://www.tiktok.com/@johnny_tex/video/7589948478684613909",
        "username": "@johnny_tex",
        "authorName": "johnny_tex",
        "description": "#abogado #viralvideo @🙋‍♂️ #elabogadodetiktok ",
        "likes": 98500,
        "comments": 2489,
        "shares": 2524,
        "views": 2700000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oACTA0oqjLCRfIdGQSIGPfe0QPWoANK0D4pRij~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=loq%2B6bgzR1F%2FoBei2JyShORRlQs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:19",
        "engagement": 3.83
      },
      {
        "id": "7581618366956260629",
        "url": "https://www.tiktok.com/@alberto.garca80/video/7581618366956260629",
        "username": "@alberto.garca80",
        "authorName": "Alberto García",
        "description": "#consejos #delitos #abogadospenalistas #juicio #sociedad",
        "likes": 89900,
        "comments": 1663,
        "shares": 30700,
        "views": 1600000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/ogYdYBuh3TKSCRVaZKIXSAiUdPAEI0b8hiExB~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=I1iXG6saQTz1IpWMcUBg9mJr0TU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "3:17",
        "engagement": 7.64
      },
      {
        "id": "7380989879003532549",
        "url": "https://www.tiktok.com/@buen.derecho/video/7380989879003532549",
        "username": "@buen.derecho",
        "authorName": "🔹️ Boga 🔹️",
        "description": "❤️‍🔥❤️‍🔥❤️‍🔥✨️ #ley #abogado #abogada #derecho #study #estudiante #estudiantes #leyes #motivacion #motivation #motivacional #civil #viral #fyp ",
        "likes": 43800,
        "comments": 193,
        "shares": 2527,
        "views": 593500,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/ogiWtBZmSUARziTAqiIZhFwEzEutPB6AHQB3I~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=RqEYGlJ08K1wn7Bv7eNyPB0YmYA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:18",
        "engagement": 7.84
      },
      {
        "id": "7386285974747221253",
        "url": "https://www.tiktok.com/@derecho.en.accion/video/7386285974747221253",
        "username": "@derecho.en.accion",
        "authorName": "DerechoEnAccion",
        "description": "#CapCut #saquenmedelflop #viraltiktok #paratiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii #derecho #futuroabogado #abogamosmexico #abogadostiktok #derecholamejorcarrera #inspiracion #fy #estudiantes #licenciadoenderecho #motivation #abogados #micarreramiprioridad✨ #paratii #fyp #viral ",
        "likes": 28000,
        "comments": 129,
        "shares": 5086,
        "views": 659600,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/50b530f38b19443dafeb276548299348_1719753722~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=f13pwfpCkBya3iGmHy5acN9t9uM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:15",
        "engagement": 5.04
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
        "id": "7485783835653786922",
        "url": "https://www.tiktok.com/@ahmad.alzahabi/video/7485783835653786922",
        "username": "@ahmad.alzahabi",
        "authorName": "Ahmad Alzahabi",
        "description": "How to be successful on social media 🫡",
        "likes": 333800,
        "comments": 23900,
        "shares": 48200,
        "views": 3400000,
        "cover": "https://p19-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMPW9B80IAJ6bDAC5B2iTjxAXEDIwAiDziB6Wf~tplv-tiktokx-dmt-logom:tos-useast5-i-0068-tx/oUAc2tX1DIDPEihjA0FASqR1pCfunADEEigfE4.image?dr=14573&x-expires=1769086800&x-signature=TP0rjCeIqODouXiStOppARbwNnY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "5:08",
        "engagement": 11.94
      },
      {
        "id": "7440165781817658667",
        "url": "https://www.tiktok.com/@elly.watso/video/7440165781817658667",
        "username": "@elly.watso",
        "authorName": "elly.watso",
        "description": "This has changed the game for me!! #creatorsearchinsights #growontiktok #tiktokshopaffiliate #makemoneyonline ",
        "likes": 209100,
        "comments": 19800,
        "shares": 31500,
        "views": 4500000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/osO4DEBBPAxgpC1gAZ2AYEUkdAAHii0DI0B2o~tplv-tiktokx-dmt-logom:tos-useast5-i-0068-tx/o0AAlEYaOHA4j0fmADEfCsKgFA6IkQfjrIYUBY.image?dr=14573&x-expires=1769086800&x-signature=LwzVjCHWE2ecXnuO5eXzZIJt18A%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "1:00",
        "engagement": 5.79
      },
      {
        "id": "7475399747449277718",
        "url": "https://www.tiktok.com/@anonym.branding/video/7475399747449277718",
        "username": "@anonym.branding",
        "authorName": "anonym.branding",
        "description": "lower prices wont increase your sales🙌🏻 #edit #viral #marketing #socialmediamarketing ",
        "likes": 170900,
        "comments": 569,
        "shares": 16700,
        "views": 1900000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/okIT9zPCJAvkowI31HIA2iiCo9B3m3BD3fVrIy~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=e2DTTRn%2FEwlauLF8%2B1x4ssf1Uqw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:12",
        "engagement": 9.9
      },
      {
        "id": "7381864219202866475",
        "url": "https://www.tiktok.com/@bryanfahim/video/7381864219202866475",
        "username": "@bryanfahim",
        "authorName": "Bryan | Social Media Marketing",
        "description": "Use this Hashtag Formula to go VIRAL! 📈#️⃣ ✅Follow For More Valuable Tips!  @bryanfahim #contentmarketing #business #entrepreneurs #onlinebusiness #socialmediastrategy #socialmediagrowth #contentstrategy",
        "likes": 98000,
        "comments": 4168,
        "shares": 8836,
        "views": 2100000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/a838bb28fcee42519848eb3bd995590b_1718724207~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=2gpj0Ys1YnHXkuxLjpY7Q2cm1q0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:27",
        "engagement": 5.29
      },
      {
        "id": "7590693186192805142",
        "url": "https://www.tiktok.com/@trendoramarketing.agency/video/7590693186192805142",
        "username": "@trendoramarketing.agency",
        "authorName": "TRENDORA",
        "description": "Reach out to get started💌 #fyp #trendora #socialmedia #marketing #agency ",
        "likes": 46100,
        "comments": 181,
        "shares": 603,
        "views": 568200,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oQ0XY403RgcQI0jeVAlAtKlXEPGjAAeeBW3AfW~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=CcH0qby9tOSYEF1GjaBCwgWQTuc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:24",
        "engagement": 8.25
      }
    ]
  },
  {
    "id": "personal-trainer",
    "name": "Personal Trainer",
    "description": "Fitness, entrenamiento, ejercicios, gimnasio y nutrición",
    "image": "/sectors/personal-trainer.jpg",
    "videoCount": 5,
    "videos": [
      {
        "id": "7511494917567368453",
        "url": "https://www.tiktok.com/@_.winter_asp/video/7511494917567368453",
        "username": "@_.winter_asp",
        "authorName": "@",
        "description": "La mejor rutina 🫶🏻 @Paula Moreno - Pau Fit💗  #cintura #cinturapequeña #abdomenplano #cinturadeavispa #PauFit #fyp #foryou #foryoupage #trending #viral #tiktok #xyzbca #followme #girl #fashionstyle #loveyourself #nature #happiness #style #fashion #adorable #beauty @TikTok ",
        "likes": 534500,
        "comments": 9845,
        "shares": 51200,
        "views": 9200000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/os01MglBfAEyAFDhRN5eevQAqFGvFfJllkEIFs~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=jp4Kkl%2FI3R4iusByc%2BM80jkxEMc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:49",
        "engagement": 6.47
      },
      {
        "id": "7335740527444233505",
        "url": "https://www.tiktok.com/@sheyladc_/video/7335740527444233505",
        "username": "@sheyladc_",
        "authorName": "Sheyla Dotes",
        "description": "😨😳🤦🏾‍♀️😢😱 TREMEEEENDA HOSSSTIA! Dime cuánto te ha dolido al verlo??😆🤣 🤝🏽Gajes del oficio amigos! Jajajaja 📽Grabando contenido a primera hora con @angelrivero_video para @entrenavirtual.es ! En bucle desde que ha pasado!🤣🤣 Estoy bien, podéis reíros agusto jajaja _ #reelsfit #reelsinstagram #entrenamientopersonal #tomafalsa #tomasfalsas #humorabsurdo #humorespañol #humoramarillo #fittok #fitness #fitnesstips  #consejosfitness  #gymtips #dominadas #pullups",
        "likes": 253000,
        "comments": 7754,
        "shares": 17400,
        "views": 7900000,
        "cover": "https://p19-common-sign-useastred.tiktokcdn-eu.com/tos-useast2a-p-0037-euttp/oQfJME70XMNMNhf3EJvgAPYHRNAGffrgQO4w8y~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=S%2FUck%2FdTw0%2FX%2FpJ4h%2FF07dZYgtg%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:06",
        "engagement": 3.52
      },
      {
        "id": "7580855339734535444",
        "url": "https://www.tiktok.com/@liv.cat14/video/7580855339734535444",
        "username": "@liv.cat14",
        "authorName": "Cat 🤍",
        "description": "Día 1 con mi primer entrenador personal, como creen que vaya la cosa? #gymgirly #fitnessmotivation ",
        "likes": 39500,
        "comments": 45,
        "shares": 362,
        "views": 508300,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/o0mGcwE4iY1TB0VuPXAbiCb2V09SAIqIAaBU1~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=%2FBHKA86sfwWtE7pSidzrOGzF56s%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:45",
        "engagement": 7.85
      },
      {
        "id": "7555926262276017463",
        "url": "https://www.tiktok.com/@raymonddvegaa/video/7555926262276017463",
        "username": "@raymonddvegaa",
        "authorName": "Raymond",
        "description": "**LATINOS EN DALLAS 🇲🇽🇺🇸, aquí estoy para ustedes! ✅ Entrenador Personal bilingüe ✅ Gimnasio Privado ✅ Programas personalizados ✅ Planes de Comida + Ejercicio ✅ Resultados reales 👉 Escríbeme hoy y empieza tu transformación #dallas #entrenadorpersonal #fitness",
        "likes": 25600,
        "comments": 1025,
        "shares": 2270,
        "views": 316100,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oA8NCfJHDDjoFufEZcECAEIx3BSIqHTgl6RDsA~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=amByge9LYdEXWHZgDbRrk5XGiq4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:25",
        "engagement": 9.14
      },
      {
        "id": "7455076469539130629",
        "url": "https://www.tiktok.com/@danifitth/video/7455076469539130629",
        "username": "@danifitth",
        "authorName": "Danihfitt",
        "description": "🔱 Hoy inicia un nuevo mes donde tendremos nuevas metas, nuevos restos y nuevos obstáculos. Obstáculos que vamos a superar y gracias a ello vamos a volvernos más fuertes, vamos por más dolor físico y no mental. . . #entrenamiento #entrenamientopersonal #gym #training #danihfit #danihfitt #superacionpersonal #fitnessmotivation #motivacion #disciplina #workout #training #reels #reelsinstagram #gymlover #gymbro #tiktok #reelsvideo #fyp #TuPuedes #NoTeRindas",
        "likes": 7538,
        "comments": 35,
        "shares": 1268,
        "views": 192500,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/ocJdJE5IBZXfbBwUQifEAXAyWiZsynBE4wnRm1~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=G7eiAEsHD0yvneBYa7Sg%2F3Ur%2B3A%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:15",
        "engagement": 4.59
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
        "id": "7453885232429681942",
        "url": "https://www.tiktok.com/@nailcanvas0/video/7453885232429681942",
        "username": "@nailcanvas0",
        "authorName": "NailCanvas",
        "description": "#nailtech #nails #viral_video #naildesigns #nails💅 #nailinspo #videoviral #ff #nailart #nailtrends #magneticnails ",
        "likes": 1200000,
        "comments": 6316,
        "shares": 246700,
        "views": 29300000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-0037-no/oMV2N0AgIEd0PWeFYhnExDSBcQlMkicfgAuFlR~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=MlcG0dDTSHkR4XQGmckaA0mQv7c%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=sg1",
        "duration": "0:13",
        "engagement": 4.96
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
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oUflfqVmCiDygRhErtFvVIw6BOsGQQBpNVAJLA~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=oqRue8UlGfTK9Y0sNOX3Csd2L%2BY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:05",
        "engagement": 1.6
      },
      {
        "id": "7316963345507159301",
        "url": "https://www.tiktok.com/@nailart_marisolrivero/video/7316963345507159301",
        "username": "@nailart_marisolrivero",
        "authorName": "Marisol Rivero",
        "description": "uñas navideñas ❄️ #uñasnavideñas #uñasparaañonuevo #uñasacrilicas #uñasefectoreflectivo #uñasvirales ",
        "likes": 525900,
        "comments": 3557,
        "shares": 81400,
        "views": 27200000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/bc1867ad5dd44e66975dc92a6cc844cb_1703616082~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=%2F5vN%2Br2p3ogTiNSL%2FFg3TJWweiw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:07",
        "engagement": 2.25
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
        "cover": "https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/oAiEINUiduyiS0ZBEVrA42v1w1IBAURlOtE6A~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=z45f0lGVAt%2B35uNKYJP3xfBF71k%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:06",
        "engagement": 4.41
      },
      {
        "id": "7573157142757133575",
        "url": "https://www.tiktok.com/@sharon.ruiz801/video/7573157142757133575",
        "username": "@sharon.ruiz801",
        "authorName": "Fiore🧚🏻‍♀️",
        "description": "La mejor @Claudiaruiz Nails spa  💗🥰 #uñasacrilicas #viraltiktok #paratiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii #fyp #tacna_peru🇵🇪 ",
        "likes": 477100,
        "comments": 1078,
        "shares": 20000,
        "views": 6500000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oEaZvA3glIYRJBV0OPi2BiYDIEQ4BahAlIwxu~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=%2F2jBfdFVcaXLfYa4hfTKpP0JTsc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:05",
        "engagement": 7.66
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
        "id": "7152555008012225798",
        "url": "https://www.tiktok.com/@fleekink_/video/7152555008012225798",
        "username": "@fleekink_",
        "authorName": "Fleek Ink",
        "description": "Fresh combination brows for this cutie 🥰 visit our salon🇨🇭 #fyp #microblading #fypシ #switzerland #viral #brows #mua ",
        "likes": 3100000,
        "comments": 5559,
        "shares": 40400,
        "views": 29400000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/3a253d2ad0a347619b24d8510356b814_1665333997~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=7qfLAflNef%2Btco%2BDm%2BDYS4pVztY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:33",
        "engagement": 10.7
      },
      {
        "id": "7104608619685039366",
        "url": "https://www.tiktok.com/@fleekink_/video/7104608619685039366",
        "username": "@fleekink_",
        "authorName": "Fleek Ink",
        "description": "Brows done with love🫶🏼🤍 #fyp #microblading #viral #fypシ #switzerland #brows",
        "likes": 2100000,
        "comments": 6684,
        "shares": 19300,
        "views": 16000000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/79903488c48e479d8de1ec4f8e9dacfb_1654170617~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=njPwoIPZhYlG2rB5oyUe1yj2jE0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:27",
        "engagement": 13.29
      },
      {
        "id": "7369995759107820806",
        "url": "https://www.tiktok.com/@metropolesoficial/video/7369995759107820806",
        "username": "@metropolesoficial",
        "authorName": "Metrópoles Oficial",
        "description": "Micropigmentação de #sobrancelha ainda é um assunto #polêmico: uns gostam e outros não. Mas a única opinião que realmente importa é do próprio cliente, verdade seja dita. E uma jovem viralizou por aparentemente não curtir tanto o resultado. Em um vídeo que viralizou nas redes sociais nesta sexta-feira (17/5), a cliente exibe as enormes sobrancelhas pigmentadas. Ela, porém, ainda não analisou o produto final. Foi só quando a responsável pela técnica passou um espelho para ela que a moça olhou com calma. A primeira reação dela foi perguntar se iria clarear. Logo após, disse que amou o resultado — mas internautas não acreditaram muito na afirmação. \"Eu acho que ela não gostou\" e \"Gente, ela claramente odiou isso\" foram algumas das reações. #TikTokNotícias ",
        "likes": 161000,
        "comments": 9498,
        "shares": 26500,
        "views": 7200000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/6ee399e60d0246f6906b4af9fd1ce4f1_1715960862~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=pnyluWVh1YJjReXW7it%2BzCE09%2BM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:25",
        "engagement": 2.74
      },
      {
        "id": "7553798283919887672",
        "url": "https://www.tiktok.com/@carlosmicroblading/video/7553798283919887672",
        "username": "@carlosmicroblading",
        "authorName": "Carlos Armando",
        "description": "Micropigmentação de sobrancelhas efeito híbrido #sobrancelhasperfeitas #designerdesobrancelhas #paravocê #viral ",
        "likes": 85500,
        "comments": 1956,
        "shares": 1911,
        "views": 702400,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/oI8osouxE0GHAFl2cDJIlQBecxT1BAD1EQ4fRU~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=SHyU%2Bb5CgGOl34Q7zgbeN%2BVqBQo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "1:00",
        "engagement": 12.72
      },
      {
        "id": "7317427337694350597",
        "url": "https://www.tiktok.com/@denissemathieu/video/7317427337694350597",
        "username": "@denissemathieu",
        "authorName": "Stay in Beauty",
        "description": "Magic microblading 🍀 #microblading #permanentmakeup #microbladingbrows #cejas #microbladingonline ",
        "likes": 68300,
        "comments": 1552,
        "shares": 1771,
        "views": 17700000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/040e279bfd544760b38ac7f058b914d8_1703721420~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=rnJzdTcSmVLrKO0kuXW%2F1Ia2dzM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:17",
        "engagement": 0.4
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
        "id": "7276194173223537922",
        "url": "https://www.tiktok.com/@unicorn_manes_bymykey/video/7276194173223537922",
        "username": "@unicorn_manes_bymykey",
        "authorName": "Mykey O'Halloran",
        "description": "@ManicPanicNYC #hairdye #hairgoals #hairdresser #hairstyles #hairart #haircolor #hairinspo #kids #childhood #hairprocess #rainbowhair #hair #hairsalon #hairart #art #rainbow #colorful #colour #candyhair #hairstyles #haircut #hairtok #hairchallenge #hairdyechallenge #haircolorchallenge ",
        "likes": 6500000,
        "comments": 86900,
        "shares": 402800,
        "views": 80800000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/99387826d0fb471ea03e34970032c181_1694121018~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=k9RFZrpep%2F81YwJJtHudu0q2MV0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3",
        "duration": "1:03",
        "engagement": 8.65
      },
      {
        "id": "7389791691730865413",
        "url": "https://www.tiktok.com/@kelvybrulee/video/7389791691730865413",
        "username": "@kelvybrulee",
        "authorName": "Kelvy Hernandez 🌸",
        "description": "Tu que opinas??? Te leo 👀 Aveces tu eres la que me saca lágrimas de felicidad, con esos ojos de agradecimiento!! Cuando la agradecida soy yo. GRACIAS por estar aquí ♥️  @𝐁 𝐑 𝐔 𝐋 𝐄 𝐄 by Kelvy&Yad @Wella Professionals #balayage #balayagecolombia #balayagebogotá #maquillaje #makeup #wellalatam #wellahaircolombia #bruleeloveforhair#bruleeloveforhair #balayagemiami #wellalatam #brulee #hairgoals #cuidadocapilarcolombia ",
        "likes": 4400000,
        "comments": 68600,
        "shares": 360500,
        "views": 48000000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4V1FvIlIRiaQ3cAloQUBHiSBCDU5xkA5IZ7V~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=7D1FQuFxBsGhifgCMcStr15BE%2Fo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "1:29",
        "engagement": 10.06
      },
      {
        "id": "7485483386207882526",
        "url": "https://www.tiktok.com/@michaelflorees7/video/7485483386207882526",
        "username": "@michaelflorees7",
        "authorName": "Michael Florees 🤎🦍",
        "description": "Cuantos tienen un barbero que se cree ojalatero ? 🤣🤣🤣🤣🤣🤣🤣🤣 #viral #viralvideo #viraltiktok #barbershop ",
        "likes": 955200,
        "comments": 3335,
        "shares": 55900,
        "views": 14400000,
        "cover": "https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/owkzOUHiPAmyBIZ8AEikexqBEPJQa6HiiCA3hI~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=xbq0dzlVMKeyyX4N891DAIJr6WE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:25",
        "engagement": 7.04
      },
      {
        "id": "7293608109619055914",
        "url": "https://www.tiktok.com/@ashleyseamour/video/7293608109619055914",
        "username": "@ashleyseamour",
        "authorName": "ashleyseamour",
        "description": "in my bob era 😎😎 ig: ashleyseamour  #shorthair #shorthaircut #hairtok #swifttok #taylorswift #lookwhatyoumademedo #hairtransformation #transition ",
        "likes": 932600,
        "comments": 2614,
        "shares": 37200,
        "views": 21700000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/7ce2d808f0574cf9af08055b550dff60_1698175489~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=JYtyy9642P7ThZqXU8%2BfdCCVVw0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3",
        "duration": "0:14",
        "engagement": 4.48
      },
      {
        "id": "7578680837609229575",
        "url": "https://www.tiktok.com/@elcirujano19/video/7578680837609229575",
        "username": "@elcirujano19",
        "authorName": "Yeison junior",
        "description": "Como te cambia un peinado  👁️👄👁️ #viral #barber ",
        "likes": 868600,
        "comments": 17500,
        "shares": 116800,
        "views": 19500000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/owlODjgdnEFOUgOpAmCZQxIZfHEBeBBULD4RLF~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=YytK8DjqfaeVLtN8CqDsdi5T5ig%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:14",
        "engagement": 5.14
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
        "id": "7555388524300602642",
        "url": "https://www.tiktok.com/@cemilanceria.id1/video/7555388524300602642",
        "username": "@cemilanceria.id1",
        "authorName": "cemilanceria.id",
        "description": "Mukbang telur pedas 🤤🤤 #promomakangajian #mukbang #asmr #foodlover #viral ",
        "likes": 2300000,
        "comments": 71100,
        "shares": 170300,
        "views": 118400000,
        "cover": "https://p16-sign-sg.tiktokcdn.com/tos-alisg-p-0037/oIYABIIabdEANEiadmcxhPOL9Biz0BVCokV9d~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=9KdWIsXR1q4z7PFsEdgXu8nbdSs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "1:24",
        "engagement": 2.15
      },
      {
        "id": "7377085807695301930",
        "url": "https://www.tiktok.com/@matadornetwork/video/7377085807695301930",
        "username": "@matadornetwork",
        "authorName": "Matador | Travel + Adventure",
        "description": "Dine in harmony with nature at Koi Pond Restaurant, where colorful koi fish create a mesmerizing backdrop 🐠 Would you dine here? 🍽️ 🎥 @LianlianKan  📍Food Town (Baofu Market Store) at Baoding City, Hebei Province in China  #koifish #koipond #chinatok #chinatravel #visitchina #restaurantlife ",
        "likes": 1600000,
        "comments": 5756,
        "shares": 225900,
        "views": 15200000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o4DaTEqBuIrYqFmEJSifFecH0nDvBRgngmEKAD~tplv-tiktokx-dmt-logom:tos-useast5-i-0068-tx/o0QDmYAlIK4KECOYfDxDicAAEDSPBgAIcgfFRW.image?dr=14573&x-expires=1769086800&x-signature=SdaDrCfegVVuuEfD18Hy6g9UvCI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "0:08",
        "engagement": 12.05
      },
      {
        "id": "7426387774657285422",
        "url": "https://www.tiktok.com/@yoha_ni/video/7426387774657285422",
        "username": "@yoha_ni",
        "authorName": "Melany",
        "description": "Probando los virales CORNDOGS de Tiktok!!! @MOCHINUT 🥔🍜🌶️ #mochinut #corndog #corndogs #asmrsound #asmr #mukbang #mukbangs #reviews #eat #food #foodie #foodreviews #viralvideo #viraltiktokvideo #fyp #fypシ #fyppppppppppppppppppppppp #paratii #spicy #koreancorndog ",
        "likes": 1300000,
        "comments": 7393,
        "shares": 93200,
        "views": 15200000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/a10e15f131f247b3901e14837a371702_1729090655~tplv-tiktokx-dmt-logom:tos-useast5-i-0068-tx/ooRIeAXH7QME5dAAigAA8OQGOfgmjejHkAL6qE.image?dr=14573&x-expires=1769086800&x-signature=Hu4jLVnJFzOTho2uGXkNpW4C3x4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "2:39",
        "engagement": 9.21
      },
      {
        "id": "7406072840102989086",
        "url": "https://www.tiktok.com/@nutritionbabe/video/7406072840102989086",
        "username": "@nutritionbabe",
        "authorName": "NutritionBabe",
        "description": "This Recipe has 23 Million TikTok views in the last 4 days!! @Logan we must be related because we have the same taste buds!  I think I met my veggie match ❤️❤️ These California Roll cukes are a 🔥👌🏻 I always recommend eating 2 cups of veggies by 2pm these are a perfect way to get that in 🥒🍣 #healthysnack #viralrecipe #viralvideo #tiktokrecipe #healthyrecipes #cucumbersalad #cucumberrecipes #californiaroll #veggies ",
        "likes": 749400,
        "comments": 1657,
        "shares": 68900,
        "views": 13100000,
        "cover": "https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/oUBJHBfMBss9ziYCmV4AAFqyiYIiqEZAIGbmUr~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=BQ0LfV%2BOmNvmFvRRAEKYqqqUn7E%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "1:05",
        "engagement": 6.26
      },
      {
        "id": "7551198326524333326",
        "url": "https://www.tiktok.com/@armando_elotes/video/7551198326524333326",
        "username": "@armando_elotes",
        "authorName": "Armando Elotes🌽",
        "description": "Chetos con elote no tiene falla🤤🌽 #armandoelotes #hermosillosonora #viral #paratiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii #elotespreparados ",
        "likes": 375400,
        "comments": 984,
        "shares": 99500,
        "views": 4800000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ogAHr4RVAfjXIDsILnAM7QgGsAoklAZE8MefgE~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=csbd88iocK0xT1aZCn5eRx3oeZM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my",
        "duration": "1:04",
        "engagement": 9.91
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
        "id": "7552960295677758742",
        "url": "https://www.tiktok.com/@pablovincerealpha/video/7552960295677758742",
        "username": "@pablovincerealpha",
        "authorName": "pablovincerealpha",
        "description": "Trabaja. #motivacion #motivacional #mentalidad #desarrollopersonal #viral #parati #pablovincere",
        "likes": 1100000,
        "comments": 2730,
        "shares": 100300,
        "views": 9200000,
        "cover": "https://p16-pu-sign-no.tiktokcdn-eu.com/tos-no1a-p-4864-no/owWDQCFT4lkQyZURFDDEQF06B7oggBfwBYEYfm~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=5%2BbYuZeC89%2FVlivOv7XstaRGE4U%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 13.08
      },
      {
        "id": "7176665140232752390",
        "url": "https://www.tiktok.com/@evolve_esp/video/7176665140232752390",
        "username": "@evolve_esp",
        "authorName": "Evolve",
        "description": "#seminariofenix #motivación #disciplina #objetivos #éxito #fyp #parati #viral #mentalidad #mindset #fitness #gym #success #metas #discipline #misión",
        "likes": 1100000,
        "comments": 1536,
        "shares": 59800,
        "views": 11700000,
        "cover": "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/3e2b127980384f3b8f003b46bd0ba2b8_1671066001~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=9WBOgVL0LD07OjJnd1gCk22Cv5k%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:30",
        "engagement": 9.93
      },
      {
        "id": "7578851281486286093",
        "url": "https://www.tiktok.com/@xbus2511033333/video/7578851281486286093",
        "username": "@xbus2511033333",
        "authorName": "xbus2511033333",
        "description": "#motivacion #desarrollopersonal #amor❤️ #relaciones #viral ",
        "likes": 513500,
        "comments": 4795,
        "shares": 229200,
        "views": 10700000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o4jGCf3cDH5SFgpIeaEfvtQXWCkQQQnA5cjWmA~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=0Ikf0M4DnZY4SoZJ%2BQJuCTZuuMQ%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:55",
        "engagement": 6.99
      },
      {
        "id": "7315150551006743854",
        "url": "https://www.tiktok.com/@carlyrivlin/video/7315150551006743854",
        "username": "@carlyrivlin",
        "authorName": "Carly",
        "description": "Replying to @amber its even better than i thought it would be",
        "likes": 467000,
        "comments": 1232,
        "shares": 16500,
        "views": 6200000,
        "cover": "https://p16-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/e71136ca84db4fde81410e3b2a19933b_1703191222~tplv-tiktokx-dmt-logom:tos-useast5-i-0068-tx/o44rCBjgEYrdKibZnAIkWAioSPgEEAt2niARB.image?dr=14573&x-expires=1769086800&x-signature=%2B62h2iP39vbezcNO2dZwQtZN%2F7U%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my3",
        "duration": "2:15",
        "engagement": 7.82
      },
      {
        "id": "7273419252034456864",
        "url": "https://www.tiktok.com/@flycare.sw/video/7273419252034456864",
        "username": "@flycare.sw",
        "authorName": "Flycare.sw",
        "description": "Mentoria Gratuita en Ig: @flycare.sw 📲🦁 #motivacion #viral #motivacional #parati #desarrollopersonal ",
        "likes": 209100,
        "comments": 1672,
        "shares": 25100,
        "views": 3000000,
        "cover": "https://p19-common-sign-useastred.tiktokcdn-eu.com/tos-useast2a-p-0037-euttp/f69175cadbdd4e368cbf784fc9f0718d_1693474894~tplv-tiktokx-origin.image?dr=14575&x-expires=1769086800&x-signature=MPEnCELzmfhxTg3%2BfqQj%2Fs4q3jg%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
        "duration": "0:13",
        "engagement": 7.86
      }
    ]
  }
];

// Función para formatear números
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Estadísticas globales
export const globalStats = {
  sectors: '10',
  videos: '50+',
  likes: '36.6M+',
  views: '647.9M+'
};
