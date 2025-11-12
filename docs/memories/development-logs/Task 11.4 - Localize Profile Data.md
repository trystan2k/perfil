---
title: Task 11.4 - Localize Profile Data
type: note
permalink: development-logs/task-11-4-localize-profile-data
---

# Task 11.4 - Localize Profile Data and Update Data Fetching Hook

## Summary
- Created locale-specific directories for profile data (en, es, pt-BR)
- Translated all profile data to English and Spanish
- Moved original Portuguese data to pt-BR directory
- Updated useProfiles hook to accept locale parameter and fetch from locale-specific paths

## Changes Made
### New Files
- `public/data/en/profiles.json`: English profile data (8 profiles)
- `public/data/es/profiles.json`: Spanish profile data (8 profiles)
- `public/data/pt-BR/profiles.json`: Portuguese profile data (moved from public/data/profiles.json)

### Modified Files
- `src/hooks/useProfiles.ts`: Updated to accept locale parameter

### Profile Categories Translated
- Famous People / Personas Famosas / Pessoas Famosas
- Countries / Países / Países
- Movies / Películas / Filmes
- Animals / Animales / Animais
- Technology / Tecnología / Tecnologia
- Sports / Deportes / Esportes

### Profile Data Structure
Each profile includes:
- `id`: Unique identifier
- `category`: Localized category name
- `name`: Profile name (person, place, thing)
- `clues`: Array of 20 localized clue strings
- `metadata`: Language, difficulty, source

## Technical Decisions
- Used locale-specific directory structure: `/data/{locale}/profiles.json`
- Updated useProfiles hook to construct dynamic URL based on locale
- Added locale to React Query key for proper cache separation
- Maintained same profile IDs across all languages for consistency
- Default locale is 'en' to match Astro i18n configuration

## Next Steps
- Implement language switcher component
- Integrate i18n into React components
- Pass locale from Astro pages to React islands
