#!/usr/bin/env python3
"""
Generic script to convert markdown profile files to JSON data format.

This script reads markdown files with profiles and their clues, then adds them
to the corresponding JSON data files for each language.

Usage:
    python scripts/markdown_to_json.py \
        --category movies \
        --markdown-dir docs/tmp \
        --json-dir public/data \
        --start-id 76 \
        --language-files en es pt-BR

Or with config file:
    python scripts/markdown_to_json.py --config config.yaml
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MarkdownParser:
    """Parser for markdown profile files."""
    
    @staticmethod
    def parse_md_file(filepath: Path) -> List[Dict[str, any]]:
        """
        Parse a markdown file and extract movie profiles.
        
        Expected format:
        1. Title
        - Clue 1
        - Clue 2
        ...
        - Clue 20
        
        2. Next Title
        - Clue 1
        ...
        
        Args:
            filepath: Path to markdown file
            
        Returns:
            List of dicts with 'title' and 'clues' keys
        """
        if not filepath.exists():
            raise FileNotFoundError(f"Markdown file not found: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        movies = []
        # Split by numbered headers (1. Title, 2. Title, etc)
        sections = re.split(r'\n(?=\d+\. )', content)
        
        for section in sections:
            if not section.strip():
                continue
            
            lines = section.strip().split('\n')
            if not lines[0]:
                continue
            
            # Extract title from first line
            title_match = re.match(r'\d+\.\s+(.+)', lines[0])
            if not title_match:
                logger.warning(f"Could not parse title from: {lines[0]}")
                continue
            
            title = title_match.group(1).strip()
            clues = []
            
            # Extract clues (lines starting with "- ")
            for line in lines[1:]:
                if line.startswith('- '):
                    clues.append(line[2:].strip())
            
            # Validate clue count
            if len(clues) != 20:
                logger.warning(
                    f"Profile '{title}' has {len(clues)} clues, expected 20"
                )
            
            if clues:
                movies.append({'title': title, 'clues': clues})
        
        return movies


class JSONDataManager:
    """Manager for JSON data files."""
    
    @staticmethod
    def load_json(filepath: Path) -> Dict:
        """Load and parse JSON file."""
        if not filepath.exists():
            raise FileNotFoundError(f"JSON file not found: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    @staticmethod
    def save_json(filepath: Path, data: Dict) -> None:
        """Save data to JSON file."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def validate_json(filepath: Path) -> bool:
        """Validate JSON file syntax."""
        try:
            JSONDataManager.load_json(filepath)
            return True
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {filepath}: {e}")
            return False


class ProfileGenerator:
    """Generate profile objects for JSON files."""
    
    @staticmethod
    def create_profile(
        profile_id: str,
        title: str,
        clues: List[str],
        language: str,
        category: str = "Movies"
    ) -> Dict:
        """
        Create a profile object.
        
        Args:
            profile_id: Unique profile ID (e.g., "profile-movie-076")
            title: Profile title/name
            clues: List of 20 clues
            language: Language code (e.g., "en", "es", "pt-BR")
            category: Category name
            
        Returns:
            Profile dictionary
        """
        return {
            "id": profile_id,
            "category": category,
            "name": title,
            "clues": clues,
            "metadata": {
                "language": language,
                "difficulty": "medium",
                "source": "entertainment"
            }
        }


class DataUpdater:
    """Update JSON data files with new profiles."""
    
    def __init__(
        self,
        category: str,
        id_prefix: str,
        json_dir: Path,
        markdown_dir: Path,
        start_id: int = 1
    ):
        """
        Initialize the updater.
        
        Args:
            category: Category name (e.g., "Movies")
            id_prefix: ID prefix for profiles (e.g., "movie")
            json_dir: Directory containing JSON data files
            markdown_dir: Directory containing markdown files
            start_id: Starting ID for new profiles (default: 1)
        """
        self.category = category
        self.id_prefix = id_prefix
        self.json_dir = Path(json_dir)
        self.markdown_dir = Path(markdown_dir)
        self.start_id = start_id
        self.parser = MarkdownParser()
        self.json_manager = JSONDataManager()
    
    def get_markdown_file(self, language: str) -> Path:
        """Get markdown file path for language."""
        # Try different naming conventions
        for suffix in ['', '_' + language, '-' + language]:
            for ext in [f'{suffix}.md', f'{suffix}_md.md']:
                filepath = self.markdown_dir / f"{self.category.lower()}{ext}"
                if filepath.exists():
                    return filepath
        
        raise FileNotFoundError(
            f"No markdown file found for {language} in {self.markdown_dir}"
        )
    
    def get_json_file(self, language: str) -> Path:
        """Get JSON file path for language."""
        # Expected structure: public/data/{category}/{language}/data-1.json
        json_file = self.json_dir / self.category.lower() / language / "data-1.json"
        return json_file
    
    def update_language(self, language: str) -> int:
        """
        Update JSON file for a specific language.
        
        Args:
            language: Language code (e.g., "en", "es", "pt-BR")
            
        Returns:
            Number of profiles added
        """
        logger.info(f"Processing {language}...")
        
        # Get file paths
        markdown_file = self.get_markdown_file(language)
        json_file = self.get_json_file(language)
        
        logger.info(f"  Reading: {markdown_file}")
        
        # Parse markdown file
        movies = self.parser.parse_md_file(markdown_file)
        
        if not movies:
            logger.warning(f"No profiles found in {markdown_file}")
            return 0
        
        logger.info(f"  Found {len(movies)} profiles")
        
        # Load existing JSON
        logger.info(f"  Loading: {json_file}")
        data = self.json_manager.load_json(json_file)
        
        # Generate new profiles
        new_profiles = []
        for idx, movie in enumerate(movies):
            profile_id = f"profile-{self.id_prefix}-{self.start_id + idx:03d}"
            profile = ProfileGenerator.create_profile(
                profile_id=profile_id,
                title=movie['title'],
                clues=movie['clues'],
                language=language,
                category=self.category
            )
            new_profiles.append(profile)
        
        # Add to existing profiles
        data['profiles'].extend(new_profiles)
        
        # Save updated JSON
        logger.info(f"  Writing {len(new_profiles)} profiles to {json_file}")
        self.json_manager.save_json(json_file, data)
        
        # Validate
        if not self.json_manager.validate_json(json_file):
            logger.error(f"JSON validation failed for {json_file}")
            return 0
        
        logger.info(f"  ✓ Successfully added {len(new_profiles)} profiles")
        return len(new_profiles)
    
    def update_all_languages(self, languages: List[str]) -> Dict[str, int]:
        """
        Update JSON files for multiple languages.
        
        Args:
            languages: List of language codes
            
        Returns:
            Dict mapping language to number of profiles added
        """
        results = {}
        
        for language in languages:
            try:
                count = self.update_language(language)
                results[language] = count
            except Exception as e:
                logger.error(f"Error processing {language}: {e}")
                results[language] = 0
        
        return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Convert markdown profile files to JSON data format"
    )
    
    parser.add_argument(
        '--category',
        required=True,
        help='Category name (e.g., "Movies")'
    )
    parser.add_argument(
        '--id-prefix',
        help='ID prefix for profiles (e.g., "movie"). Defaults to lowercase category'
    )
    parser.add_argument(
        '--markdown-dir',
        type=Path,
        required=True,
        help='Directory containing markdown files'
    )
    parser.add_argument(
        '--json-dir',
        type=Path,
        required=True,
        help='Root directory containing JSON data files'
    )
    parser.add_argument(
        '--start-id',
        type=int,
        default=1,
        help='Starting ID for new profiles (default: 1)'
    )
    parser.add_argument(
        '--languages',
        nargs='+',
        default=['en', 'es', 'pt-BR'],
        help='Language codes to process (default: en es pt-BR)'
    )
    parser.add_argument(
        '--manifest',
        type=Path,
        help='Optional: Path to manifest.json to update profile counts'
    )
    
    args = parser.parse_args()
    
    # Set ID prefix if not provided
    id_prefix = args.id_prefix or args.category.lower()
    
    logger.info("=" * 60)
    logger.info(f"Markdown to JSON Converter")
    logger.info("=" * 60)
    logger.info(f"Category: {args.category}")
    logger.info(f"ID Prefix: {id_prefix}")
    logger.info(f"Markdown Dir: {args.markdown_dir}")
    logger.info(f"JSON Dir: {args.json_dir}")
    logger.info(f"Start ID: {args.start_id}")
    logger.info(f"Languages: {', '.join(args.languages)}")
    logger.info("=" * 60)
    
    # Create updater
    updater = DataUpdater(
        category=args.category,
        id_prefix=id_prefix,
        json_dir=args.json_dir,
        markdown_dir=args.markdown_dir,
        start_id=args.start_id
    )
    
    # Update all languages
    results = updater.update_all_languages(args.languages)
    
    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    
    total_added = 0
    for language, count in results.items():
        status = "✓" if count > 0 else "✗"
        logger.info(f"{status} {language}: {count} profiles added")
        total_added += count
    
    logger.info(f"\nTotal profiles added: {total_added}")
    
    # Update manifest if provided
    if args.manifest and args.manifest.exists():
        logger.info("\n" + "=" * 60)
        logger.info("Updating manifest...")
        logger.info("=" * 60)
        
        try:
            with open(args.manifest, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            # Find category and update profile counts
            category_slug = args.category.lower()
            for category in manifest.get('categories', []):
                if category.get('slug') == category_slug:
                    # Get new total profile count from JSON
                    for language in args.languages:
                        json_file = updater.get_json_file(language)
                        data = updater.json_manager.load_json(json_file)
                        new_count = len(data['profiles'])
                        
                        if language in category['locales']:
                            category['locales'][language]['profileAmount'] = new_count
                            logger.info(
                                f"  Updated {language}: "
                                f"{category['locales'][language]['profileAmount']} profiles"
                            )
            
            # Save manifest
            with open(args.manifest, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)
            
            logger.info("✓ Manifest updated successfully")
        except Exception as e:
            logger.error(f"Error updating manifest: {e}")
    
    logger.info("\n" + "=" * 60)
    logger.info("✓ Process completed successfully")
    logger.info("=" * 60)
    
    return 0 if total_added > 0 else 1


if __name__ == '__main__':
    sys.exit(main())

