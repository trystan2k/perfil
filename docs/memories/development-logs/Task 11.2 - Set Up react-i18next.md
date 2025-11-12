---
title: Task 11.2 - Set Up react-i18next
type: note
permalink: development-logs/task-11-2-set-up-react-i18next
---

# Task 11.2 - Set Up and Configure react-i18next

## Summary
- Installed i18next packages for React internationalization
- Created i18n configuration with browser language detection
- Configured HttpBackend to load translations from JSON files
- Set up language detection order: URL query > localStorage > browser navigator

## Changes Made
### Installed Packages
- `i18next`: Core i18n library (v25.6.2)
- `react-i18next`: React integration (v16.2.4)
- `i18next-http-backend`: Backend for loading translation files (v3.0.2)
- `i18next-browser-languagedetector`: Browser language detection (v8.2.0)

### New Files
- `src/i18n/config.ts`: i18next configuration module

### Configuration Details
```typescript
- Supported languages: ['en', 'es', 'pt-BR']
- Fallback language: 'en'
- Translation file path: '/locales/{{lng}}/translation.json'
- Detection order: URL query > localStorage > navigator
- localStorage key: 'i18nextLng'
```

## Technical Decisions
- Used HttpBackend to load translations from static JSON files (server-less)
- Configured LanguageDetector to respect URL query params first, then localStorage, then browser settings
- Exposed `initI18n(locale?)` function that accepts optional locale from Astro pages
- Disabled debug mode for production
- Disabled interpolation escaping since React handles XSS protection

## Next Steps
- Create translation JSON files for all 3 languages
- Update React components to use useTranslation hook
- Pass current locale from Astro pages to React islands
