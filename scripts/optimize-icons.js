import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ICONS_DIR = path.join(process.cwd(), 'public/icons');
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_PNG_SIZE = 50 * 1024; // 50KB in bytes
const REQUIRED_DIMENSIONS = { width: 512, height: 512 };

// Log levels
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

async function validateImageDimensions(inputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    return {
      valid: metadata.width === REQUIRED_DIMENSIONS.width && metadata.height === REQUIRED_DIMENSIONS.height,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    log.error(`Failed to get metadata for ${inputPath}: ${error.message}`);
    return { valid: false };
  }
}

function formatFileSize(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

function getFileSizeSync(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    log.error(`Failed to read file size for ${filePath}: ${error.message}`);
    return null;
  }
}

async function optimizeIcon(inputPath, fileName) {
  const baseName = path.basename(fileName, path.extname(fileName));

  try {
    // Validate dimensions
    const dimensionCheck = await validateImageDimensions(inputPath);
    if (!dimensionCheck.valid) {
      log.warn(
        `Skipping ${fileName}: expected dimensions ${REQUIRED_DIMENSIONS.width}×${REQUIRED_DIMENSIONS.height}, got ${dimensionCheck.width}×${dimensionCheck.height}`
      );
      return null;
    }

    const compressedPngPath = path.join(ICONS_DIR, `${baseName}.png`);
    const webpPath = path.join(ICONS_DIR, `${baseName}.webp`);

    if (!DRY_RUN) {
      // If processing the original file, don't overwrite it during conversion
      // Just create the WebP version and leave PNG as-is if it's the same
      if (inputPath === compressedPngPath) {
        // Convert to WebP (quality 80 for good balance)
        await sharp(inputPath).webp({ quality: 80, effort: 6 }).toFile(webpPath);
        // For PNG, we'll re-compress it by reading and writing back
        const buffer = await sharp(inputPath).png({ quality: 85, effort: 9 }).toBuffer();
        fs.writeFileSync(compressedPngPath, buffer);
      } else {
        // Compress PNG (quality 85 for good balance)
        await sharp(inputPath).png({ quality: 85, effort: 9 }).toFile(compressedPngPath);

        // Convert to WebP (quality 80 for good balance)
        await sharp(inputPath).webp({ quality: 80, effort: 6 }).toFile(webpPath);
      }
    }

    const pngSize = DRY_RUN ? 0 : getFileSizeSync(compressedPngPath);
    const webpSize = DRY_RUN ? 0 : getFileSizeSync(webpPath);

    // Check PNG size constraint
    if (pngSize > MAX_PNG_SIZE) {
      log.warn(
        `${fileName}: Compressed PNG is ${formatFileSize(pngSize)} (exceeds 50KB limit). Consider reducing quality further.`
      );
      return {
        file: fileName,
        pngSize,
        webpSize,
        valid: false,
        reason: 'PNG size exceeds limit',
      };
    }

    return {
      file: fileName,
      pngSize,
      webpSize,
      valid: true,
    };
  } catch (error) {
    log.error(`Failed to process ${fileName}: ${error.message}`);
    return {
      file: fileName,
      valid: false,
      reason: error.message,
    };
  }
}

async function main() {
  log.info(`Starting icon optimization${DRY_RUN ? ' (dry-run mode)' : ''}...`);

  if (!fs.existsSync(ICONS_DIR)) {
    log.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(ICONS_DIR).filter((file) => file.endsWith('.png'));

  if (files.length === 0) {
    log.warn('No PNG files found in icons directory');
    return;
  }

  log.info(`Found ${files.length} PNG file(s) to process`);

  const results = [];
  for (const file of files) {
    const inputPath = path.join(ICONS_DIR, file);
    const result = await optimizeIcon(inputPath, file);
    if (result) {
      results.push(result);
    }
  }

  // Print summary
  log.info('\n═══════════════════════════════════════════');
  log.info('OPTIMIZATION SUMMARY');
  log.info('═══════════════════════════════════════════');

  const successful = results.filter((r) => r.valid);
  const failed = results.filter((r) => !r.valid);

  if (successful.length > 0) {
    log.success(`\nProcessed: ${successful.length} icon(s)`);
    successful.forEach((result) => {
      log.info(`  ${result.file}`);
      log.info(`    PNG: ${formatFileSize(result.pngSize)} | WebP: ${formatFileSize(result.webpSize)}`);
    });
  }

  if (failed.length > 0) {
    log.error(`\nFailed: ${failed.length} icon(s)`);
    failed.forEach((result) => {
      log.error(`  ${result.file}: ${result.reason}`);
    });
  }

  if (DRY_RUN) {
    log.info('\n(Dry-run mode: no files were actually written)');
  }

  log.info('═══════════════════════════════════════════\n');

  // Exit with error if any optimizations failed and not in dry-run
  if (failed.length > 0 && !DRY_RUN) {
    process.exit(1);
  }
}

main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
