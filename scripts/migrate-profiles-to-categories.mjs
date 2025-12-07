#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const LOCALES = ['en', 'es', 'pt-BR'];
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Convert category name to URL-friendly slug
 * "Famous People" -> "famous-people"
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Read and parse profiles.json for a given locale
 */
async function readProfilesJson(locale) {
  const filePath = join(projectRoot, 'public', 'data', locale, 'profiles.json');
  console.log(`Reading ${filePath}...`);
  
  const content = await readFile(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  return data;
}

/**
 * Group profiles by category
 */
function groupByCategory(profiles) {
  const grouped = {};
  
  for (const profile of profiles) {
    const category = profile.category;
    const slug = slugify(category);
    
    if (!grouped[slug]) {
      grouped[slug] = {
        displayName: category,
        slug,
        profiles: [],
      };
    }
    
    grouped[slug].profiles.push(profile);
  }
  
  return grouped;
}

/**
 * Write category data file
 */
async function writeCategoryFile(locale, categorySlug, profiles, version) {
  const dirPath = join(projectRoot, 'public', 'data', locale, categorySlug);
  const filePath = join(dirPath, 'data-1.json');
  
  if (!DRY_RUN) {
    await mkdir(dirPath, { recursive: true });
  }
  
  const data = {
    version,
    profiles,
  };
  
  const content = JSON.stringify(data, null, 2);
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would write ${filePath} (${profiles.length} profiles, ${content.length} bytes)`);
  } else {
    await writeFile(filePath, content, 'utf-8');
    console.log(`✓ Wrote ${filePath} (${profiles.length} profiles, ${content.length} bytes)`);
  }
  
  return {
    slug: categorySlug,
    profileCount: profiles.length,
    fileSize: content.length,
  };
}

/**
 * Write manifest file for locale
 */
async function writeManifest(locale, categories, version) {
  const manifestPath = join(projectRoot, 'public', 'data', locale, 'manifest.json');
  
  const manifest = {
    version,
    locale,
    categories: categories.map(cat => ({
      slug: cat.slug,
      displayName: cat.displayName,
      profileCount: cat.profileCount,
      files: ['data-1.json'],
    })),
    generatedAt: new Date().toISOString(),
  };
  
  const content = JSON.stringify(manifest, null, 2);
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would write manifest: ${manifestPath}`);
  } else {
    await writeFile(manifestPath, content, 'utf-8');
    console.log(`✓ Wrote manifest: ${manifestPath}`);
  }
}

/**
 * Migrate a single locale
 */
async function migrateLocale(locale) {
  console.log(`\n=== Migrating locale: ${locale} ===`);
  
  const data = await readProfilesJson(locale);
  const version = data.version || '1';
  const profiles = data.profiles;
  
  console.log(`Found ${profiles.length} profiles in ${profiles.length > 0 ? profiles.length : 0} categories`);
  
  const grouped = groupByCategory(profiles);
  const categoryNames = Object.keys(grouped);
  
  console.log(`Categories: ${categoryNames.join(', ')}`);
  
  const results = [];
  
  for (const categorySlug of categoryNames) {
    const category = grouped[categorySlug];
    const result = await writeCategoryFile(
      locale,
      categorySlug,
      category.profiles,
      version
    );
    
    results.push({
      ...result,
      displayName: category.displayName,
    });
  }
  
  await writeManifest(locale, results, version);
  
  return {
    locale,
    totalProfiles: profiles.length,
    categories: results,
  };
}

/**
 * Validate migration results
 */
function validateMigration(results) {
  console.log('\n=== Validation ===');
  
  for (const result of results) {
    const totalMigrated = result.categories.reduce((sum, cat) => sum + cat.profileCount, 0);
    
    if (totalMigrated !== result.totalProfiles) {
      console.error(`❌ ${result.locale}: Profile count mismatch! Original: ${result.totalProfiles}, Migrated: ${totalMigrated}`);
      return false;
    }
    
    console.log(`✓ ${result.locale}: ${totalMigrated} profiles migrated across ${result.categories.length} categories`);
  }
  
  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('Profile Migration Script');
  console.log('========================\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be written\n');
  }
  
  const results = [];
  
  for (const locale of LOCALES) {
    try {
      const result = await migrateLocale(locale);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to migrate ${locale}:`, error);
      process.exit(1);
    }
  }
  
  const isValid = validateMigration(results);
  
  if (!isValid) {
    console.error('\n❌ Validation failed!');
    process.exit(1);
  }
  
  console.log('\n✅ Migration completed successfully!');
  
  if (DRY_RUN) {
    console.log('\nTo perform actual migration, run without --dry-run flag:');
    console.log('  node scripts/migrate-profiles-to-categories.mjs');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
