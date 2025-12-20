---
description: Create new categories for the Perfil project with initial profiles and all necessary configuration.
agent: build
---

## PREPARATION

Before starting, ask the user:
1. What is the category slug (lowercase, hyphenated, e.g., "music-artists")
2. What are the display names for each language:
   - English
   - Spanish
   - Portuguese (pt-BR)
3. What is the ID prefix for profiles in this category (lowercase, e.g., "music")
4. What is a description of what profiles this category should contain?
5. Which languages should have initial profiles (en, es, pt-BR)?

**VERY IMPORTANT**: DO NOT create a new category without explicit user confirmation on all these details.

## FILE STRUCTURE PREPARATION

First, read these files to understand the structure:
- @config/profiles.config.json (to see the format and add new category)
- @config/profiles.schema.json (to understand profile data structure)
- @public/data/manifest.json (to understand manifest format)

## CATEGORY CREATION STEPS

### 1. Directory Structure Creation

Create the following directory structure in `public/data/{slug}/` for each language:
```
public/data/{slug}/
├── en/
│   └── data-1.json
├── es/
│   └── data-1.json
└── pt-BR/
    └── data-1.json
```

### 2. Initial Profiles Creation

Create exactly 5 initial profiles for each language specified:

**VERY IMPORTANT RULES:**
- Each profile **MUST** have exactly 20 clues, no more, no less
- Profile IDs must follow the format: `profile-{idPrefix}-{number}` (e.g., `profile-music-001`)
- Clues must progress from hard (first 5) to easy (last 5)
- Clues must NOT contain the profile name
- Clues must be meaningful and in the correct language
- Use difficulty levels: easy, medium, hard
- All 5 profiles should have varied difficulty levels

Use these sources for research:
- Wikipedia
- IMDb (for movies/actors)
- Fandom wikis
- Celebrity wikis
- Industry-specific websites

**Profile Data Structure:**
```json
{
  "version": "1",
  "profiles": [
    {
      "id": "profile-{idPrefix}-001",
      "category": "{Display Name}",
      "name": "Profile Name",
      "clues": [
        "Hard clue 1",
        "Hard clue 2",
        "Hard clue 3",
        "Hard clue 4",
        "Hard clue 5",
        "Medium clue 6",
        "Medium clue 7",
        "Medium clue 8",
        "Medium clue 9",
        "Medium clue 10",
        "Easy clue 11",
        "Easy clue 12",
        "Easy clue 13",
        "Easy clue 14",
        "Easy clue 15",
        "Easy clue 16",
        "Easy clue 17",
        "Easy clue 18",
        "Easy clue 19",
        "Easy clue 20"
      ],
      "metadata": {
        "language": "en",
        "difficulty": "medium",
        "source": "Wikipedia"
      }
    }
  ]
}
```

### 3. Update profiles.config.json

Add the new category to @config/profiles.config.json following this format:

```json
{
  "slug": "{slug}",
  "displayNames": {
    "en": "English Name",
    "es": "Nombre en Español",
    "pt-BR": "Nome em Português"
  },
  "description": "Description of what this category contains...",
  "profiles": [
    {
      "name": "Profile Name 1",
      "availableIn": ["en", "es", "pt-BR"],
      "difficulty": "medium"
    },
    // ... all 5 initial profiles
  ]
}
```

### 4. Update manifest.json

Add the new category to @public/data/manifest.json following this format:

```json
{
  "slug": "{slug}",
  "idPrefix": "{idPrefix}",
  "locales": {
    "en": {
      "name": "English Display Name",
      "files": ["data-1.json"],
      "profileAmount": 5
    },
    "es": {
      "name": "Nombre en Español",
      "files": ["data-1.json"],
      "profileAmount": 5
    },
    "pt-BR": {
      "name": "Nome em Português",
      "files": ["data-1.json"],
      "profileAmount": 5
    }
  }
}
```

## VALIDATION CHECKLIST

After creating the category, verify:

- ✅ All 5 profile JSON files are created with valid JSON
- ✅ Each profile has exactly 20 clues
- ✅ Profile IDs follow format: `profile-{idPrefix}-###`
- ✅ Clues progress from hard to easy
- ✅ Clue content does NOT contain profile names
- ✅ All clues are in the correct language
- ✅ Metadata includes language, difficulty, and source
- ✅ Directory structure matches: `public/data/{slug}/{language}/data-1.json`
- ✅ @config/profiles.config.json updated with new category and all 5 profiles
- ✅ @public/data/manifest.json updated with new category, idPrefix, and files
- ✅ profileAmount in manifest.json reflects actual profile count (5)
- ✅ All JSON files are valid (no syntax errors)
- ✅ Display names are correctly translated in profiles.config.json and manifest.json

## IMPORTANT NOTES

- **DO NOT** modify existing categories or profiles
- **DO NOT** create profiles with duplicate names (check profiles.config.json)
- **DO NOT** use more than 100 profiles per data file (this is only 5 initially, so use data-1.json)
- **DO NOT** create any other files in the public/data folder
- **DO NOT** create any other files in the config folder
- **DO** follow the exact directory structure and naming conventions
- **DO** ensure all JSON files are properly formatted
- **DO** use the profile ID format consistently across all files
- **DO** translate display names to all specified languages
- **DO** create profiles with a balance of difficulty levels
- **DO** save all clues in the correct language for each file

## COMPLETION

Once all files are created and validated:

1. Verify the JSON validity of all files
2. Confirm all necessary changes were made
3. Report the completion with:
   - Category slug
   - ID prefix
   - Languages included
   - Number of profiles created
   - File paths created
   - Confirmation of config files updated
