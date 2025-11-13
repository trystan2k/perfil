import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import { GameSetup } from '../GameSetup';

// Mock the game store
const mockGetState = vi.fn();
vi.mock('@/stores/gameStore', () => ({
  useGameStore: vi.fn(),
}));

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('GameSetup', () => {
  const mockCreateGame = vi.fn();
  let mockGameId = '';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockGameId = `game-${Date.now()}`;

    // Mock zustand store with getState support
    const useGameStoreMock = useGameStore as unknown as ReturnType<typeof vi.fn> & {
      getState: typeof mockGetState;
    };

    useGameStoreMock.mockImplementation(
      (selector: (state: { createGame: typeof mockCreateGame; id: string }) => unknown) =>
        selector({ createGame: mockCreateGame, id: mockGameId })
    );

    useGameStoreMock.getState = mockGetState.mockReturnValue({
      id: mockGameId,
      createGame: mockCreateGame,
    });
  });

  describe('Initial Render', () => {
    it('should render the game setup form', () => {
      render(<GameSetup />);

      expect(screen.getByText('Game Setup')).toBeInTheDocument();
      expect(
        screen.getByText('Add players to start a new game. You need at least 2 players.')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter player name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    });

    it('should have start game button disabled initially', () => {
      render(<GameSetup />);

      const startButton = screen.getByRole('button', { name: /start game/i });
      expect(startButton).toBeDisabled();
    });

    it('should have add button disabled when input is empty', () => {
      render(<GameSetup />);

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Adding Players', () => {
    it('should add a player when clicking the add button', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Players (1/8)')).toBeInTheDocument();
    });

    it('should add a player when pressing Enter key', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      await user.type(input, 'Bob{Enter}');

      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should clear input after adding a player', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name') as HTMLInputElement;
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Charlie');
      await user.click(addButton);

      expect(input.value).toBe('');
    });

    it('should add multiple players', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      await user.type(input, 'Charlie');
      await user.click(addButton);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Players (3/8)')).toBeInTheDocument();
    });

    it('should trim whitespace from player names', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, '  Dave  ');
      await user.click(addButton);

      expect(screen.getByText('Dave')).toBeInTheDocument();
    });
  });

  describe('Player Validation', () => {
    it('should not allow clicking add button with empty name', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, '   ');

      // Button should be disabled with whitespace
      expect(addButton).toBeDisabled();
    });

    it('should show error when adding duplicate player name', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Alice');
      await user.click(addButton);

      expect(screen.getByText('Player name already exists')).toBeInTheDocument();
    });

    it('should not trigger error when max players reached and button disabled', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add 8 players
      for (let i = 1; i <= 8; i++) {
        await user.type(input, `Player${i}`);
        await user.click(addButton);
      }

      // Add text to input - button should be disabled
      await user.type(input, 'Player9');

      expect(addButton).toBeDisabled();
      // Error shouldn't show because button is disabled
      expect(screen.queryByText('Maximum 8 players allowed')).not.toBeInTheDocument();
    });

    it('should disable add button when 8 players are added', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add 8 players
      for (let i = 1; i <= 8; i++) {
        await user.type(input, `Player${i}`);
        await user.click(addButton);
      }

      // Add text to input
      await user.type(input, 'Player9');

      expect(addButton).toBeDisabled();
    });

    it('should clear error when adding valid player after duplicate error', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add a player
      await user.type(input, 'Alice');
      await user.click(addButton);

      // Try to add duplicate to create error
      await user.type(input, 'Alice');
      await user.click(addButton);
      expect(screen.getByText('Player name already exists')).toBeInTheDocument();

      // Add valid player
      await user.clear(input);
      await user.type(input, 'Bob');
      await user.click(addButton);

      expect(screen.queryByText('Player name already exists')).not.toBeInTheDocument();
    });
  });

  describe('Removing Players', () => {
    it('should remove a player when clicking the remove button', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      const removeButton = screen.getByRole('button', { name: /remove alice/i });
      await user.click(removeButton);

      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.queryByText('Players')).not.toBeInTheDocument();
    });

    it('should remove correct player from multiple players', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      await user.type(input, 'Charlie');
      await user.click(addButton);

      const removeBobButton = screen.getByRole('button', { name: /remove bob/i });
      await user.click(removeBobButton);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Players (2/8)')).toBeInTheDocument();
    });

    it('should clear error when removing player', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      // Create error
      await user.type(input, 'Alice');
      await user.click(addButton);
      expect(screen.getByText('Player name already exists')).toBeInTheDocument();

      // Remove player
      const removeButton = screen.getByRole('button', { name: /remove alice/i });
      await user.click(removeButton);

      expect(screen.queryByText('Player name already exists')).not.toBeInTheDocument();
    });
  });

  describe('Starting Game', () => {
    it('should enable start game button when at least 2 players are added', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      expect(startButton).toBeDisabled();

      await user.type(input, 'Alice');
      await user.click(addButton);
      expect(startButton).toBeDisabled();

      await user.type(input, 'Bob');
      await user.click(addButton);
      expect(startButton).not.toBeDisabled();
    });

    it('should not call createGame when clicking disabled button with less than 2 players', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      // Start button should be disabled with only 1 player
      expect(startButton).toBeDisabled();
      expect(mockCreateGame).not.toHaveBeenCalled();
    });

    it('should call createGame with player names when starting game', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      await user.type(input, 'Charlie');
      await user.click(addButton);

      await user.click(startButton);

      expect(mockCreateGame).toHaveBeenCalledWith(['Alice', 'Bob', 'Charlie']);
    });

    it('should navigate to category selection page after starting game', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      await user.click(startButton);

      // Wait for the async navigation to complete (handleStartGame is now async with delay)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should navigate to category selection page with game ID
      expect(mockLocation.href).toContain('/game-setup/game-');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form elements', () => {
      render(<GameSetup />);

      expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
    });

    it('should have proper aria-label for remove buttons', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      expect(screen.getByRole('button', { name: /remove alice/i })).toBeInTheDocument();
    });
  });

  describe('Validation Edge Cases', () => {
    it('should not add empty player name when pressing Enter', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      // Press Enter with empty input
      await user.click(input);
      await user.keyboard('{Enter}');

      // Should not show player list counter
      expect(screen.queryByText(/players \(/i)).not.toBeInTheDocument();
    });

    it('should not add whitespace-only player name when pressing Enter', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      // Type spaces and press Enter
      await user.type(input, '   {Enter}');

      // Should not show player list counter
      expect(screen.queryByText(/players \(/i)).not.toBeInTheDocument();
    });

    it('should not add 9th player when pressing Enter at 8-player limit', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      // Add 8 players
      for (let i = 1; i <= 8; i++) {
        await user.clear(input);
        await user.type(input, `Player ${i}{Enter}`);
      }

      expect(screen.getByText('Players (8/8)')).toBeInTheDocument();

      // Try to add 9th player with Enter key
      await user.clear(input);
      await user.type(input, 'Player 9{Enter}');

      // Should still have only 8 players
      expect(screen.getByText('Players (8/8)')).toBeInTheDocument();
      expect(screen.queryByText('Player 9')).not.toBeInTheDocument();
    });

    it('should not add player when clicking Add button with empty name', async () => {
      render(<GameSetup />);

      const addButton = screen.getByRole('button', { name: /add/i });

      // Button should be disabled with empty input
      expect(addButton).toBeDisabled();
    });

    it('should not add empty name even if handleAddPlayer is called programmatically', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      // Type whitespace only
      await user.type(input, '   ');

      // Try to trigger via Enter (will call handleAddPlayer with whitespace)
      await user.keyboard('{Enter}');

      // Should not add player
      expect(screen.queryByText(/players \(/i)).not.toBeInTheDocument();
    });

    it('should not exceed 8 players even if handleAddPlayer is called at limit', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      // Add exactly 8 players using Enter key
      for (let i = 1; i <= 8; i++) {
        await user.clear(input);
        await user.type(input, `Player${i}{Enter}`);
      }

      expect(screen.getByText('Players (8/8)')).toBeInTheDocument();

      // Try to add 9th player via Enter
      await user.clear(input);
      await user.type(input, 'Player9{Enter}');

      // Should still have only 8 players
      expect(screen.getByText('Players (8/8)')).toBeInTheDocument();
      expect(screen.queryByText('Player9')).not.toBeInTheDocument();
    });

    it('should handle case-insensitive duplicate names', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add "Alice"
      await user.type(input, 'Alice');
      await user.click(addButton);

      expect(screen.getByText('Alice')).toBeInTheDocument();

      // Try to add "alice" (lowercase)
      await user.type(input, 'alice');
      await user.click(addButton);

      // Should show error
      expect(screen.getByText('Player name already exists')).toBeInTheDocument();

      // Should not add duplicate
      expect(screen.getByText('Players (1/8)')).toBeInTheDocument();
    });

    it('should handle case-insensitive duplicate names with Enter key', async () => {
      const user = userEvent.setup();
      render(<GameSetup />);

      const input = screen.getByLabelText('Player Name');

      // Add "Bob"
      await user.type(input, 'Bob{Enter}');
      expect(screen.getByText('Bob')).toBeInTheDocument();

      // Try to add "BOB" (uppercase)
      await user.type(input, 'BOB{Enter}');

      // Should show error
      expect(screen.getByText('Player name already exists')).toBeInTheDocument();

      // Should not add duplicate
      expect(screen.getByText('Players (1/8)')).toBeInTheDocument();
    });
  });
});
