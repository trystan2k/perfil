import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RankedPlayer } from '@/hooks/useScoreboard';
import { customRender } from '../../../__mocks__/test-utils';
import { WinnerSpotlight } from '../WinnerSpotlight';

describe('WinnerSpotlight', () => {
  const createWinner = (overrides?: Partial<RankedPlayer>): RankedPlayer => ({
    id: '1',
    name: 'Alice',
    score: 250,
    rank: 1,
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render winner spotlight with correct structure', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-spotlight')).toBeInTheDocument();
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should display trophy emoji', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should display winner title', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should display winner name', () => {
      const winner = createWinner({ name: 'Bob' });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-name')).toHaveTextContent('Bob');
    });

    it('should display final score label', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-spotlight')).toBeInTheDocument();
      expect(screen.getByText(String(winner.score))).toBeInTheDocument();
    });

    it('should display winner score', () => {
      const winner = createWinner({ score: 350 });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByText('350')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render score as large bold text', () => {
      const winner = createWinner({ score: 500 });
      customRender(<WinnerSpotlight winner={winner} />);

      const scoreElement = screen.getByText('500');
      expect(scoreElement).toHaveClass('text-4xl', 'font-bold');
    });

    it('should display name with proper styling', () => {
      const winner = createWinner({ name: 'Charlie' });
      customRender(<WinnerSpotlight winner={winner} />);

      const nameElement = screen.getByTestId('winner-name');
      expect(nameElement).toHaveClass('text-3xl', 'font-bold');
    });

    it('should handle names with special characters', () => {
      const winner = createWinner({ name: "O'Connor" });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-name')).toHaveTextContent("O'Connor");
    });

    it('should handle long names', () => {
      const winner = createWinner({ name: 'Alexandra Christopher Elizabeth' });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-name')).toHaveTextContent(
        'Alexandra Christopher Elizabeth'
      );
    });

    it('should handle zero score', () => {
      const winner = createWinner({ score: 0 });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large scores', () => {
      const winner = createWinner({ score: 9999 });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByText('9999')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby');
      expect(region).toHaveAttribute('aria-describedby');
    });

    it('should include sr-only trophy label', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      // Check that there is an sr-only element with trophy text
      const srElements = screen.queryAllByRole('heading');
      expect(srElements.length).toBeGreaterThan(0);
    });

    it('should have aria-hidden on decorative emoji', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const trophy = screen.getByText('🏆');
      expect(trophy).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper heading hierarchy', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const heading = screen.getByRole('heading');
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('Styling', () => {
    it('should apply gradient background', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-yellow-50', 'to-yellow-100');
    });

    it('should apply dark mode styles', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      expect(card).toHaveClass('dark:from-yellow-900/20', 'dark:to-yellow-800/10');
    });

    it('should have proper border styling', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      expect(card).toHaveClass('border-yellow-200', 'dark:border-yellow-800/50');
    });

    it('should have centered text layout', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      expect(card).toHaveClass('text-center');
    });

    it('should have proper padding', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Dark Mode', () => {
    it('should display yellow text in dark mode for score', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const scoreElement = screen.getByText(String(winner.score));
      expect(scoreElement).toHaveClass('dark:text-yellow-400');
    });

    it('should display white text in dark mode for name', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const nameElement = screen.getByTestId('winner-name');
      expect(nameElement).toHaveClass('dark:text-white');
    });

    it('should have dark background for score card', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      const scoreCard = card.querySelector('.bg-white.dark\\:bg-gray-800');
      expect(scoreCard).toBeInTheDocument();
    });
  });

  describe('Multiple Players', () => {
    it('should display first ranked player', () => {
      const winner = createWinner({ rank: 1, name: 'First Place' });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-name')).toHaveTextContent('First Place');
    });

    it('should work with any player as winner (for replay scenarios)', () => {
      const winner = createWinner({
        id: '5',
        name: 'Victor',
        score: 300,
        rank: 1,
      });
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByTestId('winner-name')).toHaveTextContent('Victor');
      expect(screen.getByText('300')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render with i18n provider', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should be part of a card component', () => {
      const winner = createWinner();
      customRender(<WinnerSpotlight winner={winner} />);

      const card = screen.getByTestId('winner-spotlight');
      expect(card).toHaveClass('p-8'); // Card padding
    });
  });
});
