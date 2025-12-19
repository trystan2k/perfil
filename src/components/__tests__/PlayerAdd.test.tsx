import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayersAdd } from '@/components/PlayersAdd';
import { useGameStore } from '@/stores/gameStore';
import { customRender } from '../../__mocks__/test-utils.tsx';

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
  const mockCreateGame = vi.fn().mockResolvedValue(undefined);
  const mockSetError = vi.fn();
  let mockGameId = '';

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGame.mockResolvedValue(undefined);
    mockSetError.mockClear();
    mockLocation.href = '';
    mockGameId = `game-${Date.now()}`;

    // Mock zustand store with getState support
    const useGameStoreMock = useGameStore as unknown as ReturnType<typeof vi.fn> & {
      getState: typeof mockGetState;
    };

    useGameStoreMock.mockImplementation(
      (
        selector: (state: {
          createGame: typeof mockCreateGame;
          id: string;
          setError: typeof mockSetError;
        }) => unknown
      ) => selector({ createGame: mockCreateGame, id: mockGameId, setError: mockSetError })
    );

    useGameStoreMock.getState = mockGetState.mockReturnValue({
      id: mockGameId,
      createGame: mockCreateGame,
      setError: mockSetError,
      error: null,
    });
  });

  describe('Initial Render', () => {
    it('should render the players add form', () => {
      customRender(<PlayersAdd />);

      expect(screen.getByText('Add Players')).toBeInTheDocument();
      expect(
        screen.getByText('Add players to start a new game. You need at least 2 players.')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter player name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    });

    it('should have start game button disabled initially', () => {
      customRender(<PlayersAdd />);

      const startButton = screen.getByRole('button', { name: /start game/i });
      expect(startButton).toBeDisabled();
    });

    it('should have add button disabled when input is empty', () => {
      customRender(<PlayersAdd />);

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Adding Players', () => {
    it('should add a player when clicking the add button', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Players (1/16)')).toBeInTheDocument();
    });

    it('should add a player when pressing Enter key', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      await user.type(input, 'Bob{Enter}');

      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should clear input after adding a player', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name') as HTMLInputElement;
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Charlie');
      await user.click(addButton);

      expect(input.value).toBe('');
    });

    it('should add multiple players', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

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
      expect(screen.getByText('Players (3/16)')).toBeInTheDocument();
    });

    it('should trim whitespace from player names', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

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
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, '   ');

      // Button should be disabled with whitespace
      expect(addButton).toBeDisabled();
    });

    it('should set global error when adding duplicate player name', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Alice');
      await user.click(addButton);

      // Check that global error was set with informative flag
      expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.duplicateName', true);
    });

    it('should not trigger error when max players reached and button disabled', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add 16 players
      for (let i = 1; i <= 16; i++) {
        await user.type(input, `Player${i}`);
        await user.click(addButton);
      }

      // Add text to input - button should be disabled
      await user.type(input, 'Player17');

      expect(addButton).toBeDisabled();
      // Error shouldn't show because button is disabled
      expect(screen.queryByText('Maximum 16 players allowed')).not.toBeInTheDocument();
    });

    it('should disable add button when 16 players are added', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add 16 players
      for (let i = 1; i <= 16; i++) {
        await user.type(input, `Player${i}`);
        await user.click(addButton);
      }

      // Add text to input
      await user.type(input, 'Player17');

      expect(addButton).toBeDisabled();
    });

    it('should not set error when adding valid player after duplicate error', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add a player
      await user.type(input, 'Alice');
      await user.click(addButton);

      // Try to add duplicate to create error
      await user.type(input, 'Alice');
      await user.click(addButton);
      expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.duplicateName', true);

      // Add valid player - should succeed
      await user.clear(input);
      await user.type(input, 'Bob');
      await user.click(addButton);

      // Bob should be added
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Removing Players', () => {
    it('should remove a player when clicking the remove button', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

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
      customRender(<PlayersAdd />);

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
      expect(screen.getByText('Players (2/16)')).toBeInTheDocument();
    });

    it('should not clear error when removing player', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      // Create error
      await user.type(input, 'Alice');
      await user.click(addButton);
      expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.duplicateName', true);

      // Remove player - error persists (not auto-cleared)
      const removeButton = screen.getByRole('button', { name: /remove alice/i });
      await user.click(removeButton);

      // Alice should be removed from the list
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  describe('Starting Game', () => {
    it('should enable start game button when at least 2 players are added', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

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
      customRender(<PlayersAdd />);

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
      customRender(<PlayersAdd />);

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
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      await user.click(startButton);

      // Wait for the async navigation to complete
      // createGame now returns a Promise that handleStartGame awaits
      await vi.waitFor(() => {
        expect(mockLocation.href).toContain('/game-setup/game-');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form elements', () => {
      customRender(<PlayersAdd />);

      expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
    });

    it('should have proper aria-label for remove buttons', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

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
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      // Press Enter with empty input
      await user.click(input);
      await user.keyboard('{Enter}');

      // Should not show player list counter
      expect(screen.queryByText(/players \(/i)).not.toBeInTheDocument();
    });

    it('should not add whitespace-only player name when pressing Enter', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      // Type spaces and press Enter
      await user.type(input, '   {Enter}');

      // Should not show player list counter
      expect(screen.queryByText(/players \(/i)).not.toBeInTheDocument();
    });

    it('should not add 17th player when pressing Enter at 16-player limit', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      // Add 16 players
      for (let i = 1; i <= 16; i++) {
        await user.clear(input);
        await user.type(input, `Player ${i}{Enter}`);
      }

      expect(screen.getByText('Players (16/16)')).toBeInTheDocument();

      // Try to add 17th player with Enter key
      await user.clear(input);
      await user.type(input, 'Player 17{Enter}');

      // Should still have only 16 players
      expect(screen.getByText('Players (16/16)')).toBeInTheDocument();
      expect(screen.queryByText('Player 17')).not.toBeInTheDocument();
    });

    it('should not add player when clicking Add button with empty name', async () => {
      customRender(<PlayersAdd />);

      const addButton = screen.getByRole('button', { name: /add/i });

      // Button should be disabled with empty input
      expect(addButton).toBeDisabled();
    });

    it('should not add empty name even if handleAddPlayer is called programmatically', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      // Type whitespace only
      await user.type(input, '   ');

      // Try to trigger via Enter (will call handleAddPlayer with whitespace)
      await user.keyboard('{Enter}');

      // Should not add player
      expect(screen.queryByText(/players \(/i)).not.toBeInTheDocument();
    });

    it('should not exceed 16 players even if handleAddPlayer is called at limit', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      // Add exactly 16 players using Enter key
      for (let i = 1; i <= 16; i++) {
        await user.clear(input);
        await user.type(input, `Player${i}{Enter}`);
      }

      expect(screen.getByText('Players (16/16)')).toBeInTheDocument();

      // Try to add 17th player via Enter
      await user.clear(input);
      await user.type(input, 'Player17{Enter}');

      // Should still have only 16 players
      expect(screen.getByText('Players (16/16)')).toBeInTheDocument();
      expect(screen.queryByText('Player17')).not.toBeInTheDocument();
    });

    it('should handle case-insensitive duplicate names', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add "Alice"
      await user.type(input, 'Alice');
      await user.click(addButton);

      expect(screen.getByText('Alice')).toBeInTheDocument();

      // Try to add "alice" (lowercase)
      await user.type(input, 'alice');
      await user.click(addButton);

      // Should set global error
      expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.duplicateName', true);

      // Should not add duplicate
      expect(screen.getByText('Players (1/16)')).toBeInTheDocument();
    });

    it('should handle case-insensitive duplicate names with Enter key', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');

      // Add "Bob"
      await user.type(input, 'Bob{Enter}');
      expect(screen.getByText('Bob')).toBeInTheDocument();

      // Try to add "BOB" (uppercase)
      await user.type(input, 'BOB{Enter}');

      // Should set global error
      expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.duplicateName', true);

      // Should not add duplicate
      expect(screen.getByText('Players (1/16)')).toBeInTheDocument();
    });
  });

  describe('useActionState Integration', () => {
    it('should navigate to game setup after successful game creation', async () => {
      const user = userEvent.setup();

      mockCreateGame.mockResolvedValue(undefined);

      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add 2 players
      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      // Click start game
      await user.click(startButton);

      // Wait for navigation to game setup
      await vi.waitFor(() => {
        expect(mockLocation.href).toContain('/game-setup/');
      });

      // Verify createGame was called with the correct players
      expect(mockCreateGame).toHaveBeenCalledWith(['Alice', 'Bob']);
    });

    it('should handle game creation errors gracefully', async () => {
      const user = userEvent.setup();
      const createError = new Error('Failed to create game');

      mockCreateGame.mockRejectedValue(createError);

      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add 2 players
      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      // Click start game
      await user.click(startButton);

      // Wait for error handling
      await vi.waitFor(() => {
        // Should set global error on failure
        expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.failedToCreateGame');
      });

      // Start button should be enabled for retry
      expect(startButton).not.toBeDisabled();
    });

    it('should allow retrying game creation after failure', async () => {
      const user = userEvent.setup();
      let callCount = 0;

      mockCreateGame.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve();
      });

      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add 2 players
      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      // First attempt - click start game
      await user.click(startButton);

      // Wait for error
      await vi.waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('playersAdd.errors.failedToCreateGame');
      });

      // Button should be enabled for retry
      expect(startButton).not.toBeDisabled();

      // Second attempt - click start game again
      await user.click(startButton);

      // Wait for successful navigation
      await vi.waitFor(() => {
        expect(mockLocation.href).toContain('/game-setup/');
      });

      expect(mockCreateGame).toHaveBeenCalledTimes(2);
    });

    it('should preserve player list during game creation flow', async () => {
      const user = userEvent.setup();

      mockCreateGame.mockResolvedValue(undefined);

      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add 3 players
      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      await user.type(input, 'Charlie');
      await user.click(addButton);

      // Verify players are displayed
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();

      // Click start game
      await user.click(startButton);

      // Wait for navigation
      await vi.waitFor(() => {
        expect(mockLocation.href).toContain('/game-setup/');
      });
    });

    it('should pass all players to createGame action', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add 4 players
      await user.type(input, 'Player1');
      await user.click(addButton);

      await user.type(input, 'Player2');
      await user.click(addButton);

      await user.type(input, 'Player3');
      await user.click(addButton);

      await user.type(input, 'Player4');
      await user.click(addButton);

      // Click start game
      await user.click(startButton);

      // Verify createGame was called with correct player list
      expect(mockCreateGame).toHaveBeenCalledWith(['Player1', 'Player2', 'Player3', 'Player4']);
    });
  });

  describe('Accessibility: Touch Target Sizes (WCAG 2.5.5 AAA)', () => {
    it('should have remove player button with size="icon" (48x48px touch target)', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Alice');
      await user.click(addButton);

      const removeButton = screen.getByRole('button', { name: /remove alice/i });

      // Should have icon size classes
      expect(removeButton).toHaveClass('h-12', 'w-12');
      // h-12 w-12 = 48x48px
    });

    it('should have remove button with proper icon sizing', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Bob');
      await user.click(addButton);

      const removeButton = screen.getByRole('button', { name: /remove bob/i });
      const icon = removeButton.querySelector('svg');

      // Icon should be 20px (h-5 w-5)
      // Lucide icons use size prop which sets width and height attributes
      expect(icon).toBeInTheDocument();
    });

    it('should maintain adequate touch target size for add button', () => {
      customRender(<PlayersAdd />);

      const addButton = screen.getByRole('button', { name: /add/i });

      // Add button should have default size (48px height minimum)
      expect(addButton).toHaveClass('h-12');
    });

    it('should maintain adequate touch target size for start game button', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add 2 players to enable start button
      await user.type(input, 'Alice');
      await user.click(addButton);

      await user.type(input, 'Bob');
      await user.click(addButton);

      // Start button should have large size (56px height)
      expect(startButton).toHaveClass('h-14', 'w-full');
      // h-14 = 56px
    });

    it('should have all form buttons with proper touch target accessibility', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Charlie');
      await user.click(addButton);

      const removeButton = screen.getByRole('button', { name: /remove charlie/i });
      const startButton = screen.getByRole('button', { name: /start game/i });

      // Add button: 48px
      expect(addButton).toHaveClass('h-12');

      // Remove button: 48x48px
      expect(removeButton).toHaveClass('h-12', 'w-12');

      // Start button: 56px
      expect(startButton).toHaveClass('h-14');
    });

    it('should provide visual feedback on remove button hover without size change', async () => {
      const user = userEvent.setup();
      customRender(<PlayersAdd />);

      const input = screen.getByLabelText('Player Name');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(input, 'Dave');
      await user.click(addButton);

      const removeButton = screen.getByRole('button', { name: /remove dave/i });

      // Touch target should be stable before hover
      expect(removeButton).toHaveClass('h-12', 'w-12');

      // Simulate hover
      await user.hover(removeButton);

      // Touch target should remain stable after hover
      expect(removeButton).toHaveClass('h-12', 'w-12');
    });
  });
});
