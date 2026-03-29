# ViralPro - Project TODO

## Auditoría Completa - Marzo 2026
- [x] Revisar todas las páginas de la app en el navegador
- [x] Verificar que todas las imágenes cargan correctamente
- [x] Verificar que el calendario funciona con fechas actuales (marzo 2026)
- [x] Verificar que el sistema de búsqueda de reels funciona
- [x] Verificar que el panel admin funciona
- [x] Verificar que la página de precios funciona
- [x] Corregir todos los bugs encontrados
- [x] Actualizar fechas hardcodeadas a marzo 2026
- [x] Verificar que los tests pasan (49 tests, 11 archivos - todos OK)
- [x] Guardar checkpoint final (d884f76b)

## Endpoint Calendario Real
- [x] Crear endpoint calendar.getApprovedReels en routers.ts
- [x] Reescribir Calendar.tsx para usar datos reales con fallback estático

## Bugs Corregidos
- [x] Fix: Stories.tsx error JSX "Unterminated JSX contents" - verificado como falso positivo de Vite HMR, tsc compila OK
- [x] Fix: Dashboard análisis con estado "Error" - error "Análisis expirado" de cron job antiguo ya eliminado, error handler mejorado para guardar mensajes reales
- [x] Fix: Admin Reels "Todos (0)" con 1 aprobado - filtro de sector funciona correctamente, el conteo de "Todos" solo cuenta pendientes
- [x] Fix: Navbar items comprimidos - mejorado espaciado y tamaño de texto para items de navegación
- [x] Fix: Home page fechas obsoletas - reemplazadas "30 Enero" y "5 Febrero" por badges descriptivos ("IA Avanzada", "Nuevo", "Popular")
- [x] Fix: Analyzer.tsx - eliminadas fechas de desbloqueo obsoletas (UNLOCK_DATE_USER_VIDEO, UNLOCK_DATE_VIRAL_VIDEO)
- [x] Fix: Analyzer.tsx - eliminado componente LockedFeatureCard ya innecesario
- [x] Fix: Analyzer.tsx - actualizado mensaje TikTok download de "disponible el 5 de febrero" a "próximamente disponible"
- [x] Fix: routers.ts - mejorado error handler en análisis para guardar el mensaje de error real en la DB

## Tests
- [x] server/audit-fixes.test.ts - 9 tests (endpoints calendario, validación de fechas eliminadas)
- [x] server/calendar.test.ts - 9 tests (lógica de suscripción y visibilidad)
- [x] server/auth.logout.test.ts - 1 test (logout)
- [x] Todos los 62 tests pasan (12 archivos, incluyendo 13 tests de inspiration)

## Inspiración Viral - Nueva Sección (136 sectores del spreadsheet)
- [x] Parsear y categorizar los 136 sectores del CSV
- [x] Crear tabla en DB para viral_inspiration_sectors
- [x] Crear seed script para importar los datos (136 sectores importados)
- [x] Crear endpoints tRPC (getAll, search, getByCategory, getBySlug, getStats)
- [x] Crear página InspirationViral.tsx con UI espectacular
- [x] Buscador inteligente con fuzzy matching (Ctrl+K shortcut)
- [x] Categorías visuales con iconos y gradientes (12 categorías)
- [x] Embeber reels de TikTok/Instagram en ficha de sector
- [x] Añadir ruta /inspiration y nav item 'Inspiración' con icono Compass
- [x] Probar end-to-end en navegador (búsqueda, filtros, modal, vistas grid/lista)
- [x] Guardar checkpoint (5df09f8a)

## Bugs Reportados por Usuario - Marzo 24
- [x] Bug: Calendario - thumbnails reemplazadas con gradientes fallback bonitos (URLs TikTok CDN expiradas)
- [x] Bug: Calendario modal - gradiente fallback con icono play y duración
- [x] Bug: Inspiración Viral - añadido shrink-0, scrollbar-hide CSS, fade edges laterales

## Imágenes Persistentes para Calendario y Biblioteca
- [x] Identificar todos los vídeos que necesitan thumbnails (50 vídeos en 10 sectores)
- [x] Generar imágenes profesionales con IA para los 10 sectores
- [x] Subir imágenes a S3 con manus-upload-file --webdev (CloudFront CDN)
- [x] Actualizar businessSectorVideos.ts con URLs persistentes (50 covers + 10 sector images)
- [x] Actualizar Calendar.tsx y Library.tsx para usar las nuevas imágenes
- [x] Verificar en navegador que todas las imágenes cargan (Calendar, Library, Inspiration)
- [x] Guardar checkpoint final (1aebbc32)

## Thumbnails Únicos por Vídeo (50 imágenes)
- [x] Generar 5 imágenes únicas para Clínica Estética
- [x] Generar 5 imágenes únicas para Inmobiliaria
- [x] Generar 5 imágenes únicas para Abogados
- [x] Generar 5 imágenes únicas para Marketing Digital
- [x] Generar 5 imágenes únicas para Personal Trainer
- [x] Generar 5 imágenes únicas para Manicura y Uñas
- [x] Generar 5 imágenes únicas para Micropigmentación
- [x] Generar 5 imágenes únicas para Peluquería
- [x] Generar 5 imágenes únicas para Restaurantes
- [x] Generar 5 imágenes únicas para Coaches y Consultores
- [x] Subir 50 imágenes a CDN (todas verificadas HTTP 200)
- [x] Actualizar businessSectorVideos.ts con 50 URLs únicas por vídeo
- [x] Verificar en calendario que cada día muestra imagen diferente
- [x] Guardar checkpoint (7be2db57)

## Quitar Restricciones de Pago (Demo en Directo)
- [x] Identificar todas las restricciones de suscripción en frontend
- [x] Identificar todas las restricciones de suscripción en backend
- [x] Calendario: permitir ver todas las semanas sin restricción (frontend + backend)
- [x] Analizador: quitar límite de análisis por plan (canUseFeature siempre true)
- [x] Biblioteca: sin restricciones reales (solo badges decorativos)
- [x] Stories/Lanzamientos: quitar límite de generaciones (canUseFeature siempre true)
- [x] Inspiración Viral: sin restricciones (siempre fue público)
- [x] Verificar todas las páginas en navegador (Calendar Marzo→Abril→Mayo OK)
- [x] Guardar checkpoint demo mode (todos los 62 tests pasan)

## Sistema de Gestión de Administradores
- [x] Analizar sistema actual de roles (schema, routers, frontend)
- [x] Campo 'role' ya existía en schema (user/admin enum)
- [x] Crear endpoints tRPC: getUsers, getStats, promoteToAdmin, demoteToUser
- [x] Proteger endpoints con adminProcedure (role check + owner check)
- [x] Crear página AdminUsers.tsx con stats, búsqueda, lista de admins/usuarios, modal de confirmación
- [x] Secciones admin visibles solo para admins (Navbar ya filtraba por role)
- [x] Owner puede promover/degradar usuarios (protegido: no se puede degradar al owner ni a uno mismo)
- [x] 10 tests en userManagement.test.ts (72 tests totales pasan)
- [x] Verificado en navegador: 67 usuarios, 1 admin, búsqueda, badges, botones
- [x] Guardar checkpoint

## Reemplazar Manus OAuth por Login Usuario/Contraseña
- [x] Analizar sistema auth actual (OAuth flow, context, middleware, hooks)
- [x] Añadir campo passwordHash al schema de usuarios + db:push
- [x] Crear authRouter con login/register/logout/me endpoints (bcrypt + JWT)
- [x] Reemplazar context.ts para usar JWT propio con userId
- [x] Crear página Login.tsx con formulario email/contraseña + registro
- [x] Eliminar todas las referencias a getLoginUrl/OAuth de 8 archivos frontend
- [x] Eliminar registerOAuthRoutes del server index.ts
- [x] Actualizar useAuth hook para redirigir a /login
- [x] Crear cuenta admin: admin@viralpro.io / ViralPro2024!
- [x] 13 tests en passwordAuth.test.ts (85 tests totales pasan)
- [x] Verificado: login/register/logout via curl + página login carga correctamente
- [x] Guardar checkpoint

## Reemplazar Soporte 24h por Generador de Bios de Instagram
- [x] Analizar código actual de Soporte 24h y rutas
- [x] Crear endpoint tRPC bioGenerator.generate con LLM (JSON schema strict)
- [x] Lógica IA: decidir CTA (lead magnet, auditoría o consultoría) según tipo de empresa
- [x] Generar: nombre optimizado, descripción, emojis, CTA, web ficticia, slot + bios alternativas + hashtags + tips
- [x] Crear página BioGenerator.tsx con formulario, vista previa Instagram, copiar elementos, versiones alternativas
- [x] Reemplazar Soporte 24h por Bio IG en Navbar, App.tsx, Home, Dashboard, SectorDetail + eliminar Support.tsx
- [x] 15 tests en bioGenerator.test.ts + 1 actualizado en video.test.ts (102 tests totales pasan)
- [x] TypeScript compila sin errores, 102 tests pasan
- [x] Guardar checkpoint

## Actualizar Fechas para Demo 29 Marzo 2026 (100 empresas)
- [x] Identificar todos los archivos con fechas hardcodeadas (Calendar.tsx, Stories.tsx, Dashboard.tsx, Home.tsx)
- [x] Actualizar calendario: vídeos en martes y jueves de TODO el mes, etiquetas Publicado/¡Hoy!/Publicar, leyenda actualizada
- [x] Lanzamientos/stories usan new Date() dinámicamente - ya correcto
- [x] Dashboard usa new Date() dinámicamente - ya correcto
- [x] Verificado: Marzo 2026, día 29 resaltado con cyan, 9 reels en mes, Publicado/Publicar correcto
- [x] Guardar checkpoint
