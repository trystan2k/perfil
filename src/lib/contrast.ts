/**
 * WCAG Contrast Ratio Utilities
 *
 * References:
 * - https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * - https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

/**
 * Calculate relative luminance of a color
 * @param hex Color in hex format (e.g., "#ffffff")
 * @returns Relative luminance value between 0 and 1
 */
export function getLuminance(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  const rgb = parseInt(cleanHex, 16);

  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rl = rsRGB <= 0.03928 ? rsRGB / 12.92 : ((rsRGB + 0.055) / 1.055) ** 2.4;
  const gl = gsRGB <= 0.03928 ? gsRGB / 12.92 : ((gsRGB + 0.055) / 1.055) ** 2.4;
  const bl = bsRGB <= 0.03928 ? bsRGB / 12.92 : ((bsRGB + 0.055) / 1.055) ** 2.4;

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Calculate contrast ratio between two colors
 * @param hex1 First color in hex format
 * @param hex2 Second color in hex format
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard for normal text
 * Requires 4.5:1 ratio
 */
export function meetsWCAG_AA_NormalText(hex1: string, hex2: string): boolean {
  return getContrastRatio(hex1, hex2) >= 4.5;
}

/**
 * Check if contrast meets WCAG AA standard for large text (18pt+ or 14pt+ bold)
 * Requires 3:1 ratio
 */
export function meetsWCAG_AA_LargeText(hex1: string, hex2: string): boolean {
  return getContrastRatio(hex1, hex2) >= 3;
}

/**
 * Check if contrast meets WCAG AA standard for UI components and graphical elements
 * Requires 3:1 ratio
 */
export function meetsWCAG_AA_UIComponents(hex1: string, hex2: string): boolean {
  return getContrastRatio(hex1, hex2) >= 3;
}

/**
 * Check if contrast meets WCAG AAA standard for normal text
 * Requires 7:1 ratio
 */
export function meetsWCAG_AAA_NormalText(hex1: string, hex2: string): boolean {
  return getContrastRatio(hex1, hex2) >= 7;
}

/**
 * Check if contrast meets WCAG AAA standard for large text (18pt+ or 14pt+ bold)
 * Requires 4.5:1 ratio
 */
export function meetsWCAG_AAA_LargeText(hex1: string, hex2: string): boolean {
  return getContrastRatio(hex1, hex2) >= 4.5;
}

/**
 * Color pair checking result
 */
export interface ContrastCheckResult {
  color1: string;
  color2: string;
  ratio: number;
  passes: {
    wcag_aa_normal: boolean;
    wcag_aa_large: boolean;
    wcag_aa_ui: boolean;
    wcag_aaa_normal: boolean;
    wcag_aaa_large: boolean;
  };
}

/**
 * Check contrast between two colors against all standards
 */
export function checkContrast(hex1: string, hex2: string): ContrastCheckResult {
  const ratio = getContrastRatio(hex1, hex2);

  return {
    color1: hex1,
    color2: hex2,
    ratio: Math.round(ratio * 100) / 100,
    passes: {
      wcag_aa_normal: meetsWCAG_AA_NormalText(hex1, hex2),
      wcag_aa_large: meetsWCAG_AA_LargeText(hex1, hex2),
      wcag_aa_ui: meetsWCAG_AA_UIComponents(hex1, hex2),
      wcag_aaa_normal: meetsWCAG_AAA_NormalText(hex1, hex2),
      wcag_aaa_large: meetsWCAG_AAA_LargeText(hex1, hex2),
    },
  };
}

/**
 * HSL to Hex conversion utility for testing
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;

  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}
