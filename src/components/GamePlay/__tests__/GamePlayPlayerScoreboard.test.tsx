import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Player } from '@/types/models';
import { GamePlayPlayerScoreboard } from '../GamePlayPlayerScoreboard';

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
    render(<GamePlayPlayerScoreboard {...defaultProps} />);

    expect(screen.getByText('Award Points')).toBeInTheDocument();
  });

  it('should render all players', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should display player scores using getPointsText', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} />);

    expect(screen.getByText('100 pts')).toBeInTheDocument();
    expect(screen.getByText('50 pts')).toBeInTheDocument();
    expect(screen.getByText('0 pts')).toBeInTheDocument();
  });

  it('should call onAwardPoints when award button is clicked', async () => {
    const user = userEvent.setup();
    const onAwardPoints = vi.fn();

    render(<GamePlayPlayerScoreboard {...defaultProps} onAwardPoints={onAwardPoints} />);

    await user.click(screen.getByTestId('award-points-player-1'));

    expect(onAwardPoints).toHaveBeenCalledWith('player-1');
  });

  it('should enable award points buttons when canAwardPoints is true', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={true} />);

    const buttons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('data-testid')?.startsWith('award-points'));
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should disable award points buttons when canAwardPoints is false', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={false} />);

    const buttons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('data-testid')?.startsWith('award-points'));
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should show clue message when canAwardPoints is false', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={false} />);

    expect(screen.getByText('Show at least one clue to award points')).toBeInTheDocument();
  });

  it('should not show clue message when canAwardPoints is true', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} canAwardPoints={true} />);

    expect(screen.queryByText('Show at least one clue to award points')).not.toBeInTheDocument();
  });

  it('should disable remove points button when player score is 0', async () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} />);

    // Charlie has score 0
    const removeButtons = screen.getAllByLabelText(/Remove points from/);
    const charlieRemoveButton = removeButtons[2]; // Charlie is the 3rd player

    expect(charlieRemoveButton).toBeDisabled();
  });

  it('should enable remove points button when player score is greater than 0', () => {
    render(<GamePlayPlayerScoreboard {...defaultProps} />);

    const removeButtons = screen.getAllByLabelText(/Remove points from/);
    const aliceRemoveButton = removeButtons[0]; // Alice is the 1st player with score 100

    expect(aliceRemoveButton).not.toBeDisabled();
  });

  it('should call onOpenRemovePoints when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenRemovePoints = vi.fn();

    render(<GamePlayPlayerScoreboard {...defaultProps} onOpenRemovePoints={onOpenRemovePoints} />);

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

    render(
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
    const { rerender } = render(<GamePlayPlayerScoreboard {...defaultProps} />);

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
    const { container } = render(<GamePlayPlayerScoreboard {...defaultProps} players={[]} />);

    expect(screen.getByText('Award Points')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid^="award-points-"]')).toHaveLength(0);
  });
});
