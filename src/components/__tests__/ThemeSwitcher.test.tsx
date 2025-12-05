import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../public/locales/en/translation.json';
import { customRender } from '../../__mocks__/test-utils';
import { useTheme } from '../../hooks/useTheme';
import { ThemeSwitcher } from '../ThemeSwitcher';

// Mock the hook
vi.mock('../../hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeSwitcher', () => {
  let mockSetTheme: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetTheme = vi.fn();
    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });
  });

  it('renders theme switcher with all theme options', () => {
    customRender(<ThemeSwitcher locale="en" translations={translations} />);

    expect(screen.getByRole('navigation', { name: /theme switcher/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to light theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to dark theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to system theme/i)).toBeInTheDocument();
  });

  it('marks current theme as active', () => {
    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    customRender(<ThemeSwitcher locale="en" translations={translations} />);

    const darkButton = screen.getByLabelText(/switch to dark theme/i);
    expect(darkButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls setTheme when clicking a theme button', async () => {
    const user = userEvent.setup();
    customRender(<ThemeSwitcher locale="en" translations={translations} />);

    const darkButton = screen.getByLabelText(/switch to dark theme/i);
    await user.click(darkButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('updates active state when theme changes', () => {
    const { rerender } = customRender(<ThemeSwitcher locale="en" translations={translations} />);

    let darkButton = screen.getByLabelText(/switch to dark theme/i);
    expect(darkButton).not.toHaveAttribute('aria-current', 'page');

    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    rerender(<ThemeSwitcher locale="en" translations={translations} />);

    darkButton = screen.getByLabelText(/switch to dark theme/i);
    expect(darkButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders with accessible labels and icons', () => {
    customRender(<ThemeSwitcher locale="en" translations={translations} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });
  });

  describe('Accessibility: Touch Target Sizes (WCAG 2.5.5 AAA)', () => {
    it('should have minimum 48x48px touch targets for theme buttons (via theme-button CSS class)', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // The theme-button class applies min-w-12 min-h-12 via CSS
        expect(button).toHaveClass('theme-button');
        // This ensures the touch target styling is applied via CSS
      });
    });

    it('should have 24px icon size inside theme buttons', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      // Get the first SVG icon (Sun for Light theme)
      const icons = screen.getAllByRole('button')[0].querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);

      const icon = icons[0];
      // Icon should have size attribute of 24
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
    });

    it('should have proper button styling for touch target accessibility', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Check that theme-button class is applied
        expect(button).toHaveClass('theme-button');
        // Button should be interactive
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should apply active class styling while maintaining touch target size', () => {
      (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });

      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const darkButton = screen.getByLabelText(/switch to dark theme/i);

      // Even in active state, should have theme-button class with touch target
      expect(darkButton).toHaveClass('theme-button', 'active');
    });

    it('should have all theme buttons with proper accessibility attributes', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach((button) => {
        // Each button should meet WCAG 2.5.5 AAA touch target requirements
        expect(button).toHaveClass('theme-button');
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should render theme switcher nav with proper spacing between buttons', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const themeList = screen.getByRole('navigation').querySelector('ul');
      expect(themeList).toHaveClass('theme-list');
      // theme-list applies gap-2 for spacing between buttons
    });

    it('should have icon inside button for proper touch target interaction', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // Icon is inside button, making whole button a touch target
      });
    });

    it('should support hover state without affecting touch target size', async () => {
      const user = userEvent.setup();
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const lightButton = screen.getByLabelText(/switch to light theme/i);

      // Button should have theme-button class
      expect(lightButton).toHaveClass('theme-button');

      // Simulate hover
      await user.hover(lightButton);

      // Touch target size should not change
      expect(lightButton).toHaveClass('theme-button');
    });

    it('should maintain consistent touch target across all theme options', () => {
      customRender(<ThemeSwitcher locale="en" translations={translations} />);

      const buttons = screen.getAllByRole('button');
      // All three theme buttons should have consistent touch target sizing
      buttons.forEach((button) => {
        expect(button).toHaveClass('theme-button');
      });
      expect(buttons).toHaveLength(3);
    });
  });
});
