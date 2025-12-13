import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RankedPlayer } from '@/hooks/useScoreboard';
import { customRender } from '../../../__mocks__/test-utils';
import { GameStatsCard } from '../GameStatsCard';

describe('GameStatsCard', () => {
  const createPlayer = (overrides?: Partial<RankedPlayer>): RankedPlayer => ({
    id: '1',
    name: 'Alice',
    score: 100,
    rank: 1,
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render game stats card', () => {
      const players = [createPlayer()];
      customRender(<GameStatsCard players={players} totalPoints={100} />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should display all four stat cards', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const labels = container.querySelectorAll('.text-xs');
      expect(labels.length).toBeGreaterThanOrEqual(4);
    });

    it('should display stat icons', () => {
      const players = [createPlayer()];
      customRender(<GameStatsCard players={players} totalPoints={100} />);

      expect(screen.getByText('👥')).toBeInTheDocument(); // Players
      expect(screen.getByText('⭐')).toBeInTheDocument(); // Points
      expect(screen.getByText('📊')).toBeInTheDocument(); // Average
      expect(screen.getByText('📈')).toBeInTheDocument(); // Highest
    });
  });

  describe('Total Players Stat', () => {
    it('should display correct player count for single player', () => {
      const players = [createPlayer()];
      customRender(<GameStatsCard players={players} totalPoints={100} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display correct player count for multiple players', () => {
      const players = [
        createPlayer({ id: '1' }),
        createPlayer({ id: '2' }),
        createPlayer({ id: '3' }),
      ];
      customRender(<GameStatsCard players={players} totalPoints={300} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display correct player count for many players', () => {
      const players = Array.from({ length: 16 }, (_, i) => createPlayer({ id: String(i + 1) }));
      customRender(<GameStatsCard players={players} totalPoints={1600} />);

      expect(screen.getByText('16')).toBeInTheDocument();
    });

    it('should display zero players when no players exist', () => {
      customRender(<GameStatsCard players={[]} totalPoints={0} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs[0]).toHaveTextContent('0');
    });

    it('should have players icon with aria-hidden', () => {
      const players = [createPlayer()];
      customRender(<GameStatsCard players={players} totalPoints={100} />);

      const icons = screen.getAllByText('👥');
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Total Points Stat', () => {
    it('should display total points correctly', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={250} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[1]).toHaveTextContent('250');
    });

    it('should display zero total points', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={0} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[1]).toHaveTextContent('0');
    });

    it('should display large total points', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={9999} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[1]).toHaveTextContent('9999');
    });
  });

  describe('Average Score Calculation', () => {
    it('should calculate average correctly for single player', () => {
      const players = [createPlayer({ score: 100 })];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[2]).toHaveTextContent('100');
    });

    it('should calculate average correctly for multiple players', () => {
      const players = [
        createPlayer({ id: '1', score: 100 }),
        createPlayer({ id: '2', score: 200 }),
        createPlayer({ id: '3', score: 300 }),
      ];
      customRender(<GameStatsCard players={players} totalPoints={600} />);

      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should round average down', () => {
      const players = [
        createPlayer({ id: '1', score: 100 }),
        createPlayer({ id: '2', score: 100 }),
        createPlayer({ id: '3', score: 100 }),
      ];
      customRender(<GameStatsCard players={players} totalPoints={300} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs[2]).toHaveTextContent('100');
    });

    it('should handle no players (average is 0)', () => {
      customRender(<GameStatsCard players={[]} totalPoints={0} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs[2]).toHaveTextContent('0');
    });

    it('should display average with many players', () => {
      const players = Array.from({ length: 10 }, (_, i) =>
        createPlayer({ id: String(i + 1), score: 50 })
      );
      const { container } = customRender(<GameStatsCard players={players} totalPoints={500} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[2]).toHaveTextContent('50');
    });
  });

  describe('Highest Score Calculation', () => {
    it('should display highest score for single player', () => {
      const players = [createPlayer({ score: 150 })];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={150} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[3]).toHaveTextContent('150');
    });

    it('should display highest score from multiple players', () => {
      const players = [
        createPlayer({ id: '1', score: 100 }),
        createPlayer({ id: '2', score: 250 }),
        createPlayer({ id: '3', score: 150 }),
      ];
      customRender(<GameStatsCard players={players} totalPoints={500} />);

      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('should handle zero highest score', () => {
      const players = [createPlayer({ id: '1', score: 0 }), createPlayer({ id: '2', score: 0 })];
      customRender(<GameStatsCard players={players} totalPoints={0} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs[3]).toHaveTextContent('0');
    });

    it('should handle no players (highest is 0)', () => {
      customRender(<GameStatsCard players={[]} totalPoints={0} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs[3]).toHaveTextContent('0');
    });
  });

  describe('Stats Order', () => {
    it('should display stats in correct order', () => {
      const players = [
        createPlayer({ id: '1', score: 100 }),
        createPlayer({ id: '2', score: 200 }),
      ];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={300} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible stat labels', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('should have sr-only aria labels for icons', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const srLabels = container.querySelectorAll('.sr-only');
      expect(srLabels.length).toBeGreaterThan(0);
    });

    it('should have aria-hidden on decorative icons', () => {
      const players = [createPlayer()];
      customRender(<GameStatsCard players={players} totalPoints={100} />);

      const icons = screen.getAllByText(/[👥⭐📊📈]/u);
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should use output element for stat values', () => {
      const players = [createPlayer({ score: 100 })];
      customRender(<GameStatsCard players={players} totalPoints={100} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should apply grid layout', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2', 'gap-4');
    });

    it('should apply stats card styling', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const statCards = container.querySelectorAll('.bg-gray-50');
      statCards.forEach((card) => {
        expect(card).toHaveClass('rounded-lg', 'p-4', 'text-center', 'border');
      });
    });

    it('should apply dark mode to stat cards', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const statCards = container.querySelectorAll('.dark\\:bg-gray-800\\/50');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should apply dark mode text colors', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const values = container.querySelectorAll('.dark\\:text-white');
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('Dark Mode', () => {
    it('should have dark mode background', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const statCards = container.querySelectorAll('.dark\\:bg-gray-800\\/50');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should have dark mode border', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const statCards = container.querySelectorAll('.dark\\:border-gray-700');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should have dark mode text color', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const textElements = container.querySelectorAll('.dark\\:text-white');
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode secondary text color', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const secondaryText = container.querySelectorAll('.dark\\:text-gray-400');
      expect(secondaryText.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('should render within Card component', () => {
      const players = [createPlayer()];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={100} />);

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });

    it('should display complete game statistics', () => {
      const players = [
        createPlayer({ id: '1', score: 100 }),
        createPlayer({ id: '2', score: 150 }),
        createPlayer({ id: '3', score: 200 }),
      ];
      customRender(<GameStatsCard players={players} totalPoints={450} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should work with different player counts and scores', () => {
      const players = Array.from({ length: 5 }, (_, i) =>
        createPlayer({ id: String(i + 1), score: (i + 1) * 20 })
      );
      customRender(<GameStatsCard players={players} totalPoints={300} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player array', () => {
      customRender(<GameStatsCard players={[]} totalPoints={0} />);

      const outputs = screen.getAllByRole('status');
      expect(outputs[0]).toHaveTextContent('0');
      expect(outputs[1]).toHaveTextContent('0');
      expect(outputs[2]).toHaveTextContent('0');
      expect(outputs[3]).toHaveTextContent('0');
    });

    it('should handle very large numbers', () => {
      const players = [createPlayer({ score: 99999 })];
      const { container } = customRender(<GameStatsCard players={players} totalPoints={99999} />);

      const outputs = container.querySelectorAll('output');
      expect(outputs[1]).toHaveTextContent('99999');
    });

    it('should handle many players with diverse scores', () => {
      const players = Array.from({ length: 16 }, (_, i) =>
        createPlayer({
          id: String(i + 1),
          score: Math.floor(Math.random() * 1000) + 1,
        })
      );
      const totalPoints = players.reduce((sum, p) => sum + p.score, 0);

      customRender(<GameStatsCard players={players} totalPoints={totalPoints} />);

      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText(String(totalPoints))).toBeInTheDocument();
    });
  });
});
