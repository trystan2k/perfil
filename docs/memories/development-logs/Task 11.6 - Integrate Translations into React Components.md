---
title: Task 11.6 - Integrate Translations into React Components
type: note
permalink: development-logs/task-11-6-integrate-translations-into-react-components
---

# Task 11.6 - Integrate Translations into React Components and Astro Pages

## Status
Started: 2025-11-12

## Task Details
Replace hardcoded text strings throughout the application with i18n keys and use the translation functions to display localized content.

## Implementation Plan

### Analysis
- Need to integrate react-i18next into React components
- Must pass locale from Astro pages to React islands
- Components to update: GameSetup.tsx, GamePlay.tsx, Scoreboard.tsx
- Need to create an I18nProvider wrapper component
- Must initialize i18next in client-side context

### Approach
1. Create I18nProvider wrapper component that initializes i18next
2. Update each Astro page to pass currentLocale to React islands
3. Wrap React islands with I18nProvider
4. Update GameSetup.tsx to use useTranslation hook
5. Update GamePlay.tsx to use useTranslation hook
6. Update Scoreboard.tsx to use useTranslation hook
7. Update useProfiles calls to pass locale
8. Update tests to mock i18next
9. Verify all translations work correctly

## Progress
- Starting implementation...
