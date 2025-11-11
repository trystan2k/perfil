import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
        // Check for active player name in the active player section (has text-3xl class)
        const activePlayerElement = screen.getByText(activePlayer.name, {
          selector: '.text-3xl',
        });
        expect(activePlayerElement).toBeInTheDocument();
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
        const initialPlayerElement = screen.getByText(initialPlayer.name, {
          selector: '.text-3xl',
        });
        expect(initialPlayerElement).toBeInTheDocument();
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
        const newPlayerElement = screen.getByText(newPlayer.name, { selector: '.text-3xl' });
        expect(newPlayerElement).toBeInTheDocument();
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
        const initialPlayerElement = screen.getByText(initialPlayer.name, {
          selector: '.text-3xl',
        });
        expect(initialPlayerElement).toBeInTheDocument();
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
        const newPlayerElement = screen.getByText(newPlayer.name, { selector: '.text-3xl' });
        expect(newPlayerElement).toBeInTheDocument();
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

  describe('Player Scoreboard and Scoring Interaction', () => {
    it('should render player scoreboard with header', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      expect(screen.getByText('Players - Tap to Award Points')).toBeInTheDocument();
    });

    it('should display all players with their names and scores', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      const players = useGameStore.getState().players;

      // Use getAllByText to find all instances of player names and scores
      for (const player of players) {
        const playerNameElements = screen.getAllByText(player.name);
        expect(playerNameElements.length).toBeGreaterThanOrEqual(1);
      }

      // Check that there are exactly 3 instances of "0 pts" (one for each player)
      const scoreElements = screen.getAllByText(/\d+ pts/);
      expect(scoreElements).toHaveLength(3);
    });

    it('should disable all player buttons when no clues have been read', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      const players = useGameStore.getState().players;

      for (const player of players) {
        const button = screen.getByRole('button', { name: new RegExp(player.name) });
        expect(button).toBeDisabled();
      }
    });

    it('should show helper text when points cannot be awarded', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');

      render(<GamePlay />);

      expect(screen.getByText('Show at least one clue to award points')).toBeInTheDocument();
    });

    it('should enable player buttons after showing first clue', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;

      for (const player of players) {
        const button = screen.getByRole('button', { name: new RegExp(player.name) });
        expect(button).not.toBeDisabled();
      }
    });

    it('should hide helper text when points can be awarded', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      expect(screen.queryByText('Show at least one clue to award points')).not.toBeInTheDocument();
    });

    it('should call awardPoints with correct player ID when player button is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[1]; // Click second player

      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });

      await user.click(button);

      // Verify player received points (20 - (1 - 1) = 20 points for first clue)
      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      expect(updatedPlayer?.score).toBe(20);
    });

    it('should update displayed score after awarding points', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      const { rerender } = render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];

      // Initially all players have 0 pts
      const playerNameElements = screen.getAllByText(playerToClick.name);
      expect(playerNameElements.length).toBeGreaterThanOrEqual(1);

      const initialScoreElements = screen.getAllByText(/\d+ pts/);
      expect(initialScoreElements).toHaveLength(3);

      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      rerender(<GamePlay />);

      // Should now show 20 pts for one player
      expect(screen.getByText('20 pts')).toBeInTheDocument();
    });

    it('should award correct points based on cluesRead (first clue = 20 pts)', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue(); // cluesRead = 1

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];
      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });

      await user.click(button);

      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      // 20 - (1 - 1) = 20
      expect(updatedPlayer?.score).toBe(20);
    });

    it('should award correct points based on cluesRead (fifth clue = 16 pts)', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');

      // Show 5 clues
      for (let i = 0; i < 5; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[1];
      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });

      await user.click(button);

      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      // 20 - (5 - 1) = 16
      expect(updatedPlayer?.score).toBe(16);
    });

    it('should accumulate points for multiple correct answers by same player', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue(); // First round

      const { rerender } = render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];

      // First correct answer
      let button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      rerender(<GamePlay />);

      // Verify first points awarded (20 pts)
      let updatedPlayers = useGameStore.getState().players;
      let updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);
      expect(updatedPlayer?.score).toBe(20);

      // Second round - show 3 clues
      for (let i = 0; i < 3; i++) {
        store.nextClue();
      }

      rerender(<GamePlay />);

      // Second correct answer
      button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      updatedPlayers = useGameStore.getState().players;
      updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      // 20 + (20 - (3 - 1)) = 20 + 18 = 38
      expect(updatedPlayer?.score).toBe(38);
    });

    it('should highlight active player button with default variant', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      const state = useGameStore.getState();
      const activePlayer = state.players.find((p) => p.id === state.currentTurn?.activePlayerId);

      expect(activePlayer).toBeDefined();
      if (activePlayer) {
        const activeButton = screen.getByRole('button', { name: new RegExp(activePlayer.name) });
        // Default variant buttons don't have the 'outline' class
        expect(activeButton).not.toHaveClass('outline');
      }
    });

    it('should display non-active players with outline variant', () => {
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      const state = useGameStore.getState();
      const nonActivePlayers = state.players.filter(
        (p) => p.id !== state.currentTurn?.activePlayerId
      );

      for (const player of nonActivePlayers) {
        const button = screen.getByRole('button', { name: new RegExp(player.name) });
        // Outline variant buttons have the class
        expect(button).toHaveClass('border-input');
      }
    });

    it('should allow awarding points to any player, not just active player', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;

      // Find a non-active player
      const nonActivePlayer = players.find((p) => p.id !== activePlayerId);

      expect(nonActivePlayer).toBeDefined();
      if (nonActivePlayer) {
        const button = screen.getByRole('button', { name: new RegExp(nonActivePlayer.name) });

        await user.click(button);

        const updatedPlayers = useGameStore.getState().players;
        const updatedPlayer = updatedPlayers.find((p) => p.id === nonActivePlayer.id);

        expect(updatedPlayer?.score).toBe(20);
      }
    });

    it('should start new turn after awarding points', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame('Movies');
      store.nextClue();

      render(<GamePlay />);

      const initialPlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      const players = useGameStore.getState().players;
      const playerToClick = players[0];

      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      const newPlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      const newCluesRead = useGameStore.getState().currentTurn?.cluesRead;

      // Should advance to next player and reset clues
      expect(newPlayerId).not.toBe(initialPlayerId);
      expect(newCluesRead).toBe(0);
    });
  });
});
