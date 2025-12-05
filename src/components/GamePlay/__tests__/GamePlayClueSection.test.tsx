import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { customRender } from '../../../__mocks__/test-utils';
import { GamePlayClueSection } from '../GamePlayClueSection';

describe('GamePlayClueSection', () => {
  const defaultProps = {
    isOnFinalClue: false,
    isMaxCluesReached: false,
    currentClueText: 'This is the current clue',
    cluesRead: 2,
    totalClues: 5,
    pointsRemaining: 3,
    revealedClueHistory: ['Previous clue 1', 'Previous clue 2'],
    noWinnerButtonText: 'No Winner',
    showNextClueButtonText: 'Show Next Clue',
    clueCountText: 'Clue 2 of 5',
    pressShowNextClueText: 'Press "Show Next Clue" to begin',
    finishGameButtonText: 'Finish Game',
    onNoWinner: vi.fn(),
    onNextClue: vi.fn(),
    onFinishGame: vi.fn(),
  };

  it('should render show next clue button when not on final clue', () => {
    customRender(<GamePlayClueSection {...defaultProps} isOnFinalClue={false} />);

    expect(screen.getByText('Show Next Clue')).toBeInTheDocument();
    expect(screen.queryByText('No Winner')).not.toBeInTheDocument();
  });

  it('should render no winner button when on final clue', () => {
    customRender(<GamePlayClueSection {...defaultProps} isOnFinalClue={true} />);

    expect(screen.getByText('No Winner')).toBeInTheDocument();
    expect(screen.queryByText('Show Next Clue')).not.toBeInTheDocument();
  });

  it('should disable show next clue button when max clues reached', () => {
    customRender(<GamePlayClueSection {...defaultProps} isMaxCluesReached={true} />);

    const button = screen.getByText('Show Next Clue');
    expect(button).toBeDisabled();
  });

  it('should enable show next clue button when max clues not reached', () => {
    customRender(<GamePlayClueSection {...defaultProps} isMaxCluesReached={false} />);

    const button = screen.getByText('Show Next Clue');
    expect(button).not.toBeDisabled();
  });

  it('should call onNextClue when show next clue button is clicked', async () => {
    const user = userEvent.setup();
    const onNextClue = vi.fn();

    customRender(<GamePlayClueSection {...defaultProps} onNextClue={onNextClue} />);

    await user.click(screen.getByText('Show Next Clue'));

    expect(onNextClue).toHaveBeenCalledTimes(1);
  });

  it('should call onNoWinner when no winner button is clicked', async () => {
    const user = userEvent.setup();
    const onNoWinner = vi.fn();

    customRender(
      <GamePlayClueSection {...defaultProps} isOnFinalClue={true} onNoWinner={onNoWinner} />
    );

    await user.click(screen.getByText('No Winner'));

    expect(onNoWinner).toHaveBeenCalledTimes(1);
  });

  it('should display current clue text when clues have been read', () => {
    customRender(
      <GamePlayClueSection {...defaultProps} cluesRead={2} currentClueText="Test clue" />
    );

    expect(screen.getByText('Test clue')).toBeInTheDocument();
  });

  it('should display clue count text when clues have been read', () => {
    customRender(
      <GamePlayClueSection {...defaultProps} cluesRead={2} clueCountText="Clue 2 of 5" />
    );

    expect(screen.getByText('Clue 2 of 5')).toBeInTheDocument();
  });

  it('should display press show next clue text when no clues read', () => {
    customRender(
      <GamePlayClueSection
        {...defaultProps}
        cluesRead={0}
        currentClueText={null}
        pressShowNextClueText='Press "Show Next Clue" to start'
      />
    );

    expect(screen.getByText('Press "Show Next Clue" to start')).toBeInTheDocument();
    expect(screen.queryByText('Clue 2 of 5')).not.toBeInTheDocument();
  });

  it('should call onFinishGame when finish game button is clicked', async () => {
    const user = userEvent.setup();
    const onFinishGame = vi.fn();

    customRender(<GamePlayClueSection {...defaultProps} onFinishGame={onFinishGame} />);

    await user.click(screen.getByText('Finish Game'));

    expect(onFinishGame).toHaveBeenCalledTimes(1);
  });

  it('should render ClueProgress component', () => {
    customRender(
      <GamePlayClueSection {...defaultProps} cluesRead={3} totalClues={5} pointsRemaining={2} />
    );

    // ClueProgress renders progress information - verify it exists by checking for progress bar
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should render PreviousCluesDisplay with clue history', () => {
    const revealedClueHistory = ['First clue', 'Second clue', 'Third clue'];

    customRender(
      <GamePlayClueSection {...defaultProps} revealedClueHistory={revealedClueHistory} />
    );

    // PreviousCluesDisplay should render the clues (checking for at least one)
    expect(screen.getByText(/First clue/)).toBeInTheDocument();
  });

  it('should handle empty clue history', () => {
    customRender(<GamePlayClueSection {...defaultProps} revealedClueHistory={[]} />);

    // Should still render without errors
    expect(screen.getByText('Show Next Clue')).toBeInTheDocument();
  });

  it('should display all UI sections', () => {
    const { container } = customRender(<GamePlayClueSection {...defaultProps} />);

    // Should have the clue section card
    expect(container.querySelector('.bg-secondary')).toBeInTheDocument();

    // Should have button section
    expect(screen.getByText('Show Next Clue')).toBeInTheDocument();
    expect(screen.getByText('Finish Game')).toBeInTheDocument();
  });

  it('should handle transition from not final to final clue', () => {
    const { rerender } = customRender(
      <GamePlayClueSection {...defaultProps} isOnFinalClue={false} />
    );

    expect(screen.getByText('Show Next Clue')).toBeInTheDocument();

    rerender(<GamePlayClueSection {...defaultProps} isOnFinalClue={true} />);

    expect(screen.getByText('No Winner')).toBeInTheDocument();
    expect(screen.queryByText('Show Next Clue')).not.toBeInTheDocument();
  });

  it('should update clue text when new clue is revealed', () => {
    const { rerender } = customRender(
      <GamePlayClueSection {...defaultProps} currentClueText="Clue 1" clueCountText="Clue 1 of 5" />
    );

    expect(screen.getByText('Clue 1')).toBeInTheDocument();

    rerender(
      <GamePlayClueSection {...defaultProps} currentClueText="Clue 2" clueCountText="Clue 2 of 5" />
    );

    expect(screen.getByText('Clue 2')).toBeInTheDocument();
    expect(screen.queryByText('Clue 1')).not.toBeInTheDocument();
  });
});
