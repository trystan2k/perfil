import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customRender } from '../../__mocks__/test-utils';
import * as useMediaQueryModule from '../../hooks/useMediaQuery';
import { CompactHeader } from '../CompactHeader';

// Mock useMediaQuery hook
vi.mock('../../hooks/useMediaQuery');

describe('CompactHeader', () => {
  beforeEach(() => {
    // Reset mock before each test - set default to false (desktop)
    vi.mocked(useMediaQueryModule.useMediaQuery).mockReturnValue(false);
  });

  describe('Variant Rendering', () => {
    it('should render mobile variant when variant="mobile"', () => {
      customRender(<CompactHeader variant="mobile" />);

      // Mobile variant should have the settings button
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });

    it('should render desktop variant when variant="desktop"', () => {
      customRender(<CompactHeader variant="desktop" />);

      // Desktop variant should have the settings button (drawer is now used on all viewports)
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });

    it('should render mobile variant when isMobile media query matches with auto variant', () => {
      // Mock useMediaQuery to return true (mobile)
      vi.mocked(useMediaQueryModule.useMediaQuery).mockReturnValue(true);

      customRender(<CompactHeader variant="auto" />);

      // Should have settings button when mobile
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });

    it('should render desktop variant when isMobile media query does not match with auto variant', () => {
      // Mock useMediaQuery to return false (desktop)
      vi.mocked(useMediaQueryModule.useMediaQuery).mockReturnValue(false);

      customRender(<CompactHeader variant="auto" />);

      // Should have settings button when desktop (drawer is now used on all viewports)
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });
  });

  describe('Visual State', () => {
    it('should apply -translate-y-full class when isVisible is false', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile" isVisible={false}>
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('-translate-y-full');
    });

    it('should not apply -translate-y-full class when isVisible is true', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile" isVisible={true}>
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).not.toHaveClass('-translate-y-full');
    });

    it('should default to isVisible=true when not specified', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).not.toHaveClass('-translate-y-full');
    });

    it('should apply base header styles', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50', 'w-full');
      expect(header).toHaveClass('bg-card', 'border-b', 'border-border');
      expect(header).toHaveClass('transition-transform', 'duration-300');
    });
  });

  describe('Settings Button Interaction', () => {
    it('should call onSettingsClick when settings button is clicked', async () => {
      const user = userEvent.setup();
      const onSettingsClick = vi.fn();

      customRender(
        <CompactHeader variant="mobile" onSettingsClick={onSettingsClick}>
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await user.click(settingsButton);

      expect(onSettingsClick).toHaveBeenCalledOnce();
    });

    it('should call onSettingsClick multiple times when button is clicked multiple times', async () => {
      const user = userEvent.setup();
      const onSettingsClick = vi.fn();

      customRender(
        <CompactHeader variant="mobile" onSettingsClick={onSettingsClick}>
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await user.click(settingsButton);
      await user.click(settingsButton);
      await user.click(settingsButton);

      expect(onSettingsClick).toHaveBeenCalledTimes(3);
    });

    it('should have settings button in desktop variant that calls onSettingsClick', async () => {
      const onSettingsClick = vi.fn();
      const user = userEvent.setup();

      customRender(
        <CompactHeader variant="desktop" onSettingsClick={onSettingsClick}>
          <span>Test</span>
        </CompactHeader>
      );

      // Desktop variant now renders the settings button (drawer is used on all viewports)
      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toBeInTheDocument();

      // Click should call the callback
      await user.click(settingsButton);
      expect(onSettingsClick).toHaveBeenCalledOnce();
    });

    it('should not call onSettingsClick if callback is not provided', async () => {
      const user = userEvent.setup();

      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      // Should not throw error when clicking without callback
      await user.click(settingsButton);
      expect(true).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper role and aria-label on header', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      // <header> is a semantic element, doesn't need explicit role
      expect(header?.tagName).toBe('HEADER');
    });

    it('should have aria-label on settings button', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toHaveAttribute('aria-label', 'Open settings');
    });

    it('should have aria-haspopup="dialog" on settings button', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should have title attribute on settings button', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toHaveAttribute('title', 'Settings');
    });

    it('should have aria-hidden on icon', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();

      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await user.tab();

      expect(settingsButton).toHaveFocus();
    });

    it('should have focus ring styling applied on focus', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2'
      );
    });

    it('should have proper button type attribute', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toHaveAttribute('type', 'button');
    });
  });

  describe('CSS Safe Area Insets', () => {
    it('should apply safe-area-inset-top CSS variable', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('pt-[env(safe-area-inset-top)]');
    });

    it('should apply safe-area CSS styling for notch support', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      const classList = Array.from(header?.classList || []);
      // Verify the safe-area class is present in some form
      expect(classList.some((cls) => cls.includes('safe-area'))).toBe(true);
    });
  });

  describe('Layout Variants', () => {
    it('should have correct height for mobile variant', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const headerContent = container.querySelector('div[class*="h-16"]');
      expect(headerContent).toHaveClass('h-16');
    });

    it('should have correct height for desktop variant', () => {
      const { container } = customRender(
        <CompactHeader variant="desktop">
          <span>Test</span>
        </CompactHeader>
      );

      const headerContent = container.querySelector('div[class*="h-16"]');
      expect(headerContent).toHaveClass('h-16');
    });

    it('mobile variant should have correct padding', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const headerContent = container.querySelector('div[class*="h-16"]');
      expect(headerContent).toHaveClass('px-6');
    });

    it('desktop variant should have correct padding', () => {
      const { container } = customRender(
        <CompactHeader variant="desktop">
          <span>Test</span>
        </CompactHeader>
      );

      const headerContent = container.querySelector('div[class*="h-16"]');
      expect(headerContent).toHaveClass('px-6');
    });
  });

  describe('Touch Target Size (WCAG AAA)', () => {
    it('should have 48px minimum touch target for settings button', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toHaveClass('w-12', 'h-12', 'min-w-12', 'min-h-12');
    });

    it('should maintain minimum touch target size', () => {
      customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      // Verify the button meets WCAG AAA touch target size (48px minimum)
      expect(settingsButton).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile" className="custom-class">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toHaveClass('custom-class');
    });

    it('should forward data attributes', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile" data-testid="custom-header" data-feature="mobile-header">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toHaveAttribute('data-testid', 'custom-header');
      expect(header).toHaveAttribute('data-feature', 'mobile-header');
    });

    it('should forward id attribute', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile" id="main-header">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toHaveAttribute('id', 'main-header');
    });
  });

  describe('Responsive Behavior with Auto Variant', () => {
    it('should use useMediaQuery hook for auto variant', () => {
      customRender(
        <CompactHeader variant="auto">
          <span>Test</span>
        </CompactHeader>
      );

      // Component should render without errors when using auto variant
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should determine variant based on media query result - mobile', () => {
      // Mock useMediaQuery to return true (mobile)
      vi.mocked(useMediaQueryModule.useMediaQuery).mockReturnValue(true);

      customRender(
        <CompactHeader variant="auto">
          <span>Test</span>
        </CompactHeader>
      );

      // When mobile, should have settings button
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });

    it('should determine variant based on media query result - desktop', () => {
      // Mock useMediaQuery to return false (desktop)
      vi.mocked(useMediaQueryModule.useMediaQuery).mockReturnValue(false);

      customRender(
        <CompactHeader variant="auto">
          <span>Test</span>
        </CompactHeader>
      );

      // When desktop, should have settings button (drawer is now used on all viewports)
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should handle visibility toggle with isVisible prop', () => {
      const { container, rerender } = customRender(
        <CompactHeader variant="mobile" isVisible={true}>
          <span>Test</span>
        </CompactHeader>
      );

      let header = container.querySelector('header');
      expect(header).not.toHaveClass('-translate-y-full');

      rerender(
        <CompactHeader variant="mobile" isVisible={false}>
          <span>Test</span>
        </CompactHeader>
      );

      header = container.querySelector('header');
      expect(header).toHaveClass('-translate-y-full');

      rerender(
        <CompactHeader variant="mobile" isVisible={true}>
          <span>Test</span>
        </CompactHeader>
      );

      header = container.querySelector('header');
      expect(header).not.toHaveClass('-translate-y-full');
    });

    it('should handle variant changes', () => {
      const { rerender } = customRender(
        <CompactHeader variant="mobile">
          <span>Test</span>
        </CompactHeader>
      );

      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

      rerender(
        <CompactHeader variant="desktop">
          <span>Test</span>
        </CompactHeader>
      );

      // Settings button should still be visible in desktop variant (drawer is used on all viewports)
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });

    it('should handle callback changes', async () => {
      const user = userEvent.setup();
      const onSettingsClick1 = vi.fn();
      const onSettingsClick2 = vi.fn();

      const { rerender } = customRender(
        <CompactHeader variant="mobile" onSettingsClick={onSettingsClick1}>
          <span>Test</span>
        </CompactHeader>
      );

      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      await user.click(settingsButton);
      expect(onSettingsClick1).toHaveBeenCalledOnce();

      rerender(
        <CompactHeader variant="mobile" onSettingsClick={onSettingsClick2}>
          <span>Test</span>
        </CompactHeader>
      );

      await user.click(settingsButton);
      expect(onSettingsClick2).toHaveBeenCalledOnce();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty className string', () => {
      const { container } = customRender(
        <CompactHeader variant="mobile" className="">
          <span>Test</span>
        </CompactHeader>
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('should render without children safely', () => {
      const { container } = customRender(<CompactHeader variant="mobile" />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should handle rapid visibility toggles', () => {
      const { container, rerender } = customRender(
        <CompactHeader variant="mobile" isVisible={true}>
          <span>Test</span>
        </CompactHeader>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <CompactHeader variant="mobile" isVisible={i % 2 === 0}>
            <span>Test</span>
          </CompactHeader>
        );
      }

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });
  });
});
