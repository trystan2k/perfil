---
title: Task 11.1 - Configure Astro i18n
type: note
permalink: development-logs/task-11-1-configure-astro-i18n
---

# Task 11.1 - Configure Astro i18n for Internationalized Routing

## Summary
- Configured Astro's built-in i18n routing support
- Added support for 3 languages: English (en), Spanish (es), Portuguese (pt-BR)
- Set English as the default locale
- Configured routing to not prefix the default locale in URLs

## Changes Made
### Modified Files
- `astro.config.mjs`: Added i18n configuration

### Configuration Details
```javascript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'es', 'pt-BR'],
  routing: {
    prefixDefaultLocale: false,
  },
}
```

### Routing Strategy
- Default locale (en): No prefix in URL (e.g., `/game`)
- Spanish: `/es/` prefix (e.g., `/es/game`)
- Portuguese: `/pt-BR/` prefix (e.g., `/pt-BR/game`)

## Technical Decisions
- Used `prefixDefaultLocale: false` to keep clean URLs for English (default locale)
- Used `pt-BR` for Portuguese to properly distinguish from European Portuguese
- Leveraged Astro's native i18n routing instead of custom middleware for better performance

## Next Steps
- Set up react-i18next for React component translations
- Create translation files for all 3 languages
- Update components to use translated strings
