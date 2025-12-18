import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../../config/gameConfig';
import {
  generateConfettiPieceConfig,
  createConfettiPieceElement,
  createConfettiContainer,
} from '../confetti';

describe('Confetti Utilities', () => {
  describe('generateConfettiPieceConfig', () => {
    it('should generate a valid confetti piece config', () => {
      const config = generateConfettiPieceConfig();

      expect(config).toHaveProperty('size');
      expect(config).toHaveProperty('duration');
      expect(config).toHaveProperty('xPos');
      expect(config).toHaveProperty('rotation');
      expect(config).toHaveProperty('color');
    });

    it('should generate size between 5 and 15', () => {
      for (let i = 0; i < 20; i++) {
        const config = generateConfettiPieceConfig();
        expect(config.size).toBeGreaterThanOrEqual(5);
        expect(config.size).toBeLessThanOrEqual(15);
      }
    });

    it('should generate duration between 1.5 and 3.5 seconds', () => {
      for (let i = 0; i < 20; i++) {
        const config = generateConfettiPieceConfig();
        expect(config.duration).toBeGreaterThanOrEqual(1.5);
        expect(config.duration).toBeLessThanOrEqual(3.5);
      }
    });

    it('should generate xPos between 0 and 100', () => {
      for (let i = 0; i < 20; i++) {
        const config = generateConfettiPieceConfig();
        expect(config.xPos).toBeGreaterThanOrEqual(0);
        expect(config.xPos).toBeLessThanOrEqual(100);
      }
    });

    it('should generate rotation between 0 and 360', () => {
      for (let i = 0; i < 20; i++) {
        const config = generateConfettiPieceConfig();
        expect(config.rotation).toBeGreaterThanOrEqual(0);
        expect(config.rotation).toBeLessThanOrEqual(360);
      }
    });

    it('should use default colors when none provided', () => {
      const defaultColors = ['#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#92400E'];

      for (let i = 0; i < 20; i++) {
        const config = generateConfettiPieceConfig();
        expect(defaultColors).toContain(config.color);
      }
    });

    it('should use custom colors when provided', () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];

      for (let i = 0; i < 20; i++) {
        const config = generateConfettiPieceConfig(customColors);
        expect(customColors).toContain(config.color);
      }
    });

    it('should generate different values on each call', () => {
      const config1 = generateConfettiPieceConfig();
      const config2 = generateConfettiPieceConfig();
      const config3 = generateConfettiPieceConfig();

      const configs = [config1, config2, config3];

      // At least some values should be different (very unlikely to be identical)
      const sizes = configs.map((c) => c.size);
      const positions = configs.map((c) => c.xPos);

      expect(new Set(sizes).size).toBeGreaterThan(1);
      expect(new Set(positions).size).toBeGreaterThan(1);
    });
  });

  describe('createConfettiPieceElement', () => {
    it('should create a div element', () => {
      const config = generateConfettiPieceConfig();
      const element = createConfettiPieceElement(config);

      expect(element).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply confetti-piece class', () => {
      const config = generateConfettiPieceConfig();
      const element = createConfettiPieceElement(config);

      expect(element.className).toBe('confetti-piece');
    });

    it('should set CSS custom properties', () => {
      const config = {
        size: 10,
        duration: 2,
        xPos: 50,
        rotation: 180,
        color: '#FF0000',
      };
      const element = createConfettiPieceElement(config);

      expect(element.style.getPropertyValue('--confetti-size')).toBe('10px');
      expect(element.style.getPropertyValue('--confetti-x')).toBe('50%');
      expect(element.style.getPropertyValue('--confetti-duration')).toBe('2s');
      expect(element.style.getPropertyValue('--confetti-rotation')).toBe('180deg');
      expect(element.style.getPropertyValue('--confetti-color')).toBe('#FF0000');
    });

    it('should handle decimal values correctly', () => {
      const config = {
        size: 7.5,
        duration: 2.3,
        xPos: 33.33,
        rotation: 45.5,
        color: '#FCD34D',
      };
      const element = createConfettiPieceElement(config);

      expect(element.style.getPropertyValue('--confetti-size')).toBe('7.5px');
      expect(element.style.getPropertyValue('--confetti-x')).toBe('33.33%');
      expect(element.style.getPropertyValue('--confetti-duration')).toBe('2.3s');
      expect(element.style.getPropertyValue('--confetti-rotation')).toBe('45.5deg');
    });
  });

  describe('createConfettiContainer', () => {
    it('should create a div container', () => {
      const container = createConfettiContainer();

      expect(container).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply correct container classes', () => {
      const container = createConfettiContainer();

      expect(container.className).toBe('fixed inset-0 pointer-events-none');
    });

    it('should create default confetti pieces', () => {
      const container = createConfettiContainer();

      expect(container.children.length).toBe(GAME_CONFIG.effects.confettiPieceCount);
    });

    it('should create custom number of confetti pieces', () => {
      const container = createConfettiContainer({ count: 10 });

      expect(container.children.length).toBe(10);
    });

    it('should create confetti pieces with confetti-piece class', () => {
      const container = createConfettiContainer({ count: 5 });

      for (let i = 0; i < container.children.length; i++) {
        expect(container.children[i].className).toBe('confetti-piece');
      }
    });

    it('should create pieces with CSS custom properties set', () => {
      const container = createConfettiContainer({ count: 1 });
      const piece = container.children[0] as HTMLElement;

      expect(piece.style.getPropertyValue('--confetti-size')).toBeTruthy();
      expect(piece.style.getPropertyValue('--confetti-x')).toBeTruthy();
      expect(piece.style.getPropertyValue('--confetti-duration')).toBeTruthy();
      expect(piece.style.getPropertyValue('--confetti-rotation')).toBeTruthy();
      expect(piece.style.getPropertyValue('--confetti-color')).toBeTruthy();
    });

    it('should use default colors when none provided', () => {
      const defaultColors = ['#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#92400E'];
      const container = createConfettiContainer({ count: 20 });

      for (let i = 0; i < container.children.length; i++) {
        const piece = container.children[i] as HTMLElement;
        const color = piece.style.getPropertyValue('--confetti-color');
        expect(defaultColors).toContain(color);
      }
    });

    it('should use custom colors when provided', () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      const container = createConfettiContainer({ colors: customColors, count: 20 });

      for (let i = 0; i < container.children.length; i++) {
        const piece = container.children[i] as HTMLElement;
        const color = piece.style.getPropertyValue('--confetti-color');
        expect(customColors).toContain(color);
      }
    });

    it('should generate varied confetti pieces', () => {
      const container = createConfettiContainer({ count: GAME_CONFIG.effects.confettiPieceCount });
      const sizes = new Set<string>();
      const positions = new Set<string>();

      for (let i = 0; i < container.children.length; i++) {
        const piece = container.children[i] as HTMLElement;
        sizes.add(piece.style.getPropertyValue('--confetti-size'));
        positions.add(piece.style.getPropertyValue('--confetti-x'));
      }

      // Should have variety in sizes and positions
      expect(sizes.size).toBeGreaterThan(10);
      expect(positions.size).toBeGreaterThan(10);
    });

    it('should handle zero confetti pieces', () => {
      const container = createConfettiContainer({ count: 0 });

      expect(container.children.length).toBe(0);
    });

    it('should handle large number of confetti pieces', () => {
      const container = createConfettiContainer({ count: 200 });

      expect(container.children.length).toBe(200);
    });

    it('should accept both count and colors options', () => {
      const customColors = ['#AABBCC'];
      const container = createConfettiContainer({
        count: 5,
        colors: customColors,
      });

      expect(container.children.length).toBe(5);

      for (let i = 0; i < container.children.length; i++) {
        const piece = container.children[i] as HTMLElement;
        const color = piece.style.getPropertyValue('--confetti-color');
        expect(color).toBe('#AABBCC');
      }
    });
  });
});
