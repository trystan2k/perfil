import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import { GamePlay } from '../GamePlay';

describe('GamePlay Component', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useGameStore.getState();
    store.createGame(['Alice', 'Bob', 'Charlie']);
  });

  describe('Initial Rendering', () => {
    it('should show "No Active Game" message when status is pending', () => {
      // Store starts in pending state by default
      render(<GamePlay />);

      expect(screen.getByText('No Active Game')).toBeInTheDocument();
      expect(screen.getByText('Please start a game first.')).toBeInTheDocument();
    });

    it('should show "No Active Game" message when status is completed', () => {
      // Start and end the game
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.endGame();

      render(<GamePlay />);

      expect(screen.getByText('No Active Game')).toBeInTheDocument();
      expect(screen.getByText('Please start a game first.')).toBeInTheDocument();
    });

    it('should show "No Active Game" message when currentTurn is null', () => {
      // Manually set status to active but no current turn (shouldn't happen normally)
      useGameStore.setState({
        status: 'active',
        currentTurn: null,
      });

      render(<GamePlay />);

      expect(screen.getByText('No Active Game')).toBeInTheDocument();
    });

    it('should render game play UI when game is active', () => {
      // Start the game
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      expect(screen.getByText('Game Play')).toBeInTheDocument();
      expect(screen.getByText('Category: Movies')).toBeInTheDocument();
      expect(screen.getByText('Current Player')).toBeInTheDocument();
    });

    it('should subscribe to store state correctly', () => {
      // Start the game
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      const state = useGameStore.getState();
      expect(state.status).toBe('active');
      expect(state.currentTurn).not.toBeNull();
      expect(state.players).toHaveLength(3);
      expect(state.category).toBe('Movies');
    });
  });

  describe('Active Player Display', () => {
    it('should display the active player name', () => {
      // Start the game
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      const state = useGameStore.getState();
      const activePlayer = state.players.find((p) => p.id === state.currentTurn?.activePlayerId);

      expect(activePlayer).toBeDefined();
      if (activePlayer) {
        expect(screen.getByText(activePlayer.name)).toBeInTheDocument();
      }
      expect(screen.getByText('Current Player')).toBeInTheDocument();
    });

    it('should display "Unknown Player" when active player is not found', () => {
      // Start the game and manually set an invalid player ID
      const store = useGameStore.getState();
      store.startGame('Movies');

      const currentTurn = useGameStore.getState().currentTurn;
      if (currentTurn) {
        useGameStore.setState({
          currentTurn: {
            ...currentTurn,
            activePlayerId: 'invalid-player-id',
          },
        });
      }

      render(<GamePlay />);

      expect(screen.getByText('Unknown Player')).toBeInTheDocument();
    });

    it('should update displayed player when turn is passed', () => {
      // Start the game
      const store = useGameStore.getState();
      store.startGame('Movies');

      const { rerender } = render(<GamePlay />);

      const initialState = useGameStore.getState();
      const initialPlayer = initialState.players.find(
        (p) => p.id === initialState.currentTurn?.activePlayerId
      );

      expect(initialPlayer).toBeDefined();
      if (initialPlayer) {
        expect(screen.getByText(initialPlayer.name)).toBeInTheDocument();
      }

      // Pass turn
      act(() => {
        store.passTurn();
      });

      rerender(<GamePlay />);

      const newState = useGameStore.getState();
      const newPlayer = newState.players.find((p) => p.id === newState.currentTurn?.activePlayerId);

      expect(newPlayer).toBeDefined();
      if (newPlayer && initialPlayer) {
        expect(newPlayer.id).not.toBe(initialPlayer.id);
        expect(screen.getByText(newPlayer.name)).toBeInTheDocument();
      }
    });
  });

  describe('Clue Display', () => {
    it('should show "Press Show Next Clue" message when no clues have been read', () => {
      // Start the game (cluesRead starts at 0)
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      expect(
        screen.getByText('Press "Show Next Clue" to reveal the first clue')
      ).toBeInTheDocument();
      expect(screen.queryByText(/Clue \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('should display clue number and text after reading first clue', () => {
      // Start the game and show first clue
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      expect(screen.getByText('Clue 1 of 20')).toBeInTheDocument();
      expect(screen.getByText('Clue 1 text...')).toBeInTheDocument();
    });

    it('should update clue number and text when advancing to next clue', () => {
      // Start the game and show first clue
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      const { rerender } = render(<GamePlay />);

      expect(screen.getByText('Clue 1 of 20')).toBeInTheDocument();
      expect(screen.getByText('Clue 1 text...')).toBeInTheDocument();

      // Advance to second clue
      act(() => {
        store.nextClue();
      });

      rerender(<GamePlay />);

      expect(screen.getByText('Clue 2 of 20')).toBeInTheDocument();
      expect(screen.getByText('Clue 2 text...')).toBeInTheDocument();
    });

    it('should display correct clue progress (e.g., 5 of 20)', () => {
      // Start the game and advance to clue 5
      const store = useGameStore.getState();
      store.startGame('Movies');

      // Show 5 clues
      for (let i = 0; i < 5; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      expect(screen.getByText('Clue 5 of 20')).toBeInTheDocument();
      expect(screen.getByText('Clue 5 text...')).toBeInTheDocument();
    });
  });

  describe('Show Next Clue Button', () => {
    it('should render "Show Next Clue" button', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      expect(screen.getByRole('button', { name: 'Show Next Clue' })).toBeInTheDocument();
    });

    it('should call nextClue action when button is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      const button = screen.getByRole('button', { name: 'Show Next Clue' });

      // Initially no clues read
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(0);

      // Click the button
      await user.click(button);

      // Verify cluesRead increased
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(1);
    });

    it('should advance through multiple clues when button clicked multiple times', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      const { rerender } = render(<GamePlay />);

      const button = screen.getByRole('button', { name: 'Show Next Clue' });

      // Click 3 times
      await user.click(button);
      rerender(<GamePlay />);

      await user.click(button);
      rerender(<GamePlay />);

      await user.click(button);
      rerender(<GamePlay />);

      // Should be at clue 3
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(3);
      expect(screen.getByText('Clue 3 of 20')).toBeInTheDocument();
    });

    it('should disable button when max clues reached', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      // Advance to max clues (20)
      for (let i = 0; i < 20; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      const button = screen.getByRole('button', { name: 'Show Next Clue' });
      expect(button).toBeDisabled();
    });

    it('should not advance clues when button is disabled', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      // Advance to max clues (20)
      for (let i = 0; i < 20; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      const button = screen.getByRole('button', { name: 'Show Next Clue' });

      // Try to click disabled button
      await user.click(button);

      // Should still be at 20
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(20);
    });
  });

  describe('Pass Button', () => {
    it('should render "Pass" button', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      expect(screen.getByRole('button', { name: 'Pass' })).toBeInTheDocument();
    });

    it('should call passTurn action when button is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      const initialState = useGameStore.getState();
      const initialPlayerId = initialState.currentTurn?.activePlayerId;

      const button = screen.getByRole('button', { name: 'Pass' });

      // Click the Pass button
      await user.click(button);

      const newState = useGameStore.getState();
      const newPlayerId = newState.currentTurn?.activePlayerId;

      // Verify the active player changed
      expect(newPlayerId).not.toBe(initialPlayerId);
    });

    it('should update displayed player after passing turn', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      const { rerender } = render(<GamePlay />);

      const initialState = useGameStore.getState();
      const initialPlayer = initialState.players.find(
        (p) => p.id === initialState.currentTurn?.activePlayerId
      );

      expect(initialPlayer).toBeDefined();
      if (initialPlayer) {
        expect(screen.getByText(initialPlayer.name)).toBeInTheDocument();
      }

      // Click Pass button
      const button = screen.getByRole('button', { name: 'Pass' });
      await user.click(button);

      rerender(<GamePlay />);

      const newState = useGameStore.getState();
      const newPlayer = newState.players.find((p) => p.id === newState.currentTurn?.activePlayerId);

      expect(newPlayer).toBeDefined();
      if (newPlayer && initialPlayer) {
        expect(newPlayer.id).not.toBe(initialPlayer.id);
        expect(screen.getByText(newPlayer.name)).toBeInTheDocument();
      }
    });

    it('should cycle through all players when passing turn multiple times', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      const { rerender } = render(<GamePlay />);

      const totalPlayers = useGameStore.getState().players.length;
      const button = screen.getByRole('button', { name: 'Pass' });

      const seenPlayerIds: string[] = [];
      const initialPlayerId = useGameStore.getState().currentTurn?.activePlayerId;

      if (initialPlayerId) {
        seenPlayerIds.push(initialPlayerId);
      }

      // Pass turn (totalPlayers - 1) times to cycle through all players
      for (let i = 0; i < totalPlayers - 1; i++) {
        await user.click(button);
        rerender(<GamePlay />);

        const currentPlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        if (currentPlayerId) {
          seenPlayerIds.push(currentPlayerId);
        }
      }

      // Verify we've seen all unique players
      const uniquePlayerIds = new Set(seenPlayerIds);
      expect(uniquePlayerIds.size).toBe(totalPlayers);
    });

    it('should reset to first player after cycling through all players', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      const { rerender } = render(<GamePlay />);

      const initialPlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      const totalPlayers = useGameStore.getState().players.length;
      const button = screen.getByRole('button', { name: 'Pass' });

      // Pass turn totalPlayers times to cycle back to the first player
      for (let i = 0; i < totalPlayers; i++) {
        await user.click(button);
        rerender(<GamePlay />);
      }

      const finalPlayerId = useGameStore.getState().currentTurn?.activePlayerId;

      // Should be back to the initial player
      expect(finalPlayerId).toBe(initialPlayerId);
    });

    it('should not affect cluesRead when passing turn', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      // Advance to clue 3
      store.nextClue();
      store.nextClue();
      store.nextClue();

      render(<GamePlay />);

      const cluesReadBefore = useGameStore.getState().currentTurn?.cluesRead;
      expect(cluesReadBefore).toBe(3);

      // Pass turn
      const button = screen.getByRole('button', { name: 'Pass' });
      await user.click(button);

      const cluesReadAfter = useGameStore.getState().currentTurn?.cluesRead;

      // Clues read should remain the same
      expect(cluesReadAfter).toBe(3);
    });
  });
});
