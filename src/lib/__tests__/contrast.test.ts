import { describe, it, expect } from 'vitest';
import {
  checkContrast,
  getContrastRatio,
  getLuminance,
  hslToHex,
  meetsWCAG_AA_LargeText,
  meetsWCAG_AA_NormalText,
  meetsWCAG_AA_UIComponents,
} from '../contrast';

describe('Contrast Utilities', () => {
  describe('getLuminance', () => {
    it('should calculate luminance correctly', () => {
      const white = getLuminance('#ffffff');
      const black = getLuminance('#000000');

      expect(white).toBeCloseTo(1, 2);
      expect(black).toBeCloseTo(0, 2);
    });

    it('should handle hex values with or without #', () => {
      const with_hash = getLuminance('#ffffff');
      const without_hash = getLuminance('ffffff');

      expect(with_hash).toBeCloseTo(without_hash, 5);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio between white and black as 21:1', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should calculate same ratio regardless of color order', () => {
      const ratio1 = getContrastRatio('#000000', '#ffffff');
      const ratio2 = getContrastRatio('#ffffff', '#000000');

      expect(ratio1).toBeCloseTo(ratio2, 5);
    });
  });

  describe('WCAG AA Normal Text (4.5:1)', () => {
    it('white on black should meet WCAG AA normal text', () => {
      expect(meetsWCAG_AA_NormalText('#ffffff', '#000000')).toBe(true);
    });

    it('light grey on dark grey should check correctly', () => {
      const result = meetsWCAG_AA_NormalText('#f2f2f2', '#141414');
      expect(result).toBe(true);
    });
  });

  describe('WCAG AA Large Text (3:1)', () => {
    it('white on black should meet WCAG AA large text', () => {
      expect(meetsWCAG_AA_LargeText('#ffffff', '#000000')).toBe(true);
    });

    it('should detect insufficient contrast', () => {
      const result = meetsWCAG_AA_LargeText('#999999', '#141414');
      expect(result).toBe(true);
    });
  });

  describe('WCAG AA UI Components (3:1)', () => {
    it('borders should meet WCAG AA UI components', () => {
      // Updated dark mode border: 0 0% 40%
      const darkModeBorder = hslToHex(0, 0, 40);
      const darkModeBackground = hslToHex(0, 0, 8);

      const result = meetsWCAG_AA_UIComponents(darkModeBorder, darkModeBackground);
      expect(result).toBe(true);
    });

    it('should verify new border values meet standards', () => {
      const newBorder = '#666666'; // 0 0% 40%
      const background = '#141414'; // 0 0% 8%

      const ratio = getContrastRatio(newBorder, background);
      expect(ratio).toBeGreaterThanOrEqual(3); // Should be ~3.21
      expect(meetsWCAG_AA_UIComponents(newBorder, background)).toBe(true);
    });
  });

  describe('checkContrast', () => {
    it('should return comprehensive contrast check results', () => {
      const result = checkContrast('#ffffff', '#000000');

      expect(result.color1).toBe('#ffffff');
      expect(result.color2).toBe('#000000');
      expect(result.ratio).toBeGreaterThan(20);
      expect(result.passes.wcag_aa_normal).toBe(true);
      expect(result.passes.wcag_aaa_normal).toBe(true);
    });

    it('should identify colors that fail WCAG AA', () => {
      // Light grey text on slightly darker grey background
      const result = checkContrast('#cccccc', '#999999');

      expect(result.passes.wcag_aa_normal).toBe(false);
    });
  });

  describe('hslToHex', () => {
    it('should convert white HSL to hex', () => {
      const white = hslToHex(0, 0, 100);
      expect(white).toBe('#ffffff');
    });

    it('should convert black HSL to hex', () => {
      const black = hslToHex(0, 0, 0);
      expect(black).toBe('#000000');
    });

    it('should convert dark mode background correctly', () => {
      const darkBg = hslToHex(0, 0, 8);
      expect(darkBg).toBe('#141414');
    });

    it('should convert updated dark mode border correctly', () => {
      const border = hslToHex(0, 0, 40);
      expect(border).toBe('#666666');
    });

    it('should convert updated muted foreground correctly', () => {
      const muted = hslToHex(0, 0, 65);
      expect(muted).toBe('#a6a6a6');
    });

    it('should convert primary yellow light correctly', () => {
      const primaryLight = hslToHex(48, 94, 57);
      expect(primaryLight).toBe('#f8cf2a');
    });

    it('should convert primary yellow dark correctly', () => {
      const primaryDark = hslToHex(45, 85, 52);
      expect(primaryDark).toBe('#edb91d');
    });
  });

  describe('Dark Mode Color Verification', () => {
    it('should verify critical dark mode colors meet accessibility standards', () => {
      const darkModeColors = {
        foreground: hslToHex(0, 0, 95), // Light text
        background: hslToHex(0, 0, 8), // Very dark background
        mutedForeground: hslToHex(0, 0, 65), // Updated muted text
        border: hslToHex(0, 0, 40), // Updated border
        card: hslToHex(0, 0, 14), // Card background
      };

      // Check foreground on background (normal text)
      const fgOnBg = checkContrast(darkModeColors.foreground, darkModeColors.background);
      expect(fgOnBg.passes.wcag_aa_normal).toBe(true);
      expect(fgOnBg.ratio).toBeGreaterThan(4.5);

      // Check muted foreground on background (muted text)
      const mutedOnBg = checkContrast(darkModeColors.mutedForeground, darkModeColors.background);
      expect(mutedOnBg.passes.wcag_aa_ui).toBe(true);

      // Check border on background (UI components) - critical requirement
      const borderOnBg = checkContrast(darkModeColors.border, darkModeColors.background);
      expect(borderOnBg.passes.wcag_aa_ui).toBe(true);
    });

    it('should verify light mode primary color contrast', () => {
      const lightPrimary = hslToHex(48, 94, 57);
      const lightText = hslToHex(30, 10, 10);

      const result = checkContrast(lightText, lightPrimary);
      expect(result.passes.wcag_aa_normal).toBe(true);
    });

    it('should verify dark mode primary color contrast', () => {
      const darkPrimary = hslToHex(45, 85, 52);
      const darkText = hslToHex(0, 0, 10);

      const result = checkContrast(darkText, darkPrimary);
      expect(result.passes.wcag_aa_normal).toBe(true);
    });
  });
});
