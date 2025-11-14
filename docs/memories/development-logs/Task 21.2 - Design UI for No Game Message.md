---
title: Task 21.2 - Design UI for No Game Message
type: note
permalink: development-logs/task-21-2-design-ui-for-no-game-message
---

## UI Design for /game Route

**Design Decision:**
Since this is a simple informational page, we'll implement it directly in the Astro file without creating a separate component. This keeps it simple and follows the pattern used in the current game.astro.

**UI Structure:**
1. Centered layout (already exists)
2. Heading: "No Game in Progress" (i18n key: `noGamePage.title`)
3. Description: "Please start a new game to begin playing." (i18n key: `noGamePage.description`)
4. Call-to-action: Link styled as button to home page with text "Create New Game" (i18n key: `noGamePage.createButton`)

**Translation Keys to Add:**
```json
"noGamePage": {
  "title": "No Game in Progress",
  "description": "Please start a new game to begin playing.",
  "createButton": "Create New Game"
}
```

**Styling:**
- Use existing Tailwind classes
- Center content vertically and horizontally
- Use shadcn/ui button styling for the link
- Consistent spacing with existing pages

**Navigation:**
- Link to "/" (home page which is the game setup)
