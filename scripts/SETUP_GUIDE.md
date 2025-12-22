# Setup Guide for Markdown to JSON Script

This guide explains how to use the `markdown_to_json.py` script for adding new profiles to any category.

## Quick Start

### 1. Prepare Your Markdown Files

Create markdown files in `docs/tmp/` following this format:

```markdown
1. Profile Title
- Clue 1
- Clue 2
...
- Clue 20

2. Another Profile
- Clue 1
...
- Clue 20
```

**Important:** Each profile must have exactly 20 clues.

### 2. Run the Script

```bash
python scripts/markdown_to_json.py \
    --category {category} \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id {start_id} \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

Replace:
- `{category}` with your category name (e.g., "movies")
- `{start_id}` with the starting ID (e.g., 76)

### 3. Verify Results

Check console output for:
- ✓ symbols next to each language
- Number of profiles added matches your markdown files
- "Process completed successfully" message

### 4. Validate JSON Files

```bash
python3 -m json.tool public/data/{category}/{lang}/data-1.json > /dev/null
```

## Directory Structure

Required structure:

```
project/
├── scripts/
│   ├── markdown_to_json.py    # The main script
│   ├── README.md              # Full documentation
│   ├── EXAMPLES.md            # Usage examples
│   └── SETUP_GUIDE.md         # This file
├── docs/
│   └── tmp/
│       ├── {category}.md      # English profiles
│       ├── {category}_es.md   # Spanish profiles
│       └── {category}_pt-BR.md # Portuguese profiles
└── public/
    └── data/
        ├── {category}/
        │   ├── en/
        │   │   └── data-1.json
        │   ├── es/
        │   │   └── data-1.json
        │   └── pt-BR/
        │       └── data-1.json
        └── manifest.json
```

## File Naming

The script looks for markdown files in this order:

1. `{category}.md` (for English)
2. `{category}_{language}.md` (e.g., `movies_es.md`)
3. `{category}-{language}.md` (e.g., `movies-es.md`)

## Command Line Arguments

```
--category CATEGORY (required)
  Category name. Examples: movies, famous-people, animals

--id-prefix PREFIX (optional)
  ID prefix for profile IDs. Defaults to lowercase category.
  Examples: movie, famous, animal

--markdown-dir DIR (required)
  Directory containing markdown files. Example: docs/tmp

--json-dir DIR (required)
  Root directory containing JSON data. Example: public/data

--start-id ID (optional)
  Starting ID for new profiles. Default: 1
  Example: 76 (for profiles 076, 077, ..., 100)

--languages LANG [LANG ...] (optional)
  Language codes to process. Default: en es pt-BR
  Examples: en es pt-BR / en / es pt-BR

--manifest FILE (optional)
  Path to manifest.json. If provided, profile counts will be updated.
  Example: public/data/manifest.json
```

## Step-by-Step Example: Adding 25 Movie Profiles

### Step 1: Create Markdown Files

Create `docs/tmp/movies.md` with 25 movies and their clues:

```markdown
1. Taxi Driver
- Martin Scorsese directed this 1976 psychological thriller
- Robert De Niro plays Travis Bickle...
... (20 clues total)

2. Vertigo
- Alfred Hitchcock directed this 1958 film
... (20 clues total)

... (25 movies total)
```

Create `docs/tmp/movies_es.md` with Spanish translations.
Create `docs/tmp/movies_pt-BR.md` with Portuguese translations.

### Step 2: Verify Markdown Format

Count clues in each movie:
- Should see exactly 20 clues per movie
- Each clue starts with `- `

### Step 3: Run the Script

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

### Step 4: Check Output

Look for output like:

```
✓ en: 25 profiles added
✓ es: 25 profiles added
✓ pt-BR: 25 profiles added
Total profiles added: 75
✓ Manifest updated successfully
✓ Process completed successfully
```

### Step 5: Verify JSON Files

```bash
# Check file sizes (should be similar)
ls -lh public/data/movies/*/data-1.json

# Validate JSON syntax
python3 -m json.tool public/data/movies/en/data-1.json > /dev/null && echo "Valid"
python3 -m json.tool public/data/movies/es/data-1.json > /dev/null && echo "Valid"
python3 -m json.tool public/data/movies/pt-BR/data-1.json > /dev/null && echo "Valid"
```

### Step 6: Commit Changes

```bash
git add public/data/movies/*/data-1.json public/data/manifest.json docs/tmp/movies*.md
git commit -m "Add 25 new movie profiles (076-100)"
git push
```

## Troubleshooting

### Problem: "No markdown file found"

**Cause:** Script can't find your markdown file.

**Solutions:**
1. Check file naming:
   - `movies.md` (English)
   - `movies_es.md` (Spanish)
   - `movies_pt-BR.md` (Portuguese)

2. Verify file location:
   - Files should be in directory specified by `--markdown-dir`
   - Default: `docs/tmp/`

3. Check file extension:
   - Must be `.md` (not `.txt`, `.markdown`, etc.)

### Problem: "JSON file not found"

**Cause:** JSON data files don't exist.

**Solutions:**
1. Verify `--json-dir` path is correct (usually `public/data`)
2. Check category subdirectory exists:
   - `public/data/movies/en/`
   - `public/data/movies/es/`
   - `public/data/movies/pt-BR/`
3. Ensure `data-1.json` exists in each language directory

### Problem: "has X clues, expected 20"

**Cause:** A profile doesn't have exactly 20 clues.

**Solutions:**
1. Edit the markdown file
2. Add or remove clues to reach exactly 20
3. Re-run the script

### Problem: "Invalid JSON"

**Cause:** Generated JSON has syntax errors.

**Solutions:**
1. Check profile titles for special characters:
   - Use `\"` instead of `"`
   - Use `\\` for backslashes
   - Use `\n` for newlines (not actual line breaks)

2. Check clues for special characters

3. Validate output:
   ```bash
   python3 -m json.tool public/data/movies/en/data-1.json
   ```

### Problem: Profile IDs are wrong

**Solutions:**
1. Check `--start-id` parameter
2. Verify profile ID format:
   - Should be: `profile-{prefix}-{id:03d}`
   - Example: `profile-movie-076`

## Advanced Usage

### Process Single Language

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en
```

### Update Only Specific Languages

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages es pt-BR
```

### Custom ID Prefix

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --id-prefix film \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR
```

This generates IDs like: `profile-film-076`, `profile-film-077`, etc.

## Performance

- Processing 25 profiles: < 1 second
- Processing 100 profiles: < 2 seconds
- Manifest update: < 1 second total

## Script Features

✓ Reads markdown files with flexible naming
✓ Parses profiles with 20 clues each
✓ Creates JSON profiles with proper metadata
✓ Adds profiles to existing JSON files
✓ Validates JSON syntax after updates
✓ Updates manifest.json automatically (if provided)
✓ Provides detailed logging output
✓ Handles errors gracefully
✓ Works with any category

## Integration with CI/CD

The script can be integrated into GitHub Actions or other CI/CD:

```yaml
- name: Update profiles from markdown
  run: |
    python scripts/markdown_to_json.py \
      --category movies \
      --markdown-dir docs/tmp \
      --json-dir public/data \
      --start-id 76 \
      --languages en es pt-BR \
      --manifest public/data/manifest.json
```

## Questions?

Refer to:
1. `README.md` - Full documentation
2. `EXAMPLES.md` - Usage examples
3. Script help: `python scripts/markdown_to_json.py --help`

