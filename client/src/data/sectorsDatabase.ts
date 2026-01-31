// Base de datos de sectores para Lanzamientos en Caliente
// Cada sector incluye: problemas típicos, servicios estrella, objeciones, pruebas sociales y keywords

export interface SectorData {
  id: string;
  name: string;
  icon: string;
  problems: string[];
  services: string[];
  objections: string[];
  socialProofs: string[];
  keywords: string[];
  typicalOffers: string[];
  allowedObjectives?: string[]; // Objetivos permitidos para este sector (opcional, se calcula dinámicamente)
}

// Mapeo de objetivos disponibles
export const allObjectives = [
  { value: "citas", label: "Conseguir citas", icon: "📅", sectors: ["clinica-estetica", "odontologia", "fisioterapia", "veterinaria", "peluqueria", "gimnasio", "formacion", "abogado", "gestoria", "psicologia", "nutricion", "manicura", "micropigmentacion", "personal-trainer", "coaching"] },
  { value: "leads_whatsapp", label: "Leads por WhatsApp", icon: "💬", sectors: "all" }, // Disponible para todos
  { value: "vender_servicio", label: "Vender un servicio", icon: "🛠️", sectors: "all" }, // Disponible para todos
  { value: "vender_producto", label: "Vender un producto", icon: "📦", sectors: ["restaurante", "tienda-ropa", "floristeria", "joyeria", "optica", "farmacia", "panaderia", "carniceria", "fruteria", "tienda-deportes", "libreria", "jugueteria"] },
  { value: "captar_propietarios", label: "Captar propietarios", icon: "🏠", sectors: ["inmobiliaria"] }, // Solo inmobiliaria
  { value: "captar_empleados", label: "Captar empleados", icon: "👥", sectors: ["restaurante", "gimnasio", "limpieza", "reformas", "taller-mecanico", "agencia-marketing"] },
] as const;

// Función para obtener objetivos permitidos por sector
export function getObjectivesForSector(sectorId: string) {
  return allObjectives.filter(obj => {
    if (obj.sectors === "all") return true;
    return (obj.sectors as readonly string[]).includes(sectorId);
  });
}

export const sectorsDatabase: SectorData[] = [
  {
    id: "taller-mecanico",
    name: "Taller Mecánico",
    icon: "🔧",
    problems: [
      "El coche hace ruidos extraños",
      "Frenos que chirrían",
      "Consumo excesivo de combustible",
      "Luces del salpicadero encendidas",
      "ITV próxima y no sé si pasará"
    ],
    services: ["Revisión pre-ITV", "Cambio de aceite", "Frenos", "Neumáticos", "Diagnosis electrónica"],
    objections: ["Es muy caro", "No tengo tiempo", "Ya tengo mi mecánico de confianza"],
    socialProofs: ["Reseñas Google", "Fotos antes/después", "Años de experiencia", "Coches atendidos"],
    keywords: ["COCHE", "REVISION", "ITV", "FRENOS"],
    typicalOffers: ["Revisión rápida 15 puntos", "Diagnosis gratuita", "Pre-ITV sin compromiso", "Cambio de aceite express"]
  },
  {
    id: "inmobiliaria",
    name: "Inmobiliaria",
    icon: "🏠",
    problems: [
      "Quiero vender mi piso rápido",
      "No sé cuánto vale mi casa",
      "Llevo meses sin vender",
      "Inquilinos problemáticos",
      "Busco piso y no encuentro"
    ],
    services: ["Valoración gratuita", "Gestión de venta", "Alquiler seguro", "Home staging", "Fotografía profesional"],
    objections: ["Las comisiones son muy altas", "Puedo venderlo yo solo", "Ya tengo otra inmobiliaria"],
    socialProofs: ["Pisos vendidos este mes", "Tiempo medio de venta", "Reseñas de clientes", "Casos de éxito"],
    keywords: ["PISO", "CASA", "VENDER", "VALORACION"],
    typicalOffers: ["Valoración gratuita en 24h", "Vendemos tu piso en 60 días o te devolvemos la comisión", "Fotos profesionales gratis"]
  },
  {
    id: "clinica-estetica",
    name: "Clínica Estética",
    icon: "💉",
    problems: [
      "Arrugas que me preocupan",
      "Ojeras marcadas",
      "Flacidez facial",
      "Labios finos",
      "Manchas en la piel"
    ],
    services: ["Botox", "Ácido hialurónico", "Mesoterapia", "Peeling", "Radiofrecuencia"],
    objections: ["Me da miedo el resultado", "Es muy caro", "No quiero que se note"],
    socialProofs: ["Fotos antes/después", "Años de experiencia", "Pacientes satisfechos", "Certificaciones"],
    keywords: ["CITA", "CONSULTA", "INFO", "TRATAMIENTO"],
    typicalOffers: ["Valoración gratuita", "Primera sesión al 50%", "Pack rejuvenecimiento", "Diagnóstico facial gratis"]
  },
  {
    id: "odontologia",
    name: "Clínica Dental",
    icon: "🦷",
    problems: [
      "Dolor de muelas",
      "Dientes amarillos",
      "Encías sangrantes",
      "Miedo al dentista",
      "Necesito ortodoncia"
    ],
    services: ["Limpieza dental", "Blanqueamiento", "Implantes", "Ortodoncia invisible", "Empastes"],
    objections: ["Me da pánico ir al dentista", "Es muy caro", "No tengo tiempo"],
    socialProofs: ["Sonrisas transformadas", "Años sin dolor", "Reseñas 5 estrellas", "Tecnología de última generación"],
    keywords: ["SONRISA", "CITA", "DIENTES", "LIMPIEZA"],
    typicalOffers: ["Revisión + limpieza gratis", "Blanqueamiento al 40%", "Primera consulta sin coste", "Financiación sin intereses"]
  },
  {
    id: "abogado",
    name: "Abogado / Despacho",
    icon: "⚖️",
    problems: [
      "Me han despedido injustamente",
      "Problemas con mi casero",
      "Divorcio complicado",
      "Multa que quiero recurrir",
      "Herencia conflictiva"
    ],
    services: ["Consulta inicial", "Despidos", "Divorcios", "Reclamaciones", "Herencias"],
    objections: ["Los abogados son muy caros", "No sé si tengo caso", "Ya lo intenté y perdí"],
    socialProofs: ["Casos ganados", "Años de experiencia", "Especialización", "Clientes satisfechos"],
    keywords: ["CONSULTA", "CASO", "AYUDA", "INFO"],
    typicalOffers: ["Primera consulta gratuita", "Valoración de tu caso sin compromiso", "Solo cobro si gano", "Consulta express 15min"]
  },
  {
    id: "gestoria",
    name: "Gestoría / Asesoría",
    icon: "📋",
    problems: [
      "Declaración de la renta",
      "Alta de autónomo",
      "Impuestos atrasados",
      "No entiendo mis facturas",
      "Multa de Hacienda"
    ],
    services: ["Renta", "Autónomos", "Sociedades", "Nóminas", "Contabilidad"],
    objections: ["Ya tengo gestor", "Es muy caro para lo que facturo", "Puedo hacerlo yo online"],
    socialProofs: ["Clientes autónomos", "Años de experiencia", "Ahorro medio en impuestos", "Cero sanciones"],
    keywords: ["RENTA", "AUTONOMO", "CONSULTA", "AYUDA"],
    typicalOffers: ["Primera consulta gratis", "Renta desde 30€", "Alta de autónomo incluida", "Primer mes gratis"]
  },
  {
    id: "restaurante",
    name: "Restaurante / Bar",
    icon: "🍽️",
    problems: [
      "No sé dónde comer hoy",
      "Busco sitio para celebración",
      "Quiero probar algo nuevo",
      "Necesito reservar mesa",
      "Busco menú del día bueno"
    ],
    services: ["Menú del día", "Carta", "Eventos", "Take away", "Catering"],
    objections: ["Está lejos", "Es caro", "No conozco el sitio"],
    socialProofs: ["Reseñas Google", "Fotos de platos", "Años abiertos", "Clientes habituales"],
    keywords: ["MESA", "RESERVA", "MENU", "HOY"],
    typicalOffers: ["Menú del día 12€", "Copa de vino gratis con tu cena", "Postre gratis si reservas hoy", "2x1 en cenas"]
  },
  {
    id: "gimnasio",
    name: "Gimnasio / Entrenador",
    icon: "💪",
    problems: [
      "Quiero perder peso",
      "No tengo motivación",
      "No sé cómo entrenar",
      "Me aburro en el gym",
      "Quiero ganar músculo"
    ],
    services: ["Entrenamiento personal", "Clases grupales", "Nutrición", "Planes online", "Seguimiento"],
    objections: ["No tengo tiempo", "Es muy caro", "Ya lo intenté y no funcionó"],
    socialProofs: ["Transformaciones", "Kilos perdidos", "Clientes activos", "Años de experiencia"],
    keywords: ["ENTRENO", "PRUEBA", "INFO", "CITA"],
    typicalOffers: ["Clase de prueba gratis", "Primera semana sin compromiso", "Valoración física gratuita", "Plan personalizado"]
  },
  {
    id: "reformas",
    name: "Reformas / Construcción",
    icon: "🔨",
    problems: [
      "Baño antiguo",
      "Cocina pequeña",
      "Humedades",
      "Quiero ampliar espacio",
      "Piso recién comprado"
    ],
    services: ["Reforma integral", "Baños", "Cocinas", "Pintura", "Electricidad"],
    objections: ["Es muy caro", "Tardan mucho", "Malas experiencias anteriores"],
    socialProofs: ["Fotos antes/después", "Obras terminadas", "Años de experiencia", "Presupuestos cumplidos"],
    keywords: ["PRESUPUESTO", "REFORMA", "OBRA", "INFO"],
    typicalOffers: ["Presupuesto sin compromiso", "Visita gratuita", "Precio cerrado garantizado", "Financiación disponible"]
  },
  {
    id: "limpieza",
    name: "Limpieza Profesional",
    icon: "🧹",
    problems: [
      "No tengo tiempo para limpiar",
      "Mudanza y piso sucio",
      "Oficina que necesita limpieza",
      "Limpieza a fondo",
      "Cristales imposibles"
    ],
    services: ["Limpieza hogar", "Oficinas", "Fin de obra", "Cristales", "Limpieza profunda"],
    objections: ["Prefiero hacerlo yo", "No me fío de extraños en casa", "Es caro"],
    socialProofs: ["Casas limpias", "Clientes recurrentes", "Años de experiencia", "Seguro incluido"],
    keywords: ["LIMPIEZA", "PRESUPUESTO", "INFO", "CITA"],
    typicalOffers: ["Primera limpieza al 20% dto", "Presupuesto gratis", "Prueba sin compromiso", "Pack mensual"]
  },
  {
    id: "peluqueria",
    name: "Peluquería / Barbería",
    icon: "💇",
    problems: [
      "Necesito un cambio de look",
      "Pelo dañado",
      "Canas que cubrir",
      "Corte urgente",
      "Barba descuidada"
    ],
    services: ["Corte", "Color", "Mechas", "Tratamientos", "Barba"],
    objections: ["Ya tengo mi peluquero", "Es caro", "No sé qué me queda bien"],
    socialProofs: ["Fotos de trabajos", "Años de experiencia", "Clientes fieles", "Productos premium"],
    keywords: ["CITA", "CORTE", "LOOK", "HOY"],
    typicalOffers: ["Corte + lavado 15€", "Diagnóstico capilar gratis", "Primera visita 20% dto", "Corte + barba pack"]
  },
  {
    id: "fisioterapia",
    name: "Fisioterapia / Osteopatía",
    icon: "🏥",
    problems: [
      "Dolor de espalda crónico",
      "Lesión deportiva",
      "Contracturas",
      "Dolor de cuello",
      "Recuperación post-operatoria"
    ],
    services: ["Masaje terapéutico", "Rehabilitación", "Punción seca", "Osteopatía", "Electroterapia"],
    objections: ["Ya fui y no mejoré", "Es caro", "No tengo tiempo"],
    socialProofs: ["Pacientes recuperados", "Años de experiencia", "Especialización deportiva", "Reseñas"],
    keywords: ["CITA", "DOLOR", "SESION", "INFO"],
    typicalOffers: ["Valoración gratuita", "Primera sesión al 50%", "Pack 5 sesiones", "Diagnóstico sin coste"]
  },
  {
    id: "veterinaria",
    name: "Veterinaria",
    icon: "🐾",
    problems: [
      "Mi mascota está enferma",
      "Vacunas pendientes",
      "Revisión anual",
      "Comportamiento extraño",
      "Urgencia veterinaria"
    ],
    services: ["Consulta", "Vacunación", "Cirugía", "Peluquería canina", "Urgencias"],
    objections: ["Es muy caro", "Mi mascota se estresa", "Ya tengo veterinario"],
    socialProofs: ["Mascotas atendidas", "Años de experiencia", "Urgencias 24h", "Reseñas de clientes"],
    keywords: ["CITA", "MASCOTA", "URGENCIA", "INFO"],
    typicalOffers: ["Primera consulta gratis", "Pack vacunación completo", "Revisión + desparasitación", "Urgencias sin espera"]
  },
  {
    id: "formacion",
    name: "Formación / Academia",
    icon: "📚",
    problems: [
      "Quiero mejorar mi inglés",
      "Necesito certificación",
      "Mi hijo suspende",
      "Quiero cambiar de carrera",
      "Oposiciones"
    ],
    services: ["Clases particulares", "Cursos online", "Preparación exámenes", "Oposiciones", "Idiomas"],
    objections: ["No tengo tiempo", "Es caro", "Ya lo intenté"],
    socialProofs: ["Alumnos aprobados", "Tasa de éxito", "Años de experiencia", "Metodología propia"],
    keywords: ["CLASE", "INFO", "PRUEBA", "CURSO"],
    typicalOffers: ["Clase de prueba gratis", "Primera semana sin compromiso", "Diagnóstico de nivel gratuito", "Matrícula gratis"]
  },
  {
    id: "ecommerce-local",
    name: "Tienda Local / E-commerce",
    icon: "🛍️",
    problems: [
      "Busco regalo original",
      "Necesito algo urgente",
      "Quiero producto de calidad",
      "Prefiero comprar local",
      "Busco asesoramiento"
    ],
    services: ["Venta presencial", "Envío a domicilio", "Asesoramiento", "Regalos personalizados", "Reservas"],
    objections: ["Es más caro que online", "No sé si me gustará", "Prefiero Amazon"],
    socialProofs: ["Años en el barrio", "Clientes satisfechos", "Productos exclusivos", "Atención personalizada"],
    keywords: ["INFO", "RESERVA", "COMPRA", "REGALO"],
    typicalOffers: ["Envío gratis hoy", "10% dto primera compra", "Regalo con tu pedido", "Reserva sin compromiso"]
  },
  {
    id: "marketing-agencia",
    name: "Agencia de Marketing",
    icon: "📱",
    problems: [
      "No tengo clientes",
      "Redes sociales abandonadas",
      "Web desactualizada",
      "No sé hacer publicidad",
      "Competencia me supera"
    ],
    services: ["Redes sociales", "Publicidad online", "Web", "SEO", "Branding"],
    objections: ["Es muy caro", "Ya lo intenté sin resultados", "Puedo hacerlo yo"],
    socialProofs: ["Clientes activos", "Resultados medibles", "Casos de éxito", "ROI demostrado"],
    keywords: ["CONSULTA", "AUDITORIA", "INFO", "ESTRATEGIA"],
    typicalOffers: ["Auditoría gratuita", "Consulta estratégica 30min", "Primer mes al 50%", "Diagnóstico de redes gratis"]
  },
  {
    id: "fotografo",
    name: "Fotógrafo / Videógrafo",
    icon: "📸",
    problems: [
      "Boda próxima",
      "Necesito fotos profesionales",
      "Evento importante",
      "Fotos para mi negocio",
      "Book personal"
    ],
    services: ["Bodas", "Eventos", "Retratos", "Producto", "Vídeo corporativo"],
    objections: ["Es muy caro", "Tengo buen móvil", "No sé si me gustará el resultado"],
    socialProofs: ["Portfolio", "Bodas fotografiadas", "Años de experiencia", "Premios"],
    keywords: ["BODA", "SESION", "INFO", "PRESUPUESTO"],
    typicalOffers: ["Sesión de prueba 50€", "Presupuesto sin compromiso", "Mini sesión 30min", "Pack redes sociales"]
  },
  {
    id: "psicologo",
    name: "Psicólogo / Terapeuta",
    icon: "🧠",
    problems: [
      "Ansiedad constante",
      "Problemas de pareja",
      "Depresión",
      "Estrés laboral",
      "Problemas de autoestima"
    ],
    services: ["Terapia individual", "Terapia de pareja", "Ansiedad", "Coaching", "Online"],
    objections: ["No creo en psicólogos", "Es muy caro", "Me da vergüenza"],
    socialProofs: ["Pacientes atendidos", "Años de experiencia", "Especialización", "Sesiones online disponibles"],
    keywords: ["CITA", "SESION", "AYUDA", "INFO"],
    typicalOffers: ["Primera sesión al 50%", "Consulta inicial gratuita", "Sesión online disponible", "Valoración sin compromiso"]
  },
  {
    id: "nutricionista",
    name: "Nutricionista / Dietista",
    icon: "🥗",
    problems: [
      "Quiero perder peso",
      "No sé qué comer",
      "Digestiones pesadas",
      "Intolerancias",
      "Dieta para deportistas"
    ],
    services: ["Plan nutricional", "Seguimiento", "Análisis corporal", "Dietas especiales", "Coaching nutricional"],
    objections: ["Las dietas no me funcionan", "Es caro", "No tengo fuerza de voluntad"],
    socialProofs: ["Kilos perdidos por clientes", "Transformaciones", "Años de experiencia", "Método propio"],
    keywords: ["DIETA", "CITA", "INFO", "PLAN"],
    typicalOffers: ["Valoración nutricional gratis", "Primera consulta al 50%", "Plan personalizado", "Seguimiento incluido"]
  },
  {
    id: "seguros",
    name: "Seguros / Correduría",
    icon: "🛡️",
    problems: [
      "Pago mucho de seguro",
      "No sé si estoy bien cubierto",
      "Siniestro reciente",
      "Cambio de coche/casa",
      "Seguro de vida"
    ],
    services: ["Comparativa", "Hogar", "Coche", "Vida", "Salud"],
    objections: ["Ya tengo seguro", "Todos son iguales", "No me fío de corredores"],
    socialProofs: ["Clientes asegurados", "Ahorro medio", "Años de experiencia", "Compañías disponibles"],
    keywords: ["SEGURO", "AHORRO", "INFO", "COMPARATIVA"],
    typicalOffers: ["Comparativa gratuita", "Te mejoro tu seguro o te regalo X", "Estudio sin compromiso", "Ahorra hasta 40%"]
  },
  {
    id: "cerrajero",
    name: "Cerrajero / Urgencias",
    icon: "🔑",
    problems: [
      "Me he quedado fuera de casa",
      "Cerradura atascada",
      "Quiero cambiar la cerradura",
      "Robo reciente",
      "Copia de llaves"
    ],
    services: ["Apertura urgente", "Cambio cerradura", "Cerraduras de seguridad", "Copias", "Cajas fuertes"],
    objections: ["Son muy caros", "No sé si son de fiar", "Llamaré a otro"],
    socialProofs: ["Aperturas realizadas", "Tiempo de respuesta", "Años de experiencia", "Precio cerrado"],
    keywords: ["URGENCIA", "CERRAJERO", "AYUDA", "AHORA"],
    typicalOffers: ["Presupuesto antes de actuar", "Sin cobrar desplazamiento", "Precio cerrado sin sorpresas", "Llegamos en 20min"]
  },
  {
    id: "electricista",
    name: "Electricista",
    icon: "⚡",
    problems: [
      "Apagones frecuentes",
      "Instalación antigua",
      "Enchufes que no funcionan",
      "Boletín eléctrico",
      "Subida de potencia"
    ],
    services: ["Reparaciones", "Instalaciones nuevas", "Boletín", "Iluminación", "Domótica"],
    objections: ["Es caro", "Ya tengo electricista", "Puedo hacerlo yo"],
    socialProofs: ["Instalaciones realizadas", "Años de experiencia", "Certificaciones", "Urgencias atendidas"],
    keywords: ["ELECTRICISTA", "URGENCIA", "PRESUPUESTO", "INFO"],
    typicalOffers: ["Presupuesto sin compromiso", "Revisión gratuita", "Urgencias 24h", "Precio cerrado"]
  },
  {
    id: "fontanero",
    name: "Fontanero",
    icon: "🚿",
    problems: [
      "Fuga de agua",
      "Atasco en tuberías",
      "Calentador no funciona",
      "Humedad en pared",
      "Cisterna rota"
    ],
    services: ["Reparaciones", "Desatascos", "Calentadores", "Instalaciones", "Urgencias"],
    objections: ["Son muy caros", "Ya tengo fontanero", "Intentaré arreglarlo yo"],
    socialProofs: ["Reparaciones realizadas", "Tiempo de respuesta", "Años de experiencia", "Sin sorpresas en factura"],
    keywords: ["FONTANERO", "URGENCIA", "FUGA", "AYUDA"],
    typicalOffers: ["Presupuesto antes de actuar", "Desplazamiento incluido", "Urgencias 24h", "Garantía en reparaciones"]
  },
  {
    id: "mudanzas",
    name: "Mudanzas / Transportes",
    icon: "📦",
    problems: [
      "Me mudo de casa",
      "Necesito transportar muebles",
      "Mudanza urgente",
      "Guardamuebles",
      "Mudanza de oficina"
    ],
    services: ["Mudanza completa", "Transporte", "Embalaje", "Guardamuebles", "Montaje/desmontaje"],
    objections: ["Es muy caro", "Tengo amigos que me ayudan", "Me da miedo que rompan algo"],
    socialProofs: ["Mudanzas realizadas", "Años de experiencia", "Seguro incluido", "Reseñas"],
    keywords: ["MUDANZA", "PRESUPUESTO", "INFO", "TRANSPORTE"],
    typicalOffers: ["Presupuesto sin compromiso", "Visita gratuita", "Embalaje incluido", "Seguro a todo riesgo"]
  },
  {
    id: "jardineria",
    name: "Jardinería / Paisajismo",
    icon: "🌱",
    problems: [
      "Jardín abandonado",
      "Plagas en plantas",
      "Quiero diseñar mi jardín",
      "Mantenimiento periódico",
      "Poda de árboles"
    ],
    services: ["Mantenimiento", "Diseño", "Poda", "Riego automático", "Césped artificial"],
    objections: ["Es caro", "Puedo hacerlo yo", "No tengo mucho jardín"],
    socialProofs: ["Jardines cuidados", "Años de experiencia", "Fotos de trabajos", "Clientes recurrentes"],
    keywords: ["JARDIN", "PRESUPUESTO", "INFO", "MANTENIMIENTO"],
    typicalOffers: ["Visita + presupuesto gratis", "Primera poda al 20%", "Pack mantenimiento mensual", "Diseño incluido"]
  },
  {
    id: "autoescuela",
    name: "Autoescuela",
    icon: "🚗",
    problems: [
      "Quiero sacarme el carnet",
      "He suspendido varias veces",
      "Miedo a conducir",
      "Recuperar puntos",
      "Carnet de moto"
    ],
    services: ["Carnet B", "Moto", "Recuperación puntos", "Clases intensivas", "Renovación"],
    objections: ["Es muy caro", "No tengo tiempo", "Ya suspendí antes"],
    socialProofs: ["Tasa de aprobados", "Años de experiencia", "Alumnos satisfechos", "Coches nuevos"],
    keywords: ["CARNET", "INFO", "CLASE", "PRUEBA"],
    typicalOffers: ["Clase de prueba gratis", "Matrícula gratis", "Pack intensivo", "Aprueba o te devolvemos el dinero"]
  },
  {
    id: "optica",
    name: "Óptica",
    icon: "👓",
    problems: [
      "Veo borroso",
      "Dolor de cabeza frecuente",
      "Gafas rotas",
      "Quiero lentillas",
      "Revisión de vista"
    ],
    services: ["Graduación", "Gafas", "Lentillas", "Gafas de sol", "Revisión"],
    objections: ["Las gafas son caras", "Compro online más barato", "Ya tengo óptica"],
    socialProofs: ["Clientes satisfechos", "Años de experiencia", "Marcas disponibles", "Garantía"],
    keywords: ["GAFAS", "REVISION", "CITA", "INFO"],
    typicalOffers: ["Revisión gratuita", "2x1 en gafas", "Lentillas de prueba gratis", "Graduación sin compromiso"]
  },
  {
    id: "farmacia",
    name: "Farmacia / Parafarmacia",
    icon: "💊",
    problems: [
      "Necesito consejo de salud",
      "Productos de dermofarmacia",
      "Medicamentos urgentes",
      "Análisis rápidos",
      "Productos naturales"
    ],
    services: ["Dispensación", "Dermofarmacia", "Nutrición", "Análisis", "Formulación"],
    objections: ["Es más caro que en internet", "No necesito consejo", "Voy a la que me pilla"],
    socialProofs: ["Años en el barrio", "Farmacéuticos titulados", "Servicio personalizado", "Clientes fieles"],
    keywords: ["FARMACIA", "CONSEJO", "INFO", "SALUD"],
    typicalOffers: ["Análisis gratuito", "Consejo personalizado", "Muestras gratis", "Descuento primera compra"]
  },
  {
    id: "joyeria",
    name: "Joyería / Relojería",
    icon: "💎",
    problems: [
      "Busco anillo de compromiso",
      "Regalo especial",
      "Reloj estropeado",
      "Joya para arreglar",
      "Tasación de joyas"
    ],
    services: ["Venta", "Reparación", "Tasación", "Personalización", "Grabados"],
    objections: ["Es muy caro", "Compro online", "No sé de joyas"],
    socialProofs: ["Años de tradición", "Piezas únicas", "Clientes satisfechos", "Certificaciones"],
    keywords: ["JOYA", "INFO", "CITA", "REGALO"],
    typicalOffers: ["Tasación gratuita", "Grabado incluido", "Limpieza gratis", "Financiación sin intereses"]
  },
  {
    id: "floristeria",
    name: "Floristería",
    icon: "💐",
    problems: [
      "Necesito flores urgentes",
      "Regalo para ocasión especial",
      "Decoración de evento",
      "Plantas para casa/oficina",
      "Flores para funeral"
    ],
    services: ["Ramos", "Plantas", "Decoración eventos", "Suscripción", "Entrega a domicilio"],
    objections: ["Las flores son caras", "Se mueren rápido", "Compro en el super"],
    socialProofs: ["Ramos entregados", "Años de experiencia", "Flores frescas diarias", "Reseñas"],
    keywords: ["FLORES", "RAMO", "REGALO", "HOY"],
    typicalOffers: ["Envío gratis hoy", "Ramo del día", "Tarjeta personalizada gratis", "Descuento primera compra"]
  },
  {
    id: "manicura",
    name: "Manicura / Uñas",
    icon: "💅",
    problems: [
      "Uñas rotas o débiles",
      "Quiero uñas bonitas para evento",
      "Manicura que dure",
      "Diseños originales",
      "Uñas mordidas"
    ],
    services: ["Manicura", "Pedicura", "Uñas de gel", "Acrílicas", "Nail art"],
    objections: ["Es caro", "Se estropean rápido", "Ya tengo mi sitio"],
    socialProofs: ["Fotos de trabajos", "Clientas fieles", "Años de experiencia", "Productos de calidad"],
    keywords: ["UÑAS", "CITA", "MANICURA", "HOY"],
    typicalOffers: ["Primera manicura 20% dto", "Manicura + pedicura pack", "Diseño gratis", "Relleno incluido"]
  },
  {
    id: "micropigmentacion",
    name: "Micropigmentación",
    icon: "✨",
    problems: [
      "Cejas poco pobladas",
      "Labios sin definición",
      "Maquillaje diario cansado",
      "Cicatrices que ocultar",
      "Areolas post-mastectomía"
    ],
    services: ["Cejas", "Labios", "Eyeliner", "Capilar", "Paramédica"],
    objections: ["Me da miedo el dolor", "Y si no me gusta", "Es muy caro"],
    socialProofs: ["Fotos antes/después", "Años de experiencia", "Certificaciones", "Clientas satisfechas"],
    keywords: ["CEJAS", "CITA", "INFO", "CONSULTA"],
    typicalOffers: ["Consulta gratuita", "Diseño previo sin compromiso", "Retoque incluido", "Financiación disponible"]
  },
  {
    id: "coaching",
    name: "Coach / Consultor",
    icon: "🎯",
    problems: [
      "Estancado profesionalmente",
      "No sé qué quiero",
      "Problemas de liderazgo",
      "Cambio de carrera",
      "Emprender un negocio"
    ],
    services: ["Coaching ejecutivo", "Coaching personal", "Mentoring", "Consultoría", "Formación"],
    objections: ["No creo en coaches", "Es muy caro", "Puedo hacerlo solo"],
    socialProofs: ["Clientes transformados", "Años de experiencia", "Certificaciones", "Testimonios"],
    keywords: ["SESION", "INFO", "CONSULTA", "CAMBIO"],
    typicalOffers: ["Sesión de descubrimiento gratis", "Primera sesión al 50%", "Diagnóstico sin compromiso", "Garantía de resultados"]
  }
];

// Función para detectar sector por texto
export const detectSectorFromText = (text: string): SectorData | null => {
  const normalizedText = text.toLowerCase();
  
  const sectorKeywords: { [key: string]: string[] } = {
    "taller-mecanico": ["taller", "mecánico", "mecanico", "coche", "auto", "vehículo", "vehiculo", "itv", "frenos", "aceite"],
    "inmobiliaria": ["inmobiliaria", "piso", "casa", "vender", "alquiler", "vivienda", "propiedad", "inmueble"],
    "clinica-estetica": ["estética", "estetica", "botox", "hialurónico", "hialuronico", "arrugas", "rejuvenecimiento", "facial"],
    "odontologia": ["dentista", "dental", "dientes", "odontología", "odontologia", "sonrisa", "blanqueamiento", "ortodoncia"],
    "abogado": ["abogado", "abogada", "despacho", "legal", "jurídico", "juridico", "despido", "divorcio", "herencia"],
    "gestoria": ["gestoría", "gestoria", "asesoría", "asesoria", "renta", "autónomo", "autonomo", "impuestos", "hacienda"],
    "restaurante": ["restaurante", "bar", "comida", "menú", "menu", "cocina", "cena", "almuerzo"],
    "gimnasio": ["gimnasio", "gym", "entrenador", "fitness", "entrenar", "ejercicio", "personal trainer"],
    "reformas": ["reformas", "reforma", "construcción", "construccion", "obra", "baño", "cocina", "pintura"],
    "limpieza": ["limpieza", "limpiar", "hogar", "oficina", "cristales", "doméstico", "domestico"],
    "peluqueria": ["peluquería", "peluqueria", "barbería", "barberia", "corte", "pelo", "cabello", "tinte"],
    "fisioterapia": ["fisioterapia", "fisio", "masaje", "rehabilitación", "rehabilitacion", "dolor", "espalda", "contractura"],
    "veterinaria": ["veterinaria", "veterinario", "mascota", "perro", "gato", "animal", "vacuna"],
    "formacion": ["formación", "formacion", "academia", "curso", "clases", "profesor", "inglés", "ingles", "oposiciones"],
    "ecommerce-local": ["tienda", "comercio", "venta", "productos", "local", "comprar"],
    "marketing-agencia": ["marketing", "agencia", "redes sociales", "publicidad", "web", "digital", "seo"],
    "fotografo": ["fotógrafo", "fotografo", "fotografía", "fotografia", "boda", "evento", "vídeo", "video"],
    "psicologo": ["psicólogo", "psicologo", "psicología", "psicologia", "terapia", "terapeuta", "ansiedad", "depresión"],
    "nutricionista": ["nutricionista", "nutrición", "nutricion", "dietista", "dieta", "alimentación", "alimentacion"],
    "seguros": ["seguros", "seguro", "correduría", "correduria", "póliza", "poliza", "aseguradora"],
    "cerrajero": ["cerrajero", "cerradura", "llave", "puerta", "apertura"],
    "electricista": ["electricista", "electricidad", "eléctrico", "electrico", "enchufe", "luz", "instalación eléctrica"],
    "fontanero": ["fontanero", "fontanería", "fontaneria", "tubería", "tuberia", "fuga", "agua", "desatasco"],
    "mudanzas": ["mudanza", "mudanzas", "transporte", "muebles", "traslado"],
    "jardineria": ["jardinería", "jardineria", "jardín", "jardin", "plantas", "poda", "césped", "cesped"],
    "autoescuela": ["autoescuela", "carnet", "conducir", "permiso", "coche"],
    "optica": ["óptica", "optica", "gafas", "lentillas", "vista", "graduación", "graduacion"],
    "farmacia": ["farmacia", "medicamentos", "salud", "parafarmacia"],
    "joyeria": ["joyería", "joyeria", "joyas", "reloj", "anillo", "oro", "plata"],
    "floristeria": ["floristería", "floristeria", "flores", "ramo", "plantas", "decoración floral"],
    "manicura": ["manicura", "uñas", "pedicura", "nail", "gel", "acrílicas"],
    "micropigmentacion": ["micropigmentación", "micropigmentacion", "cejas", "microblading", "labios permanente"],
    "coaching": ["coach", "coaching", "consultor", "consultoría", "consultoria", "mentor", "mentoring"]
  };
  
  for (const [sectorId, keywords] of Object.entries(sectorKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        return sectorsDatabase.find(s => s.id === sectorId) || null;
      }
    }
  }
  
  return null;
};

// Obtener todos los nombres de sectores para el selector
export const getSectorNames = (): { id: string; name: string; icon: string }[] => {
  return sectorsDatabase.map(s => ({ id: s.id, name: s.name, icon: s.icon }));
};

// Obtener sector por ID
export const getSectorById = (id: string): SectorData | undefined => {
  return sectorsDatabase.find(s => s.id === id);
};
