---
description: Create new profiles for the Perfil project.
agent: build
---

## WORKFLOW

1. **Ask**: How many profiles does the user want? Create ONLY that number.
2. **Prepare**: Read `@config/profiles.config.json` (categories, languages, existing profiles) and `@config/profiles.schema.json` (structure).
3. **Create**: Generate profiles following rules below.
4. **Update**: Modify `profiles.config.json` and `public/data/manifest.json`.
5. **Validate**: Check for JSON errors and exact rule compliance.

## PROFILE STRUCTURE

Each profile MUST have:
- **id**: Format `profile-{category}-{number}` (e.g., `profile-animal-001`)
- **name**: Profile name (in target language)
- **category**: From profiles.config.json
- **clues**: Exactly 20 clues (no more, no less), hard→easy progression (5 hard, 5 medium, 10 easy)
- **metadata**: 
  - `language`: en, es, or pt-BR
  - `difficulty`: easy, medium, or hard
  - `source`: Wikipedia, IMDb, Fandom, etc.

## DATA SOURCES

- Wikipedia
- IMDb, Rotten Tomatoes
- Fandom wikis (e.g., https://starwars.fandom.com/)
- Celebrity wikis
- Other relevant sources

## CATEGORY GUIDANCE

- **Animals**: Real, fictional, mythical creatures; habitats (avoid obvious clues)
- **Brands**: Origin, products, facts (avoid obvious clues)
- **Famous People**: Historical and contemporary personalities (avoid obvious clues)
- **Geography**: Countries, cities, capitals, languages, currencies, tourism (avoid obvious clues)
- **History**: Events, people, places (avoid obvious clues)
- **Literature**: Books, authors, characters (avoid obvious clues)
- **Movies**: Films, actors, characters, directors (avoid obvious clues)
- **Music**: Artists, albums, songs, events (avoid obvious clues)
- **Sports**: Teams, players, events (e.g., World Cup)
- **Technology**: Tech, companies, products, fictional tech (e.g., iPhone 14, Star Trek) (avoid obvious clues)

## CORE RULES (NON-NEGOTIABLE)

- ❌ **NEVER** create duplicate profiles (check profiles.config.json)
- ❌ **NEVER** create more profiles than requested
- ❌ **NEVER** remove/modify existing profiles
- ❌ **NEVER** include profile name in clues
- ❌ **NEVER** escape text (keep accented characters)
- ❌ **NEVER** create extra files (documentation, scripts, etc.)
- ✅ **DO** create exactly 20 clues per profile
- ✅ **DO** arrange clues: hard (5) → medium (5) → easy (10)
- ✅ **DO** use correct language in names, categories, clues
- ✅ **DO** create same profile for all languages if possible
- ✅ **DO** balance difficulty levels and categories
- ✅ **MUST DO** use Serena MCP to write files (token efficiency)

## FILE MANAGEMENT

- **Max 100 profiles per data file**: If exceeded, create new file (data-1.json, data-2.json, etc.). The source of truth of the number of profiles in a file is the amount of entries in the data-json file (not the id number as some categories does not follow the numbering, so read the amount of entries in the file to know the number of profiles in that file).
- **Only create new files if current file has 100+ profiles**
- **Update `public/data/manifest.json`**: Add new files and update `profileAmount` for each category/language
- **Files location**: `public/data/{category}/{language}/data-{number}.json`
- **No other files**: Only JSON profile files in public/data

## BATCH PROCESSING

If profile count is high (e.g., 500+), split into batches of 100 each for efficiency.

## VALIDATION CHECKLIST

- [ ] No duplicate profile names (check profiles.config.json)
- [ ] Exactly 20 clues per profile
- [ ] Clue progression: hard→medium→easy
- [ ] Profile name NOT in clues
- [ ] Correct language for all text
- [ ] Valid JSON (no syntax errors)
- [ ] profiles.config.json updated with new profiles
- [ ] manifest.json updated with new files (if any) and profileAmount counts
- [ ] No extra files created

Once prepared, create profiles as requested.
