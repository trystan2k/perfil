#!/usr/bin/env node
/**
 * Migration script to restructure data files from locale-first to category-first
 * 
 * OLD STRUCTURE:
 * public/data/{locale}/{category}/data-*.json
 * 
 * NEW STRUCTURE:
 * public/data/{category}/{locale}/data-*.json (using English slugs as canonical)
 * public/data/manifest.json (global)
 */

import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = './public/data';
const LOCALES = ['en', 'es', 'pt-BR'];
const DRY_RUN = process.argv.includes('--dry-run');

// Map locale-specific slugs to canonical English slugs
const CATEGORY_SLUG_MAP = {
  // English (canonical)
  'famous-people': 'famous-people',
  'countries': 'countries',
  'movies': 'movies',
  'animals': 'animals',
  'technology': 'technology',
  'sports': 'sports',
  
  // Spanish -> English
  'personas-famosas': 'famous-people',
  'pases': 'countries',  // Missing accent in folder name
  'películas': 'movies', // Correct spelling
  'pelculas': 'movies',  // Folder name without accent
  'animales': 'animals',
  'tecnología': 'technology', // Correct spelling
  'tecnologa': 'technology',  // Folder name without accent
  'deportes': 'sports',
  
  // Portuguese -> English
  'pessoas-famosas': 'famous-people',
  'países': 'countries', // Correct spelling
  'pases': 'countries',  // Duplicate key, but same target
  'filmes': 'movies',
  'animais': 'animals',
  'tecnologia': 'technology',
  'esportes': 'sports',
};

async function readOldManifest(locale) {
  const manifestPath = join(DATA_DIR, locale, 'manifest.json');
  const content = await readFile(manifestPath, 'utf-8');
  return JSON.parse(content);
}

async function buildGlobalManifest() {
  const manifest = {
    version: '1',
    generatedAt: new Date().toISOString(),
    categories: [],
  };

  // Use canonical English slugs
  const canonicalSlugs = ['famous-people', 'countries', 'movies', 'animals', 'technology', 'sports'];

  for (const slug of canonicalSlugs) {
    const category = {
      slug,
      locales: {},
    };

    // Collect data from each locale
    for (const locale of LOCALES) {
      try {
        const oldManifest = await readOldManifest(locale);
        
        // Find the category in this locale's manifest (by matching canonical slug)
        const oldCategory = oldManifest.categories.find((c) => {
          const canonicalSlug = CATEGORY_SLUG_MAP[c.slug];
          return canonicalSlug === slug;
        });

        if (oldCategory) {
          // Get the actual folder name (might have missing accents)
          const oldCategoryPath = join(DATA_DIR, locale, oldCategory.slug);
          let files = [];
          
          try {
            const fileList = await readdir(oldCategoryPath);
            files = fileList.filter((f) => f.endsWith('.json'));
          } catch (error) {
            console.warn(`  Warning: Could not read files for ${locale}/${oldCategory.slug}`);
            files = ['data-1.json']; // Default
          }

          category.locales[locale] = {
            name: oldCategory.displayName,
            files: files.length > 0 ? files : ['data-1.json'],
          };
        } else {
          console.warn(`  Warning: Category ${slug} not found in ${locale} manifest`);
        }
      } catch (error) {
        console.warn(`  Warning: Could not process ${locale} for category ${slug}:`, error.message);
      }
    }

    // Only add category if at least one locale has it
    if (Object.keys(category.locales).length > 0) {
      manifest.categories.push(category);
    }
  }

  return manifest;
}

async function migrateDataFiles(manifest) {
  console.log('\n📦 Migrating data files...\n');

  for (const category of manifest.categories) {
    const canonicalSlug = category.slug;
    console.log(`Category: ${canonicalSlug}`);

    for (const locale of LOCALES) {
      const localeInfo = category.locales[locale];
      
      if (!localeInfo) {
        console.log(`  ⚠️  Skipped ${locale} (not in manifest)`);
        continue;
      }

      // Find the old locale-specific slug by reverse lookup
      let oldSlug = null;
      try {
        const oldManifest = await readOldManifest(locale);
        const oldCategory = oldManifest.categories.find((c) => {
          return CATEGORY_SLUG_MAP[c.slug] === canonicalSlug;
        });
        oldSlug = oldCategory?.slug;
      } catch (error) {
        console.log(`  ⚠️  Could not find old slug for ${locale}`);
        continue;
      }

      if (!oldSlug) {
        console.log(`  ⚠️  No old slug found for ${locale}`);
        continue;
      }

      const oldPath = join(DATA_DIR, locale, oldSlug);
      const newPath = join(DATA_DIR, canonicalSlug, locale);

      try {
        // Read all JSON files from old location
        const files = await readdir(oldPath);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
          console.log(`  ⚠️  No files found in ${oldPath}`);
          continue;
        }

        // Create new directory structure
        if (!DRY_RUN) {
          await mkdir(newPath, { recursive: true });
        }

        // Copy files to new location
        for (const file of jsonFiles) {
          const oldFilePath = join(oldPath, file);
          const newFilePath = join(newPath, file);

          const content = await readFile(oldFilePath, 'utf-8');

          if (DRY_RUN) {
            console.log(`  [DRY RUN] Would copy: ${oldFilePath} -> ${newFilePath}`);
          } else {
            await writeFile(newFilePath, content, 'utf-8');
            console.log(`  ✓ Copied: ${locale}/${file} (from ${oldSlug})`);
          }
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`  ⚠️  Skipped ${locale} (folder not found: ${oldPath})`);
        } else {
          console.error(`  ✗ Error migrating ${locale}:`, error.message);
        }
      }
    }

    console.log('');
  }
}

async function cleanupOldStructure() {
  console.log('🧹 Cleaning up old structure...\n');

  for (const locale of LOCALES) {
    const localePath = join(DATA_DIR, locale);

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would remove: ${localePath}`);
    } else {
      try {
        await rm(localePath, { recursive: true, force: true });
        console.log(`✓ Removed: ${localePath}`);
      } catch (error) {
        console.error(`✗ Error removing ${localePath}:`, error.message);
      }
    }
  }

  console.log('');
}

async function main() {
  console.log('🚀 Starting data structure migration\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}\n`);

  try {
    // Step 1: Build global manifest
    console.log('📋 Building global manifest...\n');
    const globalManifest = await buildGlobalManifest();
    
    const manifestPath = join(DATA_DIR, 'manifest.json');
    const manifestContent = JSON.stringify(globalManifest, null, 2);

    if (DRY_RUN) {
      console.log('[DRY RUN] Would create global manifest:');
      console.log(manifestContent + '\n');
    } else {
      await writeFile(manifestPath, manifestContent, 'utf-8');
      console.log(`✓ Created global manifest: ${manifestPath}\n`);
      console.log('Preview:');
      console.log(manifestContent.substring(0, 800) + '...\n');
    }

    // Step 2: Migrate data files
    await migrateDataFiles(globalManifest);

    // Step 3: Cleanup old structure
    if (!DRY_RUN) {
      const confirm = process.argv.includes('--confirm-delete');
      if (confirm) {
        await cleanupOldStructure();
      } else {
        console.log('⚠️  Skipping cleanup. Run with --confirm-delete to remove old locale folders.\n');
      }
    }

    console.log('✅ Migration completed successfully!\n');
    
    if (DRY_RUN) {
      console.log('Run without --dry-run to apply changes');
      console.log('Add --confirm-delete to also remove old locale folders\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
