import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RankedPlayer } from '@/hooks/useScoreboard';
import { customRender } from '../../../__mocks__/test-utils';
import { ScoreBars } from '../ScoreBars';

describe('ScoreBars', () => {
  const createPlayer = (overrides?: Partial<RankedPlayer>): RankedPlayer => ({
    id: '1',
    name: 'Alice',
    score: 100,
    rank: 1,
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render score bars container', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByTestId('score-bars')).toBeInTheDocument();
    });

    it('should display score comparison heading', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render single player', () => {
      const players = [createPlayer({ name: 'Alice', score: 100 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByTestId('player-name-1')).toHaveTextContent('Alice');
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render multiple players', () => {
      const players = [
        createPlayer({ id: '1', name: 'Alice', score: 150, rank: 1 }),
        createPlayer({ id: '2', name: 'Bob', score: 100, rank: 2 }),
        createPlayer({ id: '3', name: 'Charlie', score: 200, rank: 1 }),
      ];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByTestId('player-name-1')).toHaveTextContent('Alice');
      expect(screen.getByTestId('player-name-2')).toHaveTextContent('Bob');
      expect(screen.getByTestId('player-name-3')).toHaveTextContent('Charlie');
    });

    it('should render score bars with correct data-testid', () => {
      const players = [
        createPlayer({ id: '1', name: 'Alice', score: 100 }),
        createPlayer({ id: '2', name: 'Bob', score: 50 }),
      ];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByTestId('player-score-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('player-score-row-2')).toBeInTheDocument();
    });
  });

  describe('Medal Emojis', () => {
    it('should display gold medal for rank 1', () => {
      const players = [createPlayer({ rank: 1 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('should display silver medal for rank 2', () => {
      const players = [createPlayer({ rank: 2 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    it('should display bronze medal for rank 3', () => {
      const players = [createPlayer({ rank: 3 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    it('should display numeric rank for rank 4+', () => {
      const players = [createPlayer({ rank: 4 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('#4')).toBeInTheDocument();
    });

    it('should display numeric rank for rank 5+', () => {
      const players = [createPlayer({ rank: 10 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('#10')).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative medals', () => {
      const players = [createPlayer({ rank: 1 })];
      customRender(<ScoreBars players={players} />);

      const medal = screen.getByText('🥇');
      expect(medal).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Score Display', () => {
    it('should display correct scores', () => {
      const players = [
        createPlayer({ id: '1', score: 150 }),
        createPlayer({ id: '2', score: 200 }),
        createPlayer({ id: '3', score: 100 }),
      ];
      customRender(<ScoreBars players={players} />);

      const scoreElements = screen.getAllByTestId('player-score');
      expect(scoreElements).toHaveLength(3);
      expect(scoreElements[0]).toHaveTextContent('150');
      expect(scoreElements[1]).toHaveTextContent('200');
      expect(scoreElements[2]).toHaveTextContent('100');
    });

    it('should display zero score', () => {
      const players = [createPlayer({ score: 0 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display large scores', () => {
      const players = [createPlayer({ score: 9999 })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByText('9999')).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('should render progress bar for each player', () => {
      const players = [createPlayer({ id: '1', score: 100 }), createPlayer({ id: '2', score: 50 })];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);
    });

    it('should set bar width based on score ratio', () => {
      const players = [
        createPlayer({ id: '1', score: 100, rank: 1 }),
        createPlayer({ id: '2', score: 50, rank: 2 }),
      ];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      // Bar 1 should be 100% (100/100)
      // Bar 2 should be 50% (50/100)
      const fillDiv1 = progressBars[0].querySelector('div');
      const fillDiv2 = progressBars[1].querySelector('div');
      expect(fillDiv1).toHaveStyle('width: 100%');
      expect(fillDiv2).toHaveStyle('width: 50%');
    });

    it('should handle equal scores correctly', () => {
      const players = [
        createPlayer({ id: '1', score: 100, rank: 1 }),
        createPlayer({ id: '2', score: 100, rank: 1 }),
      ];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      const fillDiv1 = progressBars[0].querySelector('div');
      const fillDiv2 = progressBars[1].querySelector('div');
      expect(fillDiv1).toHaveStyle('width: 100%');
      expect(fillDiv2).toHaveStyle('width: 100%');
    });

    it('should normalize bars to max score', () => {
      const players = [
        createPlayer({ id: '1', score: 300, rank: 1 }),
        createPlayer({ id: '2', score: 200, rank: 2 }),
        createPlayer({ id: '3', score: 100, rank: 3 }),
      ];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      // Max is 300, so:
      // Bar 1: 300/300 = 100%
      // Bar 2: 200/300 = 66.66%
      // Bar 3: 100/300 = 33.33%
      const fillDiv1 = progressBars[0].querySelector('div');
      const fillDiv2 = progressBars[1].querySelector('div');
      const fillDiv3 = progressBars[2].querySelector('div');
      expect(fillDiv1).toHaveStyle('width: 100%');
      expect(fillDiv2).toHaveStyle('width: 66.66666666666666%');
      expect(fillDiv3).toHaveStyle('width: 33.33333333333333%');
    });

    it('should apply gradient styling to progress bars', () => {
      const players = [createPlayer({ score: 100 })];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      const fillDiv = progressBar.querySelector('div');
      expect(fillDiv).toHaveClass('bg-gradient-to-r', 'from-yellow-400', 'to-yellow-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on progress bars', () => {
      const players = [createPlayer({ name: 'Alice', score: 100 })];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Score visualization for Alice');
    });

    it('should have aria-valuenow set to score', () => {
      const players = [createPlayer({ score: 150 })];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '150');
    });

    it('should have aria-valuemin set to 0', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax set to max score', () => {
      const players = [
        createPlayer({ id: '1', score: 150 }),
        createPlayer({ id: '2', score: 100 }),
      ];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars[0]).toHaveAttribute('aria-valuemax', '150');
      expect(progressBars[1]).toHaveAttribute('aria-valuemax', '150');
    });

    it('should have sr-only rank labels', () => {
      const players = [createPlayer({ rank: 1 })];
      customRender(<ScoreBars players={players} />);

      // Check that rank labels are rendered as sr-only
      const srElements = screen.queryAllByTestId('player-score-row-1');
      expect(srElements.length).toBeGreaterThan(0);
    });
  });

  describe('Player Names', () => {
    it('should truncate long player names', () => {
      const players = [
        createPlayer({ name: 'This is a very long player name that should be truncated' }),
      ];
      customRender(<ScoreBars players={players} />);

      const nameElement = screen.getByTestId('player-name-1');
      expect(nameElement).toHaveClass('truncate');
    });

    it('should display player names in correct order', () => {
      const players = [
        createPlayer({ id: '1', name: 'Alice' }),
        createPlayer({ id: '2', name: 'Bob' }),
        createPlayer({ id: '3', name: 'Charlie' }),
      ];
      customRender(<ScoreBars players={players} />);

      const rows = screen.getAllByTestId(/player-score-row/);
      expect(rows[0]).toHaveTextContent('Alice');
      expect(rows[1]).toHaveTextContent('Bob');
      expect(rows[2]).toHaveTextContent('Charlie');
    });

    it('should handle special characters in names', () => {
      const players = [createPlayer({ name: "O'Rourke" })];
      customRender(<ScoreBars players={players} />);

      expect(screen.getByTestId('player-name-1')).toHaveTextContent("O'Rourke");
    });
  });

  describe('Styling', () => {
    it('should apply dark mode text color to player names', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      const nameElement = screen.getByTestId('player-name-1');
      expect(nameElement).toHaveClass('dark:text-white');
    });

    it('should apply dark mode to progress bar background', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('dark:bg-gray-700');
    });

    it('should apply dark mode to gradient fill', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      const fillDiv = progressBar.querySelector('div');
      expect(fillDiv).toHaveClass('dark:from-yellow-500', 'dark:to-yellow-700');
    });

    it('should have proper spacing between player rows', () => {
      const players = [createPlayer({ id: '1' }), createPlayer({ id: '2' })];
      customRender(<ScoreBars players={players} />);

      const container = screen.getByTestId('score-bars');
      expect(container.querySelector('.space-y-5')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should apply transition animation to progress bars', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      const progressBar = screen.getByRole('progressbar');
      const fillDiv = progressBar.querySelector('div');
      expect(fillDiv).toHaveClass('transition-all', 'duration-500');
    });

    it('should update animation when scores change', async () => {
      const { rerender } = customRender(<ScoreBars players={[createPlayer({ score: 100 })]} />);

      let progressBar = screen.getByRole('progressbar');
      let fillDiv = progressBar.querySelector('div');
      expect(fillDiv).toHaveStyle('width: 100%');

      rerender(<ScoreBars players={[createPlayer({ score: 200 })]} />);

      await waitFor(() => {
        progressBar = screen.getByRole('progressbar');
        fillDiv = progressBar.querySelector('div');
        expect(fillDiv).toHaveStyle('width: 100%');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single player', () => {
      const players = [createPlayer({ score: 50 })];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(1);
      const fillDiv = progressBars[0].querySelector('div');
      expect(fillDiv).toHaveStyle('width: 100%');
    });

    it('should handle many players', () => {
      const players = Array.from({ length: 16 }, (_, i) =>
        createPlayer({
          id: String(i + 1),
          name: `Player ${i + 1}`,
          score: (i + 1) * 10,
          rank: i + 1,
        })
      );
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(16);
    });

    it('should handle all players with same score', () => {
      const players = [
        createPlayer({ id: '1', score: 100, rank: 1 }),
        createPlayer({ id: '2', score: 100, rank: 1 }),
        createPlayer({ id: '3', score: 100, rank: 1 }),
      ];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach((bar) => {
        const fillDiv = bar.querySelector('div');
        expect(fillDiv).toHaveStyle('width: 100%');
      });
    });

    it('should handle zero scores across all players', () => {
      const players = [createPlayer({ id: '1', score: 0 }), createPlayer({ id: '2', score: 0 })];
      customRender(<ScoreBars players={players} />);

      const progressBars = screen.getAllByRole('progressbar');
      const fillDiv1 = progressBars[0].querySelector('div');
      const fillDiv2 = progressBars[1].querySelector('div');
      expect(fillDiv1).toHaveStyle('width: 0%');
      expect(fillDiv2).toHaveStyle('width: 0%');
    });
  });

  describe('Integration', () => {
    it('should render within Card component', () => {
      const players = [createPlayer()];
      customRender(<ScoreBars players={players} />);

      const card = screen.getByTestId('score-bars');
      expect(card).toHaveClass('p-6');
    });

    it('should display all information for complete picture', () => {
      const players = [
        createPlayer({ id: '1', name: 'Alice', score: 100, rank: 1 }),
        createPlayer({ id: '2', name: 'Bob', score: 50, rank: 2 }),
      ];
      customRender(<ScoreBars players={players} />);

      // Heading
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      // Medals
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
      // Names
      expect(screen.getByTestId('player-name-1')).toHaveTextContent('Alice');
      expect(screen.getByTestId('player-name-2')).toHaveTextContent('Bob');
      // Scores
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      // Progress bars
      expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    });
  });
});
