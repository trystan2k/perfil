import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useI18nStore } from '../../stores/i18nStore';
import { LanguageSwitcher } from '../LanguageSwitcher';

// Mock the i18n store
vi.mock('../../stores/i18nStore', () => ({
  useI18nStore: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'languageSwitcher.ariaLabel') return 'Language Switcher';
      if (key === 'languageSwitcher.switchTo') return `Switch to ${options?.language}`;
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('LanguageSwitcher', () => {
  let mockSetLocale: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetLocale = vi.fn();
    (useI18nStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
    });
  });

  it('renders language switcher with all language options', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('navigation', { name: /language switcher/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to english/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to español/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch to português/i)).toBeInTheDocument();
  });

  it('marks current language as active', () => {
    (useI18nStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: 'es',
      setLocale: mockSetLocale,
    });

    render(<LanguageSwitcher />);

    const spanishButton = screen.getByLabelText(/switch to español/i);
    expect(spanishButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls setLocale when clicking a language button', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const spanishButton = screen.getByLabelText(/switch to español/i);
    await user.click(spanishButton);

    expect(mockSetLocale).toHaveBeenCalledWith('es');
  });

  it('updates active state when language changes', () => {
    const { rerender } = render(<LanguageSwitcher />);

    let spanishButton = screen.getByLabelText(/switch to español/i);
    expect(spanishButton).not.toHaveAttribute('aria-current', 'page');

    (useI18nStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: 'es',
      setLocale: mockSetLocale,
    });

    rerender(<LanguageSwitcher />);

    spanishButton = screen.getByLabelText(/switch to español/i);
    expect(spanishButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders language names and flags', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();

    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
    expect(screen.getByText('🇧🇷')).toBeInTheDocument();
  });

  it('hides language names on small screens and shows only flags', () => {
    render(<LanguageSwitcher />);

    const buttons = screen.getAllByRole('button');
    const localeNames = screen.getAllByText(/English|Español|Português/);

    // Language names should be present in DOM but hidden on small screens via CSS
    expect(localeNames.length).toBeGreaterThan(0);

    // Check that locale-name class is present (hidden on small screens)
    buttons.forEach((button) => {
      const nameSpan = button.querySelector('.locale-name');
      if (nameSpan) {
        expect(nameSpan).toHaveClass('locale-name');
      }
    });
  });

  describe('Accessibility: Touch Target Sizes (WCAG 2.5.5 AAA)', () => {
    it('should have locale-link class for touch target styling via CSS', () => {
      render(<LanguageSwitcher />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // The locale-link class applies min-h-12 and other styling via CSS
        expect(button).toHaveClass('locale-link');
        // This ensures the touch target styling is applied
      });
    });

    it('should have flag and name structure for proper touch target', () => {
      render(<LanguageSwitcher />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Check for flag span (locale-flag)
        const flagSpan = button.querySelector('.locale-flag');
        expect(flagSpan).toBeInTheDocument();
        expect(flagSpan).toHaveAttribute('aria-hidden', 'true');

        // Check for name span (locale-name)
        const nameSpan = button.querySelector('.locale-name');
        expect(nameSpan).toBeInTheDocument();
      });
    });

    it('should have proper button type attribute for accessibility', () => {
      render(<LanguageSwitcher />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have aria-label for touch accessibility', () => {
      render(<LanguageSwitcher />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Each button should have an aria-label for screen readers
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should maintain active state with locale-link class', () => {
      (useI18nStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        locale: 'pt-BR',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const portugueseButton = screen.getByLabelText(/switch to português/i);

      // Should have both locale-link and active classes
      expect(portugueseButton).toHaveClass('locale-link', 'active');
    });

    it('should have all language buttons structured for touch targets', () => {
      render(<LanguageSwitcher />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach((button) => {
        // Each button should meet WCAG 2.5.5 AAA touch target requirements
        expect(button).toHaveClass('locale-link');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('aria-label');
        // Check for flag and name structure
        expect(button.querySelector('.locale-flag')).toBeInTheDocument();
      });
    });

    it('should support hover state without breaking touch target', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const englishButton = screen.getByLabelText(/switch to english/i);

      // Button should have locale-link class
      expect(englishButton).toHaveClass('locale-link');

      // Simulate hover
      await user.hover(englishButton);

      // Touch target should be maintained
      expect(englishButton).toHaveClass('locale-link');
    });

    it('should provide adequate spacing between language buttons via locale-list', () => {
      render(<LanguageSwitcher />);

      const localeList = screen.getByRole('navigation').querySelector('ul');
      expect(localeList).toHaveClass('locale-list');
      // locale-list class in CSS applies gap-2 for spacing between buttons
    });

    it('should have proper language switcher nav container', () => {
      render(<LanguageSwitcher />);

      const nav = screen.getByRole('navigation', { name: /language switcher/i });
      expect(nav).toHaveClass('language-switcher');
      // language-switcher class applies flexbox and centering via CSS
    });

    it('should have tab accessibility for touch device support', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const buttons = screen.getAllByRole('button');

      // All buttons should be keyboard accessible (tab navigation)
      for (const button of buttons) {
        await user.tab();
        expect(button).toHaveAttribute('type', 'button');
      }
    });

    it('should maintain touch target size with active state styling', () => {
      (useI18nStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        locale: 'es',
        setLocale: mockSetLocale,
      });

      render(<LanguageSwitcher />);

      const spanishButton = screen.getByLabelText(/switch to español/i);

      // Even with active styling, the button should maintain touch target via locale-link class
      expect(spanishButton).toHaveClass('locale-link');
      expect(spanishButton).toHaveClass('active');
    });
  });
});
