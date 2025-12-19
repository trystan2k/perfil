import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Player } from '@/types/models';
import { customRender } from '../../../__mocks__/test-utils.tsx';
import { GamePlayPlayerScoreboard } from '../GamePlayPlayerScoreboard.tsx';

describe('GamePlayPlayerScoreboard', () => {
  const mockPlayers: Player[] = [
    { id: 'player-1', name: 'Alice', score: 100 },
    { id: 'player-2', name: 'Bob', score: 50 },
    { id: 'player-3', name: 'Charlie', score: 0 },
  ];

  const defaultProps = {
    players: mockPlayers,
    canAwardPoints: true,
    playersAwardPointsTitle: 'Award Points',
    getPointsText: (score: number) => `${score} pts`,
    showClueToAwardPointsText: 'Show at least one clue to award points',
    awardPointsButtonAriaLabel: (playerName: string) => `Award points to ${playerName}`,
    removePointsButtonAriaLabel: (playerName: string) => `Remove points from ${playerName}`,
    removePointsButtonTitle: 'Remove points from this player',
    onAwardPoints: vi.fn(),
    onOpenRemovePoints: vi.fn(),
  };

  it('should render the title', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} />);

    expect(screen.getByText('Award Points')).toBeInTheDocument();
  });

  it('should render all players', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should display player scores using getPointsText', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} />);

    expect(screen.getByText('100 pts')).toBeInTheDocument();
    expect(screen.getByText('50 pts')).toBeInTheDocument();
    expect(screen.getByText('0 pts')).toBeInTheDocument();
  });

  it('should call onAwardPoints when award button is clicked', async () => {
    const user = userEvent.setup();
    const onAwardPoints = vi.fn();

    customRender(<GamePlayPlayerScoreboard {...defaultProps} onAwardPoints={onAwardPoints} />);

    await user.click(screen.getByTestId('award-points-player-1'));

    expect(onAwardPoints).toHaveBeenCalledWith('player-1');
  });

  it('should enable award points buttons when canAwardPoints is true', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={true} />);

    const buttons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('data-testid')?.startsWith('award-points'));
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should disable award points buttons when canAwardPoints is false', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={false} />);

    const buttons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('data-testid')?.startsWith('award-points'));
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should show clue message when canAwardPoints is false', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={false} />);

    expect(screen.getByText('Show at least one clue to award points')).toBeInTheDocument();
  });

  it('should not show clue message when canAwardPoints is true', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={true} />);

    expect(screen.queryByText('Show at least one clue to award points')).not.toBeInTheDocument();
  });

  it('should disable remove points button when player score is 0', async () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} />);

    // Charlie has score 0
    const removeButtons = screen.getAllByLabelText(/Remove points from/);
    const charlieRemoveButton = removeButtons[2]; // Charlie is the 3rd player

    expect(charlieRemoveButton).toBeDisabled();
  });

  it('should enable remove points button when player score is greater than 0', () => {
    customRender(<GamePlayPlayerScoreboard {...defaultProps} />);

    const removeButtons = screen.getAllByLabelText(/Remove points from/);
    const aliceRemoveButton = removeButtons[0]; // Alice is the 1st player with score 100

    expect(aliceRemoveButton).not.toBeDisabled();
  });

  it('should call onOpenRemovePoints when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenRemovePoints = vi.fn();

    customRender(
      <GamePlayPlayerScoreboard {...defaultProps} onOpenRemovePoints={onOpenRemovePoints} />
    );

    const removeButtons = screen.getAllByLabelText(/Remove points from/);
    await user.click(removeButtons[0]); // Click Alice's remove button

    expect(onOpenRemovePoints).toHaveBeenCalledWith(mockPlayers[0]);
  });

  it('should use localized aria-labels', () => {
    const awardPointsButtonAriaLabel = vi.fn(
      (playerName: string) => `Atribuir pontos a ${playerName}`
    );
    const removePointsButtonAriaLabel = vi.fn(
      (playerName: string) => `Remover pontos de ${playerName}`
    );

    customRender(
      <GamePlayPlayerScoreboard
        {...defaultProps}
        awardPointsButtonAriaLabel={awardPointsButtonAriaLabel}
        removePointsButtonAriaLabel={removePointsButtonAriaLabel}
      />
    );

    // Check that the functions were called with correct player names
    expect(awardPointsButtonAriaLabel).toHaveBeenCalledWith('Alice');
    expect(awardPointsButtonAriaLabel).toHaveBeenCalledWith('Bob');
    expect(awardPointsButtonAriaLabel).toHaveBeenCalledWith('Charlie');

    expect(removePointsButtonAriaLabel).toHaveBeenCalledWith('Alice');
    expect(removePointsButtonAriaLabel).toHaveBeenCalledWith('Bob');
    expect(removePointsButtonAriaLabel).toHaveBeenCalledWith('Charlie');
  });

  it('should have proper aria-labels on remove buttons', () => {
    const { rerender } = customRender(<GamePlayPlayerScoreboard {...defaultProps} />);

    const removeButtons = screen.getAllByLabelText(/Remove points from/);
    expect(removeButtons).toHaveLength(3);
    expect(removeButtons[0]).toHaveAttribute('aria-label', 'Remove points from Alice');

    rerender(
      <GamePlayPlayerScoreboard
        {...defaultProps}
        removePointsButtonAriaLabel={(name) => `Eliminar puntos de ${name}`}
      />
    );

    const updatedRemoveButtons = screen.getAllByLabelText(/Eliminar puntos de/);
    expect(updatedRemoveButtons).toHaveLength(3);
  });

  it('should render empty players list gracefully', () => {
    const { container } = customRender(<GamePlayPlayerScoreboard {...defaultProps} players={[]} />);

    expect(screen.getByText('Award Points')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid^="award-points-"]')).toHaveLength(0);
  });
});
