import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTranslation } from '@/hooks/useTranslations';

// Test component that uses translations
function TranslationTestComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <p>{t('gameSetup.title')}</p>
      <span>{t('errorHandler.defaultMessage')}</span>
      <button type="button">{t('categorySelect.selectAll')}</button>
      <div>{t('gamePlay.previousClues.title', { count: 5 })}</div>
    </div>
  );
}

describe('Translation Loading from Files', () => {
  it('should load translations from public/locales/en/translation.json file', () => {
    render(<TranslationTestComponent />);

    // Verify specific translations match the content in public/locales/en/translation.json
    // These assertions prove translations are loaded from the actual JSON file
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Game Setup')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('should handle translation interpolation correctly', () => {
    render(<TranslationTestComponent />);

    // Verify interpolation works with loaded translations
    expect(screen.getByText('Previous Clues (5)')).toBeInTheDocument();
  });

  it('should load nested translation keys correctly', () => {
    const { t } = useTranslation();

    // Test various nested keys to ensure proper flattening
    expect(t('common.loading')).toBe('Loading...');
    expect(t('common.error')).toBe('Error');
    expect(t('gameSetup.title')).toBe('Game Setup');
    expect(t('gamePlay.loading.title')).toBe('Loading Game');
    expect(t('categorySelect.loading.description')).toBe('Loading available categories...');
    expect(t('scoreboard.table.rank')).toBe('Rank');
  });

  it('should load recently added translations from JSON file', () => {
    const { t } = useTranslation();

    // These are translations that were NOT in the old hardcoded version
    // This proves we're loading from the actual JSON files
    expect(t('common.returnHome')).toBe('Return to Home');
    expect(t('common.back')).toBe('Back');
    expect(t('common.continue')).toBe('Continue');
    expect(t('errorHandler.title')).toBe('Error');
    expect(t('errorHandler.sessionNotFound')).toBe('Game session not found.');
    expect(t('languageSwitcher.ariaLabel')).toBe('Language selector');
    expect(t('categorySelect.selectAll')).toBe('Select All');
    expect(t('categorySelect.deselectAll')).toBe('Deselect All');
  });

  it('should handle pluralization with loaded translations', () => {
    const { t } = useTranslation();

    // Test plural forms
    expect(t('gamePlay.clueProgress.pointsRemaining', { count: 1 })).toBe('1 point remaining');
    expect(t('gamePlay.clueProgress.pointsRemaining', { count: 5 })).toBe('5 points remaining');
    expect(t('gamePlay.roundSummary.playerScored', { playerName: 'Alice', count: 1 })).toBe(
      'Alice scored 1 point!'
    );
    expect(t('gamePlay.roundSummary.playerScored', { playerName: 'Bob', count: 10 })).toBe(
      'Bob scored 10 points!'
    );
  });
});
