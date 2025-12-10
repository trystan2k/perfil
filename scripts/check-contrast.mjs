#!/usr/bin/env node

/**
 * WCAG AA Contrast Compliance Checker
 * 
 * This script verifies that all theme colors meet WCAG AA standards
 * for both normal text and UI components.
 * 
 * Run with: pnpm check-contrast
 */

// Calculate relative luminance (WCAG formula)
function getLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const rgb = parseInt(cleanHex, 16);
  
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  const rl = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gl = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bl = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

// Calculate contrast ratio
function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Color theme values - derived from CSS variables in src/styles/globals.css
// HSL values are converted to hex for contrast calculation
const themes = {
  light: {
    background: '#f5f5f5',        // 0 0% 96%
    foreground: '#1a1a1a',        // 222 20% 10%
    primary: '#f8cf2a',           // 48 94% 57%
    border: '#e0e0e0',            // 220 15% 88%
    mutedForeground: '#727272',   // 220 10% 45%
  },
  dark: {
    background: '#141414',        // 0 0% 8%
    foreground: '#f2f2f2',        // 0 0% 95%
    primary: '#edb91d',           // 45 85% 52%
    border: '#666666',            // 0 0% 40%
    mutedForeground: '#a6a6a6',   // 0 0% 65%
  },
};

// Define contrast requirements
const requirements = {
  normalText: {
    min: 4.5,
    label: 'Normal text (WCAG AA)',
  },
  largeText: {
    min: 3,
    label: 'Large text (WCAG AA)',
  },
  uiComponents: {
    min: 3,
    label: 'UI components & borders (WCAG AA)',
  },
};

// Check results tracking
let passCount = 0;
let failCount = 0;

function checkContrast(color1, color2, description, requirement) {
  const ratio = getContrastRatio(color1, color2);
  const passes = ratio >= requirement.min;
  
  const status = passes ? '✓' : '✗';
  const result = passes ? 'PASS' : 'FAIL';
  
  console.log(
    `${status} ${description.padEnd(55)} ${ratio.toFixed(2)}:1 (need ${requirement.min}:1) ${result}`
  );
  
  if (passes) {
    passCount++;
  } else {
    failCount++;
  }
  
  return passes;
}

console.log('═════════════════════════════════════════════════════════════════════════\n');
console.log('PWA THEME COLOR - WCAG AA COMPLIANCE CHECK');
console.log('\n═════════════════════════════════════════════════════════════════════════\n');

// Light Mode Checks
console.log('LIGHT MODE');
console.log('─────────────────────────────────────────────────────────────────────────');
checkContrast(
  themes.light.foreground,
  themes.light.background,
  'Foreground text on background',
  requirements.normalText
);
checkContrast(
  themes.light.primary,
  themes.light.foreground,
  'Primary yellow on dark text',
  requirements.normalText
);
checkContrast(
  themes.light.border,
  themes.light.background,
  'Border on background',
  requirements.uiComponents
);
checkContrast(
  themes.light.mutedForeground,
  themes.light.background,
  'Muted text on background',
  requirements.uiComponents
);

// Dark Mode Checks
console.log('\nDARK MODE');
console.log('─────────────────────────────────────────────────────────────────────────');
checkContrast(
  themes.dark.foreground,
  themes.dark.background,
  'Foreground text on background',
  requirements.normalText
);
checkContrast(
  themes.dark.primary,
  themes.dark.foreground,
  'Primary yellow on light text',
  requirements.normalText
);
checkContrast(
  themes.dark.border,
  themes.dark.background,
  'Border on background',
  requirements.uiComponents
);
checkContrast(
  themes.dark.mutedForeground,
  themes.dark.background,
  'Muted text on background',
  requirements.uiComponents
);

// Summary
console.log('\n═════════════════════════════════════════════════════════════════════════');
console.log(`\nRESULTS: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('✓ All color combinations meet WCAG AA requirements!');
  process.exit(0);
} else {
  console.log('✗ Some color combinations do not meet WCAG AA requirements.');
  console.log('  Please review and update theme colors in src/styles/globals.css');
  process.exit(1);
}
