---
title: Task 11 Implement Internationalization i18n Support
permalink: development-logs/task-11-implement-internationalization-i18n-support
---

## Task 11 — Implement Internationalization i18n Support (Detailed)

### 11.1 - Configure Astro i18n
- Locales: en, es, pt-BR
- Default: en
- Routing: no prefix for default locale
- astro.config.mjs updated accordingly

### 11.2 - Set Up react-i18next
- Integrate react-i18next into React islands
- Create I18nProvider to wrap app
- Expose translation hook for components

### 11.3 - Create Translation Files
- English: en.json
- Spanish: es.json
- Brazilian Portuguese: pt-BR.json
- Keys cover all UI components used in GameSetup, GamePlay, Scoreboard

### 11.4 - Localize Profile Data
- Load locale-aware data paths
- Localize profile labels where applicable

### 11.5 - Implement Language Switcher Component
- LanguageSwitcher with locale persisted
- Accessible labels and locale-aware routing

### 11.6 - Integrate Translations into React Components
- Replace hard-coded strings with t('key')
- Interpolation for counts, categories, etc.

### 11.7 - End-to-End Testing
- Vitest tests with i18n mocks
- Tests cover locale switch and translation rendering

### QA Summary
- All tests pass; build OK; lint OK

### Files Modified/Created
- `astro.config.mjs`
- `src/i18n/config.ts`
- `src/components/I18nProvider.tsx`
- `src/components/LanguageSwitcher.astro`
- `public/locales/en/translation.json`
- `public/locales/es/translation.json`
- `public/locales/pt-BR/translation.json`
- `src/pages/index.astro`
- `src/pages/game/[sessionId].astro`
- `src/pages/scoreboard/[sessionId].astro`
- `src/hooks/useProfiles.ts`
- `vitest.setup.ts`
- `package.json`
