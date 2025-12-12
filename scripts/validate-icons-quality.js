import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ICONS_DIR = path.join(process.cwd(), 'public/icons');
const ICON_SIZE_CHECK = 512; // Check 512x512 icons

// Log levels
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

async function getImageHistogram(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const buffer = await sharp(imagePath).raw().toBuffer();
    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hash: simpleHash(buffer),
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function simpleHash(buffer) {
  let hash = 0;
  for (let i = 0; i < buffer.length; i += 100) {
    hash += buffer[i];
  }
  return hash;
}

async function validateIconQuality() {
  log.info('Starting visual regression validation...\n');

  if (!fs.existsSync(ICONS_DIR)) {
    log.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const pngFiles = fs
    .readdirSync(ICONS_DIR)
    .filter((file) => file.endsWith('.png') && file.includes('512x512'));

  if (pngFiles.length === 0) {
    log.warn('No 512x512 PNG files found for quality validation');
    return;
  }

  log.info(`Validating visual quality of ${pngFiles.length} icon(s)...\n`);

  const results = [];

  for (const pngFile of pngFiles) {
    const pngPath = path.join(ICONS_DIR, pngFile);
    const webpFile = pngFile.replace('.png', '.webp');
    const webpPath = path.join(ICONS_DIR, webpFile);

    if (!fs.existsSync(webpPath)) {
      log.warn(`${pngFile}: WebP counterpart not found`);
      continue;
    }

    const pngInfo = await getImageHistogram(pngPath);
    const webpInfo = await getImageHistogram(webpPath);

    if (!pngInfo.valid || !webpInfo.valid) {
      log.error(`Failed to analyze ${pngFile}`);
      continue;
    }

    // Check if dimensions match
    if (pngInfo.width !== webpInfo.width || pngInfo.height !== webpInfo.height) {
      log.error(`${pngFile}: Dimension mismatch between PNG and WebP`);
      results.push({
        file: pngFile,
        valid: false,
        reason: 'Dimension mismatch',
      });
      continue;
    }

    // Check if dimensions are 512x512
    if (pngInfo.width !== ICON_SIZE_CHECK || pngInfo.height !== ICON_SIZE_CHECK) {
      log.warn(
        `${pngFile}: Not 512x512 (got ${pngInfo.width}×${pngInfo.height}), skipping quality check`
      );
      continue;
    }

    // Basic visual quality check (simple hash comparison)
    const hashDiff = Math.abs(pngInfo.hash - webpInfo.hash);
    const isWithinThreshold = hashDiff < 5000; // Permissive threshold for format differences

    results.push({
      file: pngFile,
      valid: isWithinThreshold,
      pngSize: `${pngInfo.width}×${pngInfo.height}`,
      hashDiff: hashDiff,
      reason: isWithinThreshold
        ? 'Quality acceptable'
        : 'Potential quality loss (manual review recommended)',
    });

    log.info(`${pngFile}`);
    log.info(`  Dimensions: ${pngInfo.width}×${pngInfo.height}`);
    log.info(`  Visual Quality: ${isWithinThreshold ? '✅ PASS' : '⚠️ REVIEW NEEDED'}`);
  }

  // Print summary
  log.info('\n═══════════════════════════════════════════');
  log.info('VISUAL REGRESSION TEST SUMMARY');
  log.info('═══════════════════════════════════════════');

  const successful = results.filter((r) => r.valid);
  const needsReview = results.filter((r) => !r.valid);

  if (successful.length > 0) {
    log.success(`\nPassed: ${successful.length} icon(s)`);
    successful.forEach((result) => {
      log.success(`  ${result.file}: ${result.reason}`);
    });
  }

  if (needsReview.length > 0) {
    log.warn(`\nNeeds Review: ${needsReview.length} icon(s)`);
    needsReview.forEach((result) => {
      log.warn(`  ${result.file}: ${result.reason}`);
    });
  }

  log.info('═══════════════════════════════════════════\n');

  // Note: This test does not fail the build, only reports findings
  log.info(
    'Visual quality validation complete. Please review any icons marked as "NEEDS REVIEW".'
  );
}

validateIconQuality().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
