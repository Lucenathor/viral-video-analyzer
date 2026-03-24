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
