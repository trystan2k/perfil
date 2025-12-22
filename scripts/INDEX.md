# Scripts Directory - Index

## Overview

This directory contains reusable utility scripts for the Perfil project.

## Files

### markdown_to_json.py
**Generic Python script to convert markdown profiles to JSON data files**

- **Purpose:** Automates the process of adding new profiles to any category
- **Language:** Python 3.7+
- **Dependencies:** None (standard library only)
- **Usage:** `python scripts/markdown_to_json.py --category movies --markdown-dir docs/tmp --json-dir public/data --start-id 76 --languages en es pt-BR --manifest public/data/manifest.json`

**Key Features:**
- ✓ Works with any category
- ✓ Multi-language support
- ✓ JSON validation
- ✓ Manifest.json updates
- ✓ Detailed logging
- ✓ Error handling

**Making it executable:**
```bash
chmod +x scripts/markdown_to_json.py
./scripts/markdown_to_json.py --help
```

---

## Documentation

### README.md
**Full technical documentation**

- Complete usage guide
- Argument reference
- Expected directory structure
- Input/output specifications
- Error handling details
- Features and capabilities

**Read this for:** Understanding all options and technical details

---

### SETUP_GUIDE.md
**Step-by-step guide for using the script**

- Quick start instructions
- Directory structure requirements
- File naming conventions
- Step-by-step examples
- Troubleshooting section
- Advanced usage patterns
- CI/CD integration examples

**Read this for:** Learning how to use the script with practical examples

---

### EXAMPLES.md
**Real-world usage examples**

- 5 practical command examples
- Markdown file preparation guide
- Complete workflow (6 steps)
- Troubleshooting with solutions
- Performance notes
- Best practices and tips

**Read this for:** Copy-paste ready commands and workflows

---

## Quick Links

### For First Time Users
1. Read: `SETUP_GUIDE.md`
2. Prepare your markdown files
3. Run: `python scripts/markdown_to_json.py --category movies --markdown-dir docs/tmp --json-dir public/data --start-id 76 --languages en es pt-BR --manifest public/data/manifest.json`
4. Verify results
5. Commit changes

### For Specific Questions
- **"How do I use the script?"** → See `EXAMPLES.md`
- **"What are all the options?"** → See `README.md`
- **"I got an error, how do I fix it?"** → See `SETUP_GUIDE.md` troubleshooting
- **"How does the script work?"** → See `README.md` implementation details

### For Integration
- **CI/CD Integration** → See `SETUP_GUIDE.md` CI/CD section
- **Advanced Usage** → See `SETUP_GUIDE.md` advanced usage
- **Batch Processing** → See `EXAMPLES.md` advanced section

---

## Markdown File Format

All scripts expect markdown files with this structure:

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

**Requirements:**
- Exactly 20 clues per profile
- Each clue starts with `- ` (dash + space)
- Profiles numbered sequentially (1., 2., 3., etc.)

---

## JSON File Format

Scripts generate JSON profiles in this format:

```json
{
  "id": "profile-{prefix}-{id:03d}",
  "category": "Category Name",
  "name": "Profile Title",
  "clues": [
    "Clue 1",
    "Clue 2",
    ...
    "Clue 20"
  ],
  "metadata": {
    "language": "en",
    "difficulty": "medium",
    "source": "entertainment"
  }
}
```

---

## Usage Summary

### Basic Command
```bash
python scripts/markdown_to_json.py \
    --category {category} \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id {start_id} \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

### Common Variations
```bash
# Single language
--languages en

# Multiple languages
--languages en es pt-BR

# Custom ID prefix
--id-prefix film

# Skip manifest update
# (just omit --manifest)

# Process only certain languages
--languages es pt-BR
```

---

## Requirements

- Python 3.7 or higher
- Standard library only (no external dependencies)
- Proper directory structure (see SETUP_GUIDE.md)
- Properly formatted markdown files

---

## Example Workflow

### Adding 25 Movie Profiles

```bash
# 1. Create markdown files in docs/tmp/
#    - movies.md (English)
#    - movies_es.md (Spanish)
#    - movies_pt-BR.md (Portuguese)

# 2. Run the script
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR \
    --manifest public/data/manifest.json

# 3. Verify results
python3 -m json.tool public/data/movies/en/data-1.json > /dev/null && echo "Valid"

# 4. Commit changes
git add public/data/movies/*/data-1.json public/data/manifest.json
git commit -m "Add 25 new movie profiles (076-100)"
```

---

## Future Enhancements

Planned improvements for the script:

- [ ] Configuration file support (YAML/JSON)
- [ ] Batch processing multiple categories
- [ ] Automatic profile deduplication
- [ ] Difficulty level auto-assignment
- [ ] Profile count validation
- [ ] Dry-run mode
- [ ] Export to other formats

---

## Support

For issues or questions:

1. Check relevant documentation:
   - `README.md` - Technical details
   - `SETUP_GUIDE.md` - How to use
   - `EXAMPLES.md` - Real examples

2. Review script help:
   ```bash
   python scripts/markdown_to_json.py --help
   ```

3. Check script source for implementation details:
   ```bash
   less scripts/markdown_to_json.py
   ```

---

## Version History

### v1.0 (2025-12-22)
- Initial release
- Generic profile conversion from markdown to JSON
- Multi-language support
- Manifest.json updates
- Comprehensive documentation

---

## Author Notes

This script was created to streamline the process of adding new profiles across multiple languages. It's designed to be:

- **Generic:** Works with any category
- **Reusable:** Can be used for different categories multiple times
- **Reliable:** Validates JSON and provides detailed logging
- **Maintainable:** Well-documented and clearly structured

Feel free to extend or modify as needed!

