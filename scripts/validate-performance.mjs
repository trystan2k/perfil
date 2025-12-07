#!/usr/bin/env node

/**
 * Performance validation script for Task #53
 * Compares payload sizes between monolithic and category-based approaches
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const LOCALES = ['en', 'es', 'pt-BR'];

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return Buffer.byteLength(content, 'utf-8');
  } catch {
    return 0;
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate percentage reduction
 */
function calculateReduction(oldSize, newSize) {
  const reduction = ((oldSize - newSize) / oldSize) * 100;
  return reduction.toFixed(2);
}

/**
 * Analyze performance for a locale
 */
async function analyzeLocale(locale) {
  console.log(`\n📊 Analyzing locale: ${locale}`);
  console.log('='.repeat(50));

  // Old approach: single profiles.json
  const oldFilePath = join(projectRoot, 'public', 'data', locale, 'profiles.json');
  const oldSize = await getFileSize(oldFilePath);

  console.log(`\n📦 Monolithic Approach (profiles.json):`);
  console.log(`   Size: ${formatBytes(oldSize)}`);

  // New approach: read manifest to find all category files
  const manifestPath = join(projectRoot, 'public', 'data', locale, 'manifest.json');
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);

  let totalNewSize = 0;
  const categorySizes = [];

  for (const category of manifest.categories) {
    let categorySize = 0;
    for (const file of category.files) {
      const filePath = join(
        projectRoot,
        'public',
        'data',
        locale,
        category.slug,
        file
      );
      const fileSize = await getFileSize(filePath);
      categorySize += fileSize;
    }
    totalNewSize += categorySize;
    categorySizes.push({
      name: category.displayName,
      slug: category.slug,
      size: categorySize,
      fileCount: category.files.length,
    });
  }

  // Add manifest size
  const manifestSize = await getFileSize(manifestPath);
  totalNewSize += manifestSize;

  console.log(`\n📂 Category-Based Approach:`);
  console.log(`   Manifest: ${formatBytes(manifestSize)}`);

  for (const cat of categorySizes) {
    console.log(
      `   ${cat.name}: ${formatBytes(cat.size)} (${cat.fileCount} file${cat.fileCount > 1 ? 's' : ''})`
    );
  }

  console.log(`   Total: ${formatBytes(totalNewSize)}`);

  // Calculate typical user load (1 category)
  const avgCategorySize =
    categorySizes.reduce((sum, cat) => sum + cat.size, 0) /
    categorySizes.length;
  const typicalLoad = manifestSize + avgCategorySize;

  console.log(`\n🎯 Typical User Load (manifest + 1 category):`);
  console.log(`   ${formatBytes(typicalLoad)}`);

  const reduction = calculateReduction(oldSize, typicalLoad);

  console.log(`\n✅ Payload Reduction: ${reduction}%`);

  if (Number.parseFloat(reduction) >= 50) {
    console.log(`   🎉 SUCCESS: Exceeds 50% target!`);
  } else {
    console.log(`   ⚠️  WARNING: Below 50% target`);
  }

  return {
    locale,
    oldSize,
    newTotalSize: totalNewSize,
    typicalLoad,
    reduction: Number.parseFloat(reduction),
    categories: categorySizes.length,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Performance Validation Report');
  console.log('Task #53: Progressive Data Loading');
  console.log('='.repeat(50));

  const results = [];

  for (const locale of LOCALES) {
    const result = await analyzeLocale(locale);
    results.push(result);
  }

  // Summary
  console.log('\n\n📈 SUMMARY');
  console.log('='.repeat(50));

  const avgReduction =
    results.reduce((sum, r) => sum + r.reduction, 0) / results.length;

  console.log(`\nAverage Payload Reduction: ${avgReduction.toFixed(2)}%`);
  console.log(
    `Target Achievement: ${avgReduction >= 50 ? '✅ PASSED' : '❌ FAILED'}`
  );

  console.log('\nPer-Locale Results:');
  for (const result of results) {
    console.log(
      `  ${result.locale}: ${formatBytes(result.oldSize)} → ${formatBytes(result.typicalLoad)} (${result.reduction}%)`
    );
  }

  // Network simulation recommendations
  console.log('\n\n🌐 Network Simulation Recommendations:');
  console.log('='.repeat(50));
  console.log('Slow 3G (400kb/s):');
  const slow3gTime =
    (results[0].typicalLoad / (400 * 1024)) * 8; // Convert to seconds
  console.log(`  Estimated load time: ${slow3gTime.toFixed(2)}s`);

  console.log('\nFast 3G (1.6Mb/s):');
  const fast3gTime =
    (results[0].typicalLoad / (1.6 * 1024 * 1024)) * 8;
  console.log(`  Estimated load time: ${fast3gTime.toFixed(2)}s`);

  console.log('\n✅ Performance validation complete!');
  console.log(
    '\nNext steps: Run E2E tests and Lighthouse for real-world validation'
  );
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
