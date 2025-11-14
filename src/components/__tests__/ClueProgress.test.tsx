import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClueProgress } from '../ClueProgress';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'gamePlay.clueProgress.pointsRemaining') {
        return `${params?.points} points remaining`;
      }
      if (key === 'gamePlay.clueProgress.ariaLabel') {
        return `Clue progress: ${params?.revealed} of ${params?.total} clues revealed`;
      }
      return key;
    },
  }),
}));

describe('ClueProgress', () => {
  it('should render points remaining correctly', () => {
    render(<ClueProgress cluesRevealed={3} totalClues={20} pointsRemaining={18} />);

    expect(screen.getByText('18 points remaining')).toBeInTheDocument();
  });

  it('should render correct number of clue dots', () => {
    const { container } = render(
      <ClueProgress cluesRevealed={5} totalClues={20} pointsRemaining={16} />
    );

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(20);
  });

  it('should highlight revealed clues correctly', () => {
    const { container } = render(
      <ClueProgress cluesRevealed={5} totalClues={20} pointsRemaining={16} />
    );

    const dots = container.querySelectorAll('[aria-hidden="true"]');

    // First 5 dots should be highlighted (bg-primary)
    for (let i = 0; i < 5; i++) {
      expect(dots[i]).toHaveClass('bg-primary');
      expect(dots[i]).not.toHaveClass('bg-muted');
    }

    // Remaining 15 dots should be muted
    for (let i = 5; i < 20; i++) {
      expect(dots[i]).toHaveClass('bg-muted');
      expect(dots[i]).not.toHaveClass('bg-primary');
    }
  });

  it('should render progressbar with correct aria attributes', () => {
    render(<ClueProgress cluesRevealed={10} totalClues={20} pointsRemaining={11} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Clue progress: 10 of 20 clues revealed');
    expect(progressBar).toHaveAttribute('aria-valuenow', '10');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '20');
  });

  it('should handle no clues revealed', () => {
    const { container } = render(
      <ClueProgress cluesRevealed={0} totalClues={20} pointsRemaining={20} />
    );

    expect(screen.getByText('20 points remaining')).toBeInTheDocument();

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(20);

    // All dots should be muted
    for (let i = 0; i < 20; i++) {
      expect(dots[i]).toHaveClass('bg-muted');
      expect(dots[i]).not.toHaveClass('bg-primary');
    }
  });

  it('should handle all clues revealed', () => {
    const { container } = render(
      <ClueProgress cluesRevealed={20} totalClues={20} pointsRemaining={1} />
    );

    expect(screen.getByText('1 points remaining')).toBeInTheDocument();

    const dots = container.querySelectorAll('[aria-hidden="true"]');

    // All dots should be highlighted
    for (let i = 0; i < 20; i++) {
      expect(dots[i]).toHaveClass('bg-primary');
      expect(dots[i]).not.toHaveClass('bg-muted');
    }
  });

  it('should handle first clue revealed', () => {
    const { container } = render(
      <ClueProgress cluesRevealed={1} totalClues={20} pointsRemaining={20} />
    );

    expect(screen.getByText('20 points remaining')).toBeInTheDocument();

    const dots = container.querySelectorAll('[aria-hidden="true"]');

    // First dot should be highlighted
    expect(dots[0]).toHaveClass('bg-primary');

    // Remaining dots should be muted
    for (let i = 1; i < 20; i++) {
      expect(dots[i]).toHaveClass('bg-muted');
    }
  });

  it('should update when clues are revealed dynamically', () => {
    const { container, rerender } = render(
      <ClueProgress cluesRevealed={5} totalClues={20} pointsRemaining={16} />
    );

    let dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots[4]).toHaveClass('bg-primary');
    expect(dots[5]).toHaveClass('bg-muted');

    rerender(<ClueProgress cluesRevealed={10} totalClues={20} pointsRemaining={11} />);

    dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots[9]).toHaveClass('bg-primary');
    expect(dots[10]).toHaveClass('bg-muted');
  });
});
