# ViralPro - Project TODO

## Core Features

- [x] Database schema for videos, analyses, sectors, and support tickets
- [x] Navigation and layout structure
- [x] Landing page with feature overview
- [x] User authentication integration

## Viral Video Analyzer

- [x] Video upload component with S3 storage
- [x] AI analysis integration for viral video structure
- [x] Analysis results display (hooks, cuts, timing, patterns)
- [x] Summary generation explaining virality factors

## Video Comparator

- [x] Upload user video for comparison
- [x] Comparative analysis against viral reference
- [x] Improvement points and recommendations
- [x] Cut and editing suggestions display

## Viral Reels Library

- [x] Sector categories with representative images
- [x] Sector filtering system
- [x] Viral reels collection per sector
- [x] Sector detail pages

## Support 24h

- [x] Support ticket submission form
- [x] Video upload for expert analysis
- [x] Owner notification on new tickets
- [x] Ticket status tracking

## User Dashboard

- [x] Analysis history view
- [x] Support requests history
- [x] User profile management

## Sectors Included

- [x] Restaurantes y Hostelería
- [x] Fitness y Entrenadores Personales
- [x] Peluquerías y Estética
- [x] Abogados y Asesorías
- [x] Inmobiliarias
- [x] Coaches y Consultores
- [x] Tiendas de Moda
- [x] Clínicas Dentales
- [x] Fotografía y Videografía
- [x] Academias y Formación

## Technical

- [x] tRPC routers for all features
- [x] Vitest tests for main routers
- [x] S3 storage integration
- [x] LLM integration for analysis
- [x] Azure Video Indexer integration for advanced video analysis
- [x] Fallback to LLM-only analysis when Video Indexer unavailable

## Azure Video Indexer Integration
- [x] Create App Registration in Azure AD
- [x] Generate Client Secret for ViralPro-VideoIndexer app
- [x] Configure Video Indexer Trial API integration
- [x] Implement video upload and analysis with Video Indexer
- [x] Test video analysis with Azure Video Indexer Trial API
- [x] All tests passing (14/14)

## Bugs
- [x] Fix video analysis error - analysis fails silently after starting
- [x] Fix video analysis failing at 90% - investigate server-side (implemented direct S3 upload)
- [x] Improve video upload progress indicator (added step-by-step status messages)
- [x] Add better error messages visible to user
- [x] Fix S3 upload error from frontend - implemented chunked upload through server
- [x] Fix analysis not using actual video content - now sends video to LLM with file_url for real visual analysis
- [x] Test video analysis flow exhaustively before delivery - all 14 tests passing
- [x] Implement Azure Video Indexer integration for video analysis - working with user's 50MB video

## Azure + Gemini Full Flow
- [x] Update Azure Video Indexer service to download thumbnails/frames
- [x] Update router to use Azure data + thumbnails with Gemini
- [x] Update frontend to show analysis progress steps
- [x] Test full flow with user's video - all tests passing

## UX Improvements
- [x] Add countdown timer showing estimated time remaining during analysis
- [x] Show tips for faster analysis while waiting
