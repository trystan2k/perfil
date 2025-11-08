## 🧩 Product Requirements Document (PRD)

### Product: **Profile Game (Guess the Mystery Word) — Multiplayer**

### Platform: Web (Astro + React — Static Site Generation with interactive React components)

- Layout priority: Mobile-first. The application must be designed for mobile screens first and optimized for small touch devices. It should also be responsive and adapt gracefully to larger viewports (tablet and desktop), maintaining usability and visual balance when opened on bigger screens.

### Version: 1.0 (MVP — Multiplayer Hosted Locally)

### Owner: Product Team

### Date: November 2025

---

## 1. 🎯 Product Overview

**Profile Game** is a multiplayer, host-driven guessing game inspired by the Brazilian board game *Perfil*. One person acts as the host / master of ceremonies (MC) on a single device. The MC creates the game, enters player names, starts rounds, reads clues and awards points.

The MVP is multiplayer-only with a single device acting as the host (no online networking). The MC controls the game flow: player setup, category selection (or shuffle), turn order, presenting clues, revealing answers with a swipe, scoring, and ending the game to show the final scoreboard.

---

## 2. 🧠 Objectives & Goals

- Deliver a simple, social multiplayer experience where friends play from a single device with the MC in control.
- Keep UX focused: fast round flow, clear reveal mechanics, and transparent scoring.
- Provide a stable foundation so online or remote multiplayer can be added later.

---

## 3. 👥 Target Audience

- Age: 12+
- Platform: Web (desktop/tablet/phone) used in a social setting
- Players: 2+ people with one person acting as MC on the device

---

## 4. 🚀 Key Features (MVP Scope)

| # | Feature | Description | Priority |
| - | ------- | ----------- | -------- |
| 1 | **Multiplayer (Hosted Locally)** | Single device hosted game. MC creates the game and controls rounds. | ⭐⭐⭐⭐ |
| 2 | **Player Setup** | MC enters the names of all players before starting the session. | ⭐⭐⭐⭐ |
| 3 | **Category Select / Shuffle** | MC picks a category or uses Shuffle to randomly select profiles. | ⭐⭐⭐ |
| 4 | **Turn Management** | System chooses starting player and advances turn order automatically. | ⭐⭐⭐⭐ |
| 5 | **Progressive Clues** | Each profile has up to 20 clues shown progressively on each turn. | ⭐⭐⭐⭐ |
| 6 | **Pass / Guess Actions** | Active player can pass (forfeit turn) or attempt a guess. MC controls outcome and scoring. When a player passes, the next player becomes active and clues continue for the same profile; play continues until someone guesses correctly or all clues are exhausted. | ⭐⭐⭐⭐ |
| 7 | **Answer Reveal (Swiper)** | The actual answer is hidden behind a swipeable card; swipe right reveals it for a configurable timeout (default 3s) then hides again. | ⭐⭐⭐⭐ |
| 8 | **MC Scoring Interaction** | If guess is correct, MC taps the correct player's name to record points. Points computed from number of clues read. Only one winner per profile is recorded. | ⭐⭐⭐⭐ |
| 9 | **Scoreboard & Session End** | MC can finish the game any time and view final scoreboard; scoreboard can be exported via screenshot for easy sharing. | ⭐⭐⭐⭐ |

---

## 5. 🌱 Future Features (Post-MVP)

- Remote online multiplayer and session links
- Per-player devices (clients) connecting to a host
- Custom profile creation by users
- Leaderboards and achievements
- Localization and voice clue narration

---

## 6. 🧰 Technical Requirements

| Area | Description |
| ---- | ----------- |
| Framework | Astro (Static Site Generation) with React for interactive islands (TypeScript) |
| Components | shadcn/ui (React) for interactive parts; plain HTML/Tailwind in `.astro` files for static content |
| State | Zustand for session state (players, scores, turns) inside React islands; small local UI state in `.astro` components as needed |
| Routing | Astro file-based routing for static pages; client-side routing can be added within React islands if required |
| Data Layer / Async | TanStack Query for async operations inside React islands and for future remote data; static data (profiles.json) available at build time and fetched as needed |
| Storage / Persistence | IndexedDB (use the `idb` wrapper) or `localForage` for fallback; access from React islands using client-side code |
| Data | Local JSON of profiles (20 clues each) included as static assets and optionally loaded at runtime via fetch or imported at build time |
| Build | Astro build (SSG) — outputs static site; use `astro build` (Rsbuild can remain if you have tooling that wraps Astro, otherwise prefer Astro's build) |
| Package Manager | pnpm |
| Testing | Vitest + React Testing Library for React/TypeScript code; use `@astrojs/testing` (Container API) for `.astro` files and integration tests |
| Linting & Formatting | Biome is viable — configure Biome to handle `.astro`, TypeScript, JSX/TSX, and Tailwind rules; alternatively add `eslint` if needed but Biome can cover formatting and linting in one tool |
| CI/CD | GitHub Actions (run tests and `astro build` on push/PR) |
| Deployment | Render, Netlify, Vercel, or any static host supporting SSG deployments (Render recommended) |
| Design | Tailwind CSS |

**Technical Notes:**

- Astro's SSG fits the goal of an easy-to-deploy static site with interactive React islands for the game UI.
- Use React only where interactivity is required (game loop, scoring, swipable reveal); prefer lightweight `.astro` templates for static pages like landing, docs, and the scoreboard export view.
- `shadcn/ui` works inside React components — include it in client-side islands. Keep bundle size small by hydrating only the islands that need interactivity.
- Biome can be used for linting and formatting across the repo; ensure `.astro` file support via Biome plugins or configure a small script to run Biome over generated/compiled output if direct support is limited.
- For testing `.astro` files and server-side rendering correctness, use the official `@astrojs/testing` Container API alongside Vitest for React components.
- Keep `profiles.json` as a static asset under `public/` or `src/content/` so it can be imported at build time or fetched at runtime.
- If you plan to add PWA features, confirm additional build configuration (service worker, manifest) with `astro build` or your chosen wrapper.
- `idb` (<https://github.com/jakearchibald/idb>) is recommended for IndexedDB access: lightweight, well-typed, and easy to use with async code.
- Using TanStack Query now enables a consistent async data-handling pattern even when data is local; it will make adding remote sources easier later.
- `pnpm` is the package manager of choice for workspace speed and disk efficiency.
- `Rsbuild` is noted as the build tool per your preference; confirm if any additional build configs are required (e.g., PWA settings).

---

## 7. 🧩 Game Flow (Host-driven Multiplayer)

1. **Create Game (MC)**
   - MC opens the app and taps `Create Game`.
   - MC enters player names (2+). Names are stored in player list.
   - MC may optionally set `number of rounds` or use indefinite rounds until MC finishes.

2. **Start Game**
   - After entering all players, MC taps `Start`.
   - MC selects a `Category` or taps `Shuffle` to randomize profiles from all categories.
   - System randomly picks a starting player.

3. **Turn Loop (repeats)**
   - System selects the next profile (mystery word) and resets `cluesRead = 0`.
   - Active player (the player whose turn it is) listens while MC reveals clues one at a time.
   - For each clue: MC taps `Show Next Clue` → clue is shown and `cluesRead` increments.
   - While clues are being revealed, the active player may either:
     - `Pass` — pass the turn; no guess recorded and turn moves to next player; next player becomes active and clues continue for the same profile (optional MC policy: if passed by all players, reveal answer and move to next profile). This continues until someone guesses correctly or all clues are exhausted.
     - `Guess` — player says the guess aloud; MC may decide to reveal the hidden answer to confirm.

4. **Answer Reveal & Confirmation**
   - The answer content is hidden behind a swipeable overlay (e.g., card with chevron). Only the MC controls the swipe.
   - When swiped right, the answer is displayed for the configured timeout (default 3 seconds), then the overlay hides again automatically.
   - If the active player guessed and the answer shown matches the guess, MC taps the name of the player who guessed correctly to award points. Only one player may be recorded as the winner for that profile. If incorrect, gameplay continues based on MC decisions (pass to next player or continue clues).

5. **Scoring Rules**
   - Each profile has `TOTAL_CLUES = 20` (configurable per category).
   - Let `cluesRead` be the number of clues that were shown before the correct guess.
   - Points calculation (MVP default linear rule):
     - points = TOTAL_CLUES - (cluesRead - 1)
     - Examples with TOTAL_CLUES = 20:
       - guessed on clue #1 (cluesRead = 1) → 20 points
       - guessed on clue #10 (cluesRead = 10) → 11 points
       - guessed on clue #20 (cluesRead = 20) → 1 point
   - Note: This formula follows a simple diminishing scoring model so earliest guesses get the highest reward. If the MC prefers a different mapping (e.g., guessed on clue #10 → 10 points), adjust the formula accordingly.
   - After tapping the winning player's name, the system adds the points to that player's score and advances to the next profile and next active player.

6. **Session End / Final Scoreboard**
   - MC may end the session at any time via `Finish Game`.
   - On finish, show a final scoreboard ordered by points with option to view per-round breakdown. If no one guessed after all clues, the app auto-reveals the answer and awards 0 points for that profile.
   - The scoreboard should persist across page reloads and support easy export for sharing (recommendation: provide a `Share/Export` button that opens the scoreboard view; users can take a screenshot).

---

## 8. 🧩 Data Model (Simplified)

interface Player {
  id: string;
  name: string;
  score: number;
}

interface Profile {
  id: string;
  category: string;
  name: string; // revealed answer
  clues: string[]; // ordered list, up to 20
}

interface TurnState {
  profileId: string;
  activePlayerId: string;
  cluesRead: number;
  revealed: boolean; // whether answer overlay is currently revealed
}

interface GameSession {
  id: string;
  players: Player[];
  currentTurn: TurnState | null;
  remainingProfiles: string[]; // profile ids
  totalCluesPerProfile: number; // default 20
}

### Profile JSON File Schema

The app expects a JSON file containing one or more `Profile` objects. The recommended filename is `profiles.json` and the file should be an object with a `profiles` array. The schema below follows JSON Schema Draft-07 and is designed for strict validation of uploaded or imported profile data.

```json
{
  "$id": "https://example.com/schemas/profile-file.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Profile Data File",
  "type": "object",
  "required": ["profiles"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Optional schema version (semantic versioning recommended)",
      "pattern": "^\\d+(\\.\\d+)*$"
    },
    "profiles": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/definitions/profile" }
    }
  },
  "additionalProperties": false,
  "definitions": {
    "profile": {
      "type": "object",
      "required": ["id", "category", "name", "clues"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for the profile (UUID or short-id)."
        },
        "category": {
          "type": "string",
          "minLength": 1,
          "description": "Category or set this profile belongs to."
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "description": "The revealed answer (e.g., person/place/thing)."
        },
        "clues": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": { "type": "string", "minLength": 1 }
        },
        "metadata": {
          "type": "object",
          "description": "Optional free-form metadata (language, difficulty, source, etc.).",
          "properties": {
            "language": { "type": "string" },
            "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] },
            "source": { "type": "string" }
          },
          "additionalProperties": true
        }
      },
      "additionalProperties": false
    }
  }
}
```

Example `profiles.json` (minimal):

```json
{
  "version": "1",
  "profiles": [
    {
      "id": "profile-0001",
      "category": "Famous People",
      "name": "Albert Einstein",
      "clues": [
        "Developed the theory of relativity",
        "Born in Germany",
        "Nobel Prize in Physics 1921"
      ]
    }
  ]
}
```

Notes and validation guidance:

- `id` must be unique within a file. The app will merge or deduplicate profiles by `id` if necessary.
- `clues` must be ordered from most obscure (earlier) to most revealing (later), or vice-versa depending on category conventions; the app treats the array order as the sequence used during gameplay.
- Maximum of 20 clues per profile is enforced by the schema via `maxItems`.
- The top-level object disallows unknown properties to avoid accidental misformatted imports; add optional fields under `metadata` on each profile if extra data is needed.
- If you need a different file shape (for categories, grouping, or pagination), extend the schema version and update `version` accordingly.

---

## 9. 🎨 Design & UX Guidelines (Key MVP items)

- Design inspiration screenshots are available in `PRD/design/` and should be used as visual reference during implementation. Files in that folder include:
  - `PRD/design/Draft - Home.png`
  - `PRD/design/Draft - Game start.png`
  - `PRD/design/Draft - Game Ongoing.png`
  - `PRD/design/Draft - Game Reveal.png`
  - `PRD/design/Draft - Game History.jpeg`
  - `PRD/design/Draft - Leaderboard.png`
  - `PRD/design/Draft - Leaderboard full.png`
  - `PRD/design/Draft - Settings.png`

- The MC UI should prioritize clarity: Player list and scores visible at top, active player highlighted.
- Clue card: large text, numbered (Clue #N), with `Next Clue` button for MC.
- Answer reveal overlay: swipe right to reveal the hidden answer, animate reveal, display answer for 3 seconds, then hide.
- MC scoring action: after a correct guess, MC taps the player name in the player list to award points.
- If multiple players guess in one turn, MC can award the points to the first correct guess by tapping the correct player's name.

Design / responsiveness guidelines (mobile-first)

- Priority: design mobile-first — layouts, interactions and sizing should be optimized for small touch screens, then scaled up for tablet/desktop.
- Breakpoints (suggested):
  - Mobile (default): up to 640px (Tailwind `sm` breakpoint applies at 640px)
  - Tablet: 641px–1024px (`md` / `lg` as needed)
  - Desktop: 1025px and up
- Layout behavior:
  - Mobile: single-column stack — main focus is the clue card; player list and controls accessible via collapsible header or bottom sheet to avoid crowding.
  - Tablet / Desktop: use a split or two-column layout where appropriate — e.g., player list (left) + game area (right) or topbar with persistent player list and wider clue card area.
  - Keep a comfortable max content width for readability (e.g., 720–900px) when displaying on large screens.
- Touch & controls:
  - Touch targets >= 44px (recommended 48px) and generous spacing between interactive elements.
  - Avoid hover-only interactions; provide visible affordances for touch and keyboard users.
  - Use clear primary and secondary actions (e.g., `Next Clue` primary, `Pass`/`Guess` secondary) with distinct visual weight.
- Typography & spacing:
  - Use scalable type (responsive font sizes) so clue text remains legible on small screens and doesn't become excessively large on desktop.
  - Maintain consistent spacing and stack order; increase gutters on larger screens.
- Accessibility & input:
  - Ensure sufficient color contrast and focus outlines for keyboard navigation.
  - Support both portrait and landscape orientations; test key screens (Create Game, Ongoing Game, Reveal) in both.
- Implementation notes for engineers:
  - Use Tailwind utility classes and mobile-first media queries to implement responsive rules.
  - Prefer collapsible or overlay patterns for secondary panels on mobile (player list, settings) and persistent panels on larger viewports.
  - Test interactions on actual devices (phone, tablet) to validate touch targets and swipe gestures.

---

## 10. 📅 Milestones & Deliverables

| Milestone | Deliverable | Est. Time |
| --------- | ----------- | --------- |
| M1: Setup | Project setup, basic navigation, player list UI | 4 days |
| M2: Host Flow | Create game, enter players, start game, category select | 4 days |
| M3: Core Game Loop | Clue reveal, turn rotation, pass/guess, answer reveal UX | 1 week |
| M4: Scoring | MC award points, scoreboard, finish game | 4 days |
| M5: Polish & Tests | Animations, accessibility, unit/integration tests | 1 week |
| M6: Release | Build and internal QA | 3 days |

---

## 11. 📈 Success Metrics

- Session completion rate ≥ 80% for hosted games (start → finish)
- Average time per round under 2 minutes (fast party flow)
- Low MC friction: 90% of internal testers complete setup within 30s
