import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageSwitcher } from '../LanguageSwitcher';

const defaultProps = {
  currentLocale: 'en' as const,
  currentPath: '/game',
  ariaLabel: 'Language selector',
  switchToLabel: 'Switch to {{language}}',
};

describe('LanguageSwitcher', () => {
  it('renders language switcher with all language options', () => {
    render(<LanguageSwitcher {...defaultProps} />);

    expect(screen.getByRole('navigation', { name: /language selector/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /switch to english/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /switch to español/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /switch to português/i })).toBeInTheDocument();
  });

  it('marks current language as active', () => {
    render(<LanguageSwitcher {...defaultProps} currentLocale="es" />);

    const spanishLink = screen.getByRole('link', { name: /switch to español/i });
    expect(spanishLink).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to correct URL when clicking a language link', () => {
    render(<LanguageSwitcher {...defaultProps} />);

    const spanishLink = screen.getByRole('link', { name: /switch to español/i });
    // For English path /game, Spanish should be /es/game
    expect(spanishLink).toHaveAttribute('href', '/es/game');
  });

  it('generates correct URLs for default locale (English)', () => {
    render(<LanguageSwitcher {...defaultProps} currentPath="/en/game" />);

    const englishLink = screen.getByRole('link', { name: /switch to english/i });
    // English should have /en prefix
    expect(englishLink).toHaveAttribute('href', '/en/game');
  });

  it('renders language names and flags', () => {
    render(<LanguageSwitcher {...defaultProps} />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();

    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
    expect(screen.getByText('🇧🇷')).toBeInTheDocument();
  });

  it('generates correct URLs for Portuguese locale', () => {
    render(<LanguageSwitcher {...defaultProps} currentLocale="pt-BR" currentPath="/pt-BR/game" />);

    const portugueseLink = screen.getByRole('link', { name: /switch to português/i });
    expect(portugueseLink).toHaveAttribute('href', '/pt-BR/game');
  });

  it('handles root path correctly', () => {
    render(<LanguageSwitcher {...defaultProps} currentPath="/" />);

    const spanishLink = screen.getByRole('link', { name: /switch to español/i });
    expect(spanishLink).toHaveAttribute('href', '/es/');
  });

  // TODO: Re-add accessibility tests after refactoring
});
