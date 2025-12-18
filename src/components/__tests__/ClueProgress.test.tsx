import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { customRender } from '../../__mocks__/test-utils';
import { GAME_CONFIG } from '../../config/gameConfig';
import { ClueProgress } from '../ClueProgress';

describe('ClueProgress', () => {
  it('should render points remaining correctly', () => {
    customRender(
      <ClueProgress
        cluesRevealed={3}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={18}
      />
    );

    expect(screen.getByText('18 points remaining')).toBeInTheDocument();
  });

  it('should render correct number of clue dots', () => {
    const { container } = customRender(
      <ClueProgress
        cluesRevealed={5}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={16}
      />
    );

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(GAME_CONFIG.game.maxCluesPerProfile);
  });

  it('should highlight revealed clues correctly', () => {
    const { container } = customRender(
      <ClueProgress
        cluesRevealed={5}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={16}
      />
    );

    const dots = container.querySelectorAll('[aria-hidden="true"]');

    // First 5 dots should be highlighted (bg-primary)
    for (let i = 0; i < 5; i++) {
      expect(dots[i]).toHaveClass('bg-primary');
      expect(dots[i]).not.toHaveClass('bg-muted');
    }

    // Remaining 15 dots should be muted
    for (let i = 5; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
      expect(dots[i]).toHaveClass('bg-muted');
      expect(dots[i]).not.toHaveClass('bg-primary');
    }
  });

  it('should render progressbar with correct aria attributes', () => {
    customRender(
      <ClueProgress
        cluesRevealed={10}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={11}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute(
      'aria-label',
      `Clue progress: 10 of ${GAME_CONFIG.game.maxCluesPerProfile} clues revealed`
    );
    expect(progressBar).toHaveAttribute('aria-valuenow', '10');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute(
      'aria-valuemax',
      String(GAME_CONFIG.game.maxCluesPerProfile)
    );
  });

  it('should handle no clues revealed', () => {
    const { container } = customRender(
      <ClueProgress
        cluesRevealed={0}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={20}
      />
    );

    expect(screen.getByText('20 points remaining')).toBeInTheDocument();

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(GAME_CONFIG.game.maxCluesPerProfile);

    // All dots should be muted
    for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
      expect(dots[i]).toHaveClass('bg-muted');
      expect(dots[i]).not.toHaveClass('bg-primary');
    }
  });

  it('should handle all clues revealed', () => {
    const { container } = customRender(
      <ClueProgress
        cluesRevealed={20}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={1}
      />
    );

    expect(screen.getByText('1 point remaining')).toBeInTheDocument();

    const dots = container.querySelectorAll('[aria-hidden="true"]');

    // All dots should be highlighted
    for (let i = 0; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
      expect(dots[i]).toHaveClass('bg-primary');
      expect(dots[i]).not.toHaveClass('bg-muted');
    }
  });

  it('should handle first clue revealed', () => {
    const { container } = customRender(
      <ClueProgress
        cluesRevealed={1}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={20}
      />
    );

    expect(screen.getByText('20 points remaining')).toBeInTheDocument();

    const dots = container.querySelectorAll('[aria-hidden="true"]');

    // First dot should be highlighted
    expect(dots[0]).toHaveClass('bg-primary');

    // Remaining dots should be muted
    for (let i = 1; i < GAME_CONFIG.game.maxCluesPerProfile; i++) {
      expect(dots[i]).toHaveClass('bg-muted');
      expect(dots[i]).not.toHaveClass('bg-primary');
    }
  });

  it('should update when clues are revealed dynamically', () => {
    const { container, rerender } = customRender(
      <ClueProgress
        cluesRevealed={5}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={16}
      />
    );

    let dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots[4]).toHaveClass('bg-primary');
    expect(dots[5]).toHaveClass('bg-muted');

    rerender(
      <ClueProgress
        cluesRevealed={10}
        totalClues={GAME_CONFIG.game.maxCluesPerProfile}
        pointsRemaining={11}
      />
    );

    dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots[9]).toHaveClass('bg-primary');
    expect(dots[10]).toHaveClass('bg-muted');
  });
});
