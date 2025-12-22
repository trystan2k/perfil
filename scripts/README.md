# Scripts Directory

This directory contains utility scripts for the Perfil project.

## markdown_to_json.py

A generic Python script to convert markdown profile files into JSON data format for any category.

### Purpose

This script automates the process of:
1. Reading markdown files with profile data (title + 20 clues)
2. Parsing the profiles and clues
3. Creating properly formatted JSON profile objects
4. Adding them to the corresponding JSON data files for each language
5. Optionally updating the manifest.json with new profile counts

### Usage

#### Basic Usage

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR
```

#### Full Usage with Manifest Update

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --id-prefix movie \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

### Arguments

- `--category` (required): Category name (e.g., "Movies", "Famous People")
- `--id-prefix` (optional): ID prefix for profiles (defaults to lowercase category)
- `--markdown-dir` (required): Directory containing markdown files
- `--json-dir` (required): Root directory containing JSON data files
- `--start-id` (optional): Starting ID for new profiles (default: 1)
- `--languages` (optional): Language codes to process (default: `en es pt-BR`)
- `--manifest` (optional): Path to manifest.json to update profile counts

### Input File Format

The script expects markdown files with the following structure:

```markdown
1. Profile Title
- Clue 1
- Clue 2
- Clue 3
...
- Clue 20

2. Another Profile Title
- Clue 1
- Clue 2
...
- Clue 20
```

**Important:**
- Each profile must have exactly 20 clues
- Clues must start with `- ` (dash + space)
- Profiles are numbered sequentially (1., 2., 3., etc.)

### Expected Directory Structure

The script expects this structure for JSON files:

```
public/data/
├── {category_lowercase}/
│   ├── en/
│   │   └── data-1.json
│   ├── es/
│   │   └── data-1.json
│   └── pt-BR/
│       └── data-1.json
└── manifest.json
```

### Output

The script generates:
1. Updated JSON files with new profiles
2. Console logging showing:
   - Files processed
   - Number of profiles added per language
   - Validation results
   - Manifest updates (if applicable)

### Example Output

```
2025-12-22 14:30:45,123 - INFO - ============================================================
2025-12-22 14:30:45,123 - INFO - Markdown to JSON Converter
2025-12-22 14:30:45,123 - INFO - ============================================================
2025-12-22 14:30:45,123 - INFO - Category: Movies
2025-12-22 14:30:45,123 - INFO - ID Prefix: movie
2025-12-22 14:30:45,123 - INFO - Markdown Dir: docs/tmp
2025-12-22 14:30:45,123 - INFO - JSON Dir: public/data
2025-12-22 14:30:45,123 - INFO - Start ID: 76
2025-12-22 14:30:45,123 - INFO - Languages: en, es, pt-BR
2025-12-22 14:30:45,123 - INFO - ============================================================
2025-12-22 14:30:45,234 - INFO - Processing en...
2025-12-22 14:30:45,235 - INFO -   Reading: docs/tmp/movies.md
2025-12-22 14:30:45,236 - INFO -   Found 25 profiles
2025-12-22 14:30:45,237 - INFO -   Loading: public/data/movies/en/data-1.json
2025-12-22 14:30:45,238 - INFO -   Writing 25 profiles to public/data/movies/en/data-1.json
2025-12-22 14:30:45,239 - INFO -   ✓ Successfully added 25 profiles

2025-12-22 14:30:45,240 - INFO - ============================================================
2025-12-22 14:30:45,240 - INFO - SUMMARY
2025-12-22 14:30:45,240 - INFO - ============================================================
2025-12-22 14:30:45,240 - INFO - ✓ en: 25 profiles added
2025-12-22 14:30:45,240 - INFO - ✓ es: 25 profiles added
2025-12-22 14:30:45,240 - INFO - ✓ pt-BR: 25 profiles added
2025-12-22 14:30:45,240 - INFO - 
2025-12-22 14:30:45,240 - INFO - Total profiles added: 75
2025-12-22 14:30:45,241 - INFO - ============================================================
2025-12-22 14:30:45,241 - INFO - Updating manifest...
2025-12-22 14:30:45,241 - INFO - ============================================================
2025-12-22 14:30:45,242 - INFO -   Updated en: 100 profiles
2025-12-22 14:30:45,242 - INFO -   Updated es: 100 profiles
2025-12-22 14:30:45,242 - INFO -   Updated pt-BR: 100 profiles
2025-12-22 14:30:45,242 - INFO - ✓ Manifest updated successfully

2025-12-22 14:30:45,242 - INFO - ============================================================
2025-12-22 14:30:45,242 - INFO - ✓ Process completed successfully
2025-12-22 14:30:45,242 - INFO - ============================================================
```

### Features

✓ **Generic**: Works with any category (movies, famous-people, etc.)
✓ **Multi-language**: Processes multiple languages simultaneously
✓ **Validation**: Checks clue count and JSON syntax
✓ **Error Handling**: Graceful error messages with detailed logging
✓ **Flexible**: Supports custom ID prefixes and starting IDs
✓ **Manifest Integration**: Optional automatic manifest.json updates
✓ **Logging**: Detailed console output for debugging

### Error Handling

The script will:
- Warn if a profile doesn't have exactly 20 clues
- Error if markdown files are not found
- Error if JSON files are invalid
- Error if JSON directory structure doesn't match expected format
- Continue processing other languages if one fails

### Requirements

- Python 3.7+
- Standard library only (no external dependencies)

### Future Enhancements

Possible improvements:
- Support for different file naming conventions
- Config file support (YAML/JSON)
- Batch processing of multiple categories
- Profile deduplication checks
- Difficulty level assignment based on clue content
- Automatic profile count estimation from JSON files

