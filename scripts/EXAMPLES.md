# markdown_to_json.py Examples

This document provides practical examples of how to use the markdown_to_json.py script.

## Example 1: Movies (Basic)

Add 25 new movie profiles (076-100) without updating manifest:

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR
```

## Example 2: Movies (With Manifest Update)

Add 25 new movie profiles and automatically update manifest.json:

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

## Example 3: Famous People

Add famous person profiles starting at ID 101:

```bash
python scripts/markdown_to_json.py \
    --category famous-people \
    --id-prefix famous \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 101 \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

## Example 4: Single Language Only

Add profiles for English only:

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en
```

## Example 5: Custom Start ID

Add 50 new music profiles starting at ID 51:

```bash
python scripts/markdown_to_json.py \
    --category music \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 51 \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

## Markdown File Preparation

Before running the script, prepare your markdown files:

### File Location
Place markdown files in the directory specified by `--markdown-dir` (typically `docs/tmp`)

### File Naming
The script looks for files named:
- `{category}.md` (e.g., `movies.md`)
- `{category}_{language}.md` (e.g., `movies_en.md`)
- `{category}-{language}.md` (e.g., `movies-en.md`)

### File Format
Each markdown file should follow this structure:

```markdown
1. Movie Title
- This is the first clue about the movie
- This is the second clue about the movie
- This is the third clue about the movie
- ... (continue with clues 4-20)

2. Another Movie Title
- Clue about this movie
- Another clue
- ... (20 clues total)

3. Third Movie Title
- ... (20 clues)
```

**Important Requirements:**
- Exactly 20 clues per profile
- Each clue starts with `- ` (dash and space)
- Profiles numbered sequentially (1., 2., 3., etc.)

### Example Movie File
See `docs/tmp/movies.md` for a working example with 25 movie profiles.

## Workflow: Adding New Profiles Step by Step

### Step 1: Create Markdown Files
Create three markdown files in `docs/tmp/`:
- `movies.md` - English profiles
- `movies_es.md` - Spanish profiles  
- `movies_pt-BR.md` - Portuguese profiles

Each file should have the same structure with 20 clues per profile.

### Step 2: Verify File Format
Manually check a few profiles to ensure:
- Correct number of clues (exactly 20)
- Clues formatted properly (start with `- `)
- No typos in profile titles

### Step 3: Run the Script
Execute the markdown_to_json.py script:

```bash
python scripts/markdown_to_json.py \
    --category movies \
    --markdown-dir docs/tmp \
    --json-dir public/data \
    --start-id 76 \
    --languages en es pt-BR \
    --manifest public/data/manifest.json
```

### Step 4: Verify Output
Check the console output for:
- ✓ Symbol next to each language
- Correct number of profiles added
- "Process completed successfully" message

### Step 5: Validate Data
Verify the JSON files are still valid:

```bash
python3 -m json.tool public/data/movies/en/data-1.json > /dev/null && echo "Valid"
python3 -m json.tool public/data/movies/es/data-1.json > /dev/null && echo "Valid"
python3 -m json.tool public/data/movies/pt-BR/data-1.json > /dev/null && echo "Valid"
```

### Step 6: Commit Changes
Commit the updated files:

```bash
git add public/data/movies/*/data-1.json public/data/manifest.json
git commit -m "Add 25 new movie profiles (076-100)"
```

## Troubleshooting

### Error: "No markdown file found"
**Cause:** Script can't find the markdown file.
**Solution:** 
- Check file naming matches expected pattern
- Verify `--markdown-dir` path is correct
- Ensure file extension is `.md`

### Error: "JSON file not found"
**Cause:** Expected JSON file doesn't exist at the path.
**Solution:**
- Verify `--json-dir` is pointing to `public/data`
- Check that category subdirectories exist (e.g., `public/data/movies/en/`)
- Ensure `data-1.json` file exists in each language directory

### Warning: "has X clues, expected 20"
**Cause:** A profile doesn't have exactly 20 clues.
**Solution:**
- Edit the markdown file and add/remove clues as needed
- Re-run the script after fixing

### Error: "Invalid JSON"
**Cause:** Generated JSON file has syntax errors.
**Solution:**
- Validate with: `python3 -m json.tool public/data/movies/en/data-1.json`
- Check for special characters in profile titles or clues that might need escaping
- Try running on a smaller subset first

## Performance Notes

- Small batches (25-50 profiles): < 1 second
- Large batches (500+ profiles): < 5 seconds
- Manifest update adds < 1 second per language

## Integration with Other Tools

The script outputs simple logging that can be:
- Piped to log files: `python scripts/markdown_to_json.py ... > log.txt 2>&1`
- Monitored by CI/CD systems
- Parsed by other automation tools

## Advanced: Batch Processing

To process multiple categories:

```bash
for category in movies famous-people; do
    python scripts/markdown_to_json.py \
        --category $category \
        --markdown-dir docs/tmp \
        --json-dir public/data \
        --languages en es pt-BR \
        --manifest public/data/manifest.json
done
```

## Tips and Best Practices

1. **Test with a single language first** to catch errors quickly
2. **Run manifest update in a separate pass** to verify JSON files first
3. **Keep backup copies** of JSON files before running the script
4. **Use consistent formatting** across markdown files for all languages
5. **Validate profile uniqueness** before running if dealing with updates
6. **Monitor file sizes** - if JSON files get too large (>10MB), consider splitting

